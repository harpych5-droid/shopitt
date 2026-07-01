import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Box, Video, Briefcase, ChevronRight, Camera, Loader2, Play, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/lib/supabase";
import { uploadManyToCloudinary, type CloudinaryUploadResult } from "@/lib/cloudinary";
import { toast } from "sonner";

type Mode = null | "product" | "short" | "service";
type PostType = "product" | "inspiration";

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

const MAX_MEDIA = 5;

const Create = () => {
  const navigate = useNavigate();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Create Post — Shopitt";
  }, []);

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
    setMode(null);
  };

  const parseHashtags = (s: string) =>
    s
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

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
    if (mode !== "short" && postType === "product" && !price.trim()) {
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
      const finalPostType: PostType =
        mode === "short" ? "inspiration" : postType;

      // 2. Insert into posts using ONLY columns known to exist in the schema
      const payload: Record<string, any> = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        media_url: primary.secure_url,
        media_urls: mediaUrls,
        media_type: isVideo ? "video" : "image",
        post_type: finalPostType,
        hashtags: parseHashtags(hashtags),
        price:
          finalPostType === "product" && price ? Number(price) : null,
        stock_quantity: stock ? Number(stock) : null,
        currency: "ZMW",
        is_available: true,
      };

      const { error } = await supabase.from("posts").insert(payload);
      if (error) throw error;

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
              {TYPES.map((t) => (
                <li key={t.key}>
                  <button
                    onClick={() => setMode(t.key)}
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
                        {t}
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
                  <label className="text-sm font-semibold">Price (ZMW) *</label>
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
