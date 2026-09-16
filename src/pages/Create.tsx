import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { X, Box, Video, Briefcase, ChevronRight, Camera, Loader2, Play, Trash2, Search, Tag, Grip, Plus, Check } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/lib/supabase";
import { uploadManyToCloudinary, type CloudinaryUploadResult } from "@/lib/cloudinary";
import { toast } from "sonner";
import { createPostShopTags, searchProducts, type CatalogProduct } from "@/services/shopTagsService";
import { createRemixNotification } from "@/services/remixService";
import { fetchPostById } from "@/services/postsService";

type Mode = null | "product" | "short" | "service";
type PostType = "product" | "inspiration";

const POST_EXPERIENCES: { key: PostType; icon: typeof Box; title: string; desc: string; color: string }[] = [
  { key: "inspiration", icon: Video, title: "Inspiration", desc: "Express your style, story or creativity.", color: "from-brand-purple to-brand-pink" },
  { key: "product", icon: Box, title: "Shoppable", desc: "Share fashion and connect it to products.", color: "from-brand-pink to-brand-purple" },
];

const TYPES = [
  { key: "product" as const, icon: Box, title: "Post Product", desc: "Sell fashion, sneakers, accessories…", color: "from-brand-pink to-brand-purple" },
  { key: "short" as const, icon: Video, title: "Post Short Video", desc: "Vertical 9:16 — appears in Shorts", color: "from-brand-pink to-brand-purple" },
  { key: "service" as const, icon: Briefcase, title: "Post Service", desc: "Tailoring, beauty, styling & more", color: "from-brand-purple to-brand-pink" },
];

type MediaItem = {
  file: File;
  previewUrl: string;
  kind: "image" | "video";
  uploaded?: CloudinaryUploadResult;
};

type TaggedProduct = {
  id: string;
  item_name: string;
  price: number;
  position_x: number;
  position_y: number;
  linked_product_id: string | null;
  linkedProduct: CatalogProduct | null;
};

const MAX_MEDIA = 5;

const Create = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, isAuthed } = useIdentity();

  const [mode, setMode] = useState<Mode>(null);
  const [postType, setPostType] = useState<PostType>("product");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<CatalogProduct[]>([]);
  const [taggedProducts, setTaggedProducts] = useState<TaggedProduct[]>([]);
  const [tagFormOpen, setTagFormOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [tagPosition, setTagPosition] = useState({ x: 0.5, y: 0.5 });
  const [linkedProduct, setLinkedProduct] = useState<CatalogProduct | null>(null);
  const [remixSource, setRemixSource] = useState<{ id: string; handle: string } | null>(null);
  const mediaStageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Create Post — Shopitt";
  }, []);

  useEffect(() => {
    const sourceId = searchParams.get("remixFrom");
    if (!sourceId) { setRemixSource(null); return; }
    let cancelled = false;
    void fetchPostById(sourceId).then(({ data }) => {
      if (!cancelled && data) {
        setRemixSource({ id: data.id, handle: data.profiles?.username ?? "creator" });
        setPostType("product");
        setMode("product");
      }
    });
    return () => { cancelled = true; };
  }, [searchParams]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptTypes =
    mode === "short" ? "video/*" : "image/*,video/*";

  const onPickFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const remaining = MAX_MEDIA - media.length;
    const chosen = Array.from(files).slice(0, remaining);
    const next: MediaItem[] = chosen.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      kind: file.type.startsWith("video/") ? "video" : "image",
    }));
    setMedia((m) => [...m, ...next]);
  };

  const removeMedia = (i: number) => {
    setMedia((m) => {
      const copy = [...m];
      const [gone] = copy.splice(i, 1);
      if (gone) URL.revokeObjectURL(gone.previewUrl);
      return copy;
    });
  };

  const resetForm = () => {
    media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setMedia([]);
    setTitle("");
    setDescription("");
    setHashtags("");
    setPrice("");
    setStock("");
    setTaggedProducts([]);
    setTagEditorOpen(false);
    setProductSelectorOpen(false);
    setTagFormOpen(false);
    setProductQuery("");
    setRemixSource(null);
    setMode(null);
  };

  const parseHashtags = (s: string) =>
    s
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

  useEffect(() => {
    if (!productSelectorOpen || !user || postType !== "product") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchProducts(productQuery).then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error(error);
        setProductResults(data);
      });
    }, 200);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [productSelectorOpen, productQuery, postType, user]);

  const openTagForm = (event: ReactPointerEvent<HTMLDivElement>) => {
    const stage = mediaStageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    setTagPosition({
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    });
    setItemName("");
    setItemPrice("");
    setLinkedProduct(null);
    setProductSelectorOpen(false);
    setTagFormOpen(true);
  };

  const saveTag = () => {
    if (!itemName.trim()) { toast.error("Enter an item name"); return; }
    const numericPrice = Number(itemPrice);
    if (!itemPrice.trim() || !Number.isFinite(numericPrice) || numericPrice < 0) { toast.error("Enter a valid price"); return; }
    if (linkedProduct && taggedProducts.some((tag) => tag.linked_product_id === linkedProduct.id)) { toast.error("That Shopitt product is already linked to a tag"); return; }
    setTaggedProducts((current) => [...current, {
      id: crypto.randomUUID(),
      item_name: itemName.trim(),
      price: numericPrice,
      position_x: tagPosition.x,
      position_y: tagPosition.y,
      linked_product_id: linkedProduct?.id ?? null,
      linkedProduct,
    }]);
    setTagFormOpen(false);
  };

  const moveTag = (index: number, event: ReactPointerEvent<HTMLButtonElement>) => {
    const stage = mediaStageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    const update = (moveEvent: PointerEvent) => {
      const x = Math.min(1, Math.max(0, (moveEvent.clientX - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (moveEvent.clientY - bounds.top) / bounds.height));
      setTaggedProducts((current) => current.map((tag, tagIndex) => tagIndex === index ? { ...tag, position_x: x, position_y: y } : tag));
    };
    const stop = () => {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", update);
    window.addEventListener("pointerup", stop, { once: true });
    event.preventDefault();
  };

  const onSubmit = async () => {
    if (!isAuthed || !user) {
      toast.error("Please sign in to post");
      return;
    }
    if (!title.trim()) {
      toast.error("Add a drop title");
      return;
    }
    if (media.length === 0) {
      toast.error("Add at least one photo or video");
      return;
    }
    if (postType === "product" && !price.trim()) {
      toast.error("Add a price");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Upload every media file to Cloudinary
      const uploads = await uploadManyToCloudinary(
        media.map((m) => m.file),
        { folder: `shopitt/${user.id}`, resourceType: "auto" },
      );

      const primary = uploads[0];
      const mediaUrls = uploads.map((u) => u.secure_url);
      const isVideo =
        primary.resource_type === "video" || media[0].kind === "video";
      const finalPostType = postType;

      // 2. Insert into posts using ONLY columns known to exist in the schema
      const payload: Record<string, any> = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        media_url: primary.secure_url,
        media_urls: mediaUrls,
        media_type: isVideo ? "video" : "image",
        post_type: finalPostType,
        content_type: finalPostType,
        remixed_from_post_id: remixSource?.id ?? null,
        hashtags: parseHashtags(hashtags),
        price:
          finalPostType === "product" && price ? Number(price) : null,
        // `quantity` is the established commerce field used by the mobile
        // creator and order flow.  Do not write a parallel stock column.
        quantity: finalPostType === "product" && stock ? Number(stock) : null,
        currency: "ZMW",
        is_available: true,
      };

      const { data: createdPost, error } = await supabase.from("posts").insert(payload).select("id").single();
      if (error || !createdPost) throw error ?? new Error("Post was not created");

      if (finalPostType === "product" && taggedProducts.length > 0) {
        const { error: tagError } = await createPostShopTags(createdPost.id, user.id, taggedProducts.map(({ item_name, price, position_x, position_y, linked_product_id }) => ({ item_name, price, position_x, position_y, linked_product_id })));
        if (tagError) throw new Error(`Post created, but products could not be tagged: ${tagError}`);
      }

      if (remixSource) {
        const { error: notificationError } = await createRemixNotification(remixSource.id, user.id, `@${profile?.username ?? "Someone"} remixed your Look`);
        if (notificationError) throw new Error(`Remix created, but attribution notification failed: ${notificationError}`);
      }

      toast.success("Posted! 🔥");
      resetForm();
      navigate("/");
    } catch (err: any) {
      console.error("Create post failed", err);
      toast.error(err?.message ?? "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {mode ? (
            <button onClick={() => setMode(null)} aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          ) : (
            <Link to="/" aria-label="Close" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
              <X className="h-5 w-5" />
            </Link>
          )}
          <h1 className="text-base font-bold">Create Post</h1>
          {mode ? (
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-full gradient-brand text-white px-4 py-1.5 text-xs font-extrabold shadow-brand inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {submitting ? "Posting" : "Post"}
            </button>
          ) : (
            <span className="w-16" />
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6 pb-32">
        {!mode ? (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight">What are you creating?</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose your post type to get started</p>

            <ul className="mt-6 space-y-3">
              {POST_EXPERIENCES.map((t) => (
                <li key={t.key}>
                  <button
                    onClick={() => {
                      setPostType(t.key);
                      setMode("product");
                    }}
                    className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-4 hover:bg-muted/40 transition-colors text-left"
                  >
                    <span className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-brand`}>
                      <t.icon className="h-6 w-6 text-white" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-foreground">{t.title}</span>
                      <span className="block text-xs text-muted-foreground truncate">{t.desc}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>

            {!isAuthed && (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                Sign in from the menu before creating a post.
              </p>
            )}
          </>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {remixSource && (
              <div className="rounded-2xl border border-brand-pink/20 bg-brand-pink/5 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-pink">REMIXING</p>
                <Link to={`/p/${remixSource.id}`} className="mt-1 block text-sm font-bold text-foreground">@{remixSource.handle}</Link>
              </div>
            )}
            {mode === "product" && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Post type</span>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-full bg-muted/50 p-1">
                  {(["product", "inspiration"] as PostType[]).map((t) => {
                    const active = postType === t;
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setPostType(t)}
                        className={`h-9 rounded-full text-xs font-extrabold capitalize transition-all ${
                          active ? "gradient-brand text-white shadow-brand" : "text-muted-foreground"
                        }`}
                      >
                          {t === "inspiration" ? "Creative / Inspiration" : "Shoppable"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media picker — gallery upload */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Media {media.length}/{MAX_MEDIA}
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {media.map((m, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-muted"
                  >
                    {m.kind === "video" ? (
                      <>
                        <video
                          src={m.previewUrl}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-6 w-6 text-white" />
                        </span>
                      </>
                    ) : (
                      <img
                        src={m.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center text-white"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {media.length < MAX_MEDIA && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center text-center hover:bg-muted/40 transition-colors"
                  >
                    <Camera className="h-6 w-6 text-brand-pink" />
                    <span className="mt-1 text-[11px] font-semibold text-foreground">
                      From gallery
                    </span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptTypes}
                multiple
                hidden
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Upload photos or videos straight from your gallery.
              </p>
            </div>

            {postType === "product" && (
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-pink">SHOP TAGS</p>
                    <p className="mt-1 text-sm font-semibold">{taggedProducts.length} {taggedProducts.length === 1 ? "product" : "products"} tagged</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTagEditorOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-3.5 py-2.5 text-xs font-extrabold text-white shadow-brand"
                  >
                    <Tag className="h-3.5 w-3.5" /> {taggedProducts.length ? "EDIT SHOP TAGS" : "ADD SHOP TAGS"}
                  </button>
                </div>
              </div>
            )}

            {postType === "product" && tagEditorOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0E0E0E] text-white">
                <div className="mx-auto min-h-[100dvh] max-w-xl px-4 pb-8">
                  <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-white/10 bg-[#0E0E0E]/95 px-4 py-3 backdrop-blur-xl">
                    <button type="button" onClick={() => { setTagEditorOpen(false); setProductSelectorOpen(false); }} aria-label="Close shop tag editor" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"><X className="h-5 w-5" /></button>
                    <div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-pink">SHOPPABLE POST</p><h2 className="text-base font-extrabold">ADD SHOP TAGS</h2></div>
                    <button type="button" onClick={() => { setTagEditorOpen(false); setProductSelectorOpen(false); }} className="rounded-full gradient-brand px-3 py-2 text-xs font-bold text-white">Done</button>
                  </header>

                  <p className="py-4 text-sm text-white/70">Tag the products featured in this outfit.</p>

                  {media.length > 0 && (
                    <div ref={mediaStageRef} onPointerDown={openTagForm} className="relative aspect-[4/5] max-h-[68dvh] overflow-hidden rounded-2xl bg-black">
                      {media[0].kind === "video" ? <video src={media[0].previewUrl} muted playsInline controls className="h-full w-full object-contain" /> : <img src={media[0].previewUrl} alt="Shop tag placement preview" className="h-full w-full object-contain" />}
                      {taggedProducts.map((tag, index) => (
                        <button key={tag.id} type="button" onPointerDown={(event) => { event.stopPropagation(); moveTag(index, event); }} className="absolute flex max-w-[70%] -translate-x-1/2 -translate-y-1/2 touch-none items-center gap-1 rounded-full border border-white/70 bg-black/80 px-3 py-2 text-[11px] font-bold text-white shadow-lg" style={{ left: `${tag.position_x * 100}%`, top: `${tag.position_y * 100}%` }}>
                          <Grip className="h-3.5 w-3.5 shrink-0 text-brand-pink" /><span className="truncate">{tag.item_name}</span>
                          <span role="button" tabIndex={0} onPointerDown={(event) => event.stopPropagation()} onClick={() => setTaggedProducts((current) => current.filter((_, tagIndex) => tagIndex !== index))} className="ml-1 shrink-0 text-white/60">×</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between"><p className="text-sm font-bold">Shop Tags: {taggedProducts.length}</p><p className="text-[11px] text-white/50">Tap the outfit to add a tag</p></div>

                  {tagFormOpen && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-pink">IDENTIFY THIS ITEM</p>
                      <div className="mt-3 grid gap-3">
                        <label className="text-xs font-bold">ITEM NAME<input autoFocus value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="e.g. Oversized Leather Jacket" className="mt-1.5 h-11 w-full rounded-xl bg-white/10 px-3 text-sm font-normal outline-none ring-brand-pink focus:ring-2" /></label>
                        <label className="text-xs font-bold">PRICE<input type="number" min="0" step="0.01" inputMode="decimal" value={itemPrice} onChange={(event) => setItemPrice(event.target.value)} placeholder="450" className="mt-1.5 h-11 w-full rounded-xl bg-white/10 px-3 text-sm font-normal outline-none ring-brand-pink focus:ring-2" /></label>
                      </div>
                      <button type="button" onClick={() => setProductSelectorOpen((open) => !open)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-pink"><Plus className="h-3.5 w-3.5" /> LINK EXISTING SHOPITT PRODUCT <span className="font-normal text-white/45">(optional)</span></button>
                      <div className="mt-3 flex gap-2"><button type="button" onClick={() => setTagFormOpen(false)} className="flex-1 rounded-full border border-white/20 px-4 py-2.5 text-xs font-bold">CANCEL</button><button type="button" onClick={saveTag} className="flex-1 rounded-full gradient-brand px-4 py-2.5 text-xs font-bold text-white">ADD TAG</button></div>
                    </div>
                  )}

                  {productSelectorOpen && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3"><Search className="h-4 w-4 text-white/60" /><input autoFocus value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Search your products" className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45" /></div>
                      <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                        {productResults.map((product) => (
                          <button key={product.id} type="button" onClick={() => { setLinkedProduct(product); setProductSelectorOpen(false); }} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-white/10">
                            <img src={product.image_url} alt={product.title} className="h-12 w-11 shrink-0 rounded-lg object-cover" />
                            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{product.title}</span><span className="block text-xs text-white/60">${Number(product.price_usd).toFixed(2)} · {product.is_available ? "Available" : "Unavailable"}</span></span>
                            <Check className="h-4 w-4 text-brand-pink" />
                          </button>
                        ))}
                        {productResults.length === 0 && <p className="py-5 text-center text-xs text-white/55">No authorized products found.</p>}
                      </div>
                    </div>
                  )}

                  {linkedProduct && <p className="mt-3 text-xs text-white/65">Linked Shopitt product: <span className="font-bold text-white">{linkedProduct.title}</span></p>}
                  {taggedProducts.length > 0 && <div className="mt-4 space-y-2">{taggedProducts.map((tag) => <div key={tag.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2"><p className="min-w-0 flex-1 truncate text-xs font-semibold">{tag.item_name}</p><span className="text-xs text-white/60">K{tag.price}</span>{tag.linkedProduct && <span className="text-[10px] text-brand-pink">LINKED</span>}</div>)}</div>}
                </div>
              </div>
            )}

            <div>
              <span className="inline-block rounded-full gradient-brand px-3 py-1 text-[11px] font-bold text-white">Drop Title *</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Air Jordan 1 Retro High"
                className="mt-2 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand-pink"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">This appears as the hook text on your post — make it count.</p>
            </div>

            <div>
              <label className="text-sm font-semibold">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell buyers what makes this special…"
                className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand-pink"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Hashtags</label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#fashion #streetwear #shopzambia"
                className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand-pink"
              />
            </div>

            {(mode === "product" && postType === "product") || mode === "service" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold">Price (K) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm focus:outline-none focus:border-brand-pink"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Quantity</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>
            ) : null}

            {profile && (
              <p className="text-[11px] text-center text-muted-foreground">
                Posting as <span className="font-semibold text-foreground">@{profile.username ?? "you"}</span>
              </p>
            )}
          </form>
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Create;
