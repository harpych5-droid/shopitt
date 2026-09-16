import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPostShopTags, type ShopTag } from "@/services/shopTagsService";

type ShopSheetProps = { open: boolean; postId: string; onClose: () => void };

export const ShopSheet = ({ open, postId, onClose }: ShopSheetProps) => {
  const navigate = useNavigate();
  const [tags, setTags] = useState<ShopTag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void fetchPostShopTags(postId).then(({ data }) => {
      if (!cancelled) {
        setTags(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, postId]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button type="button" aria-label="Close shop tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 cursor-default bg-black/60 backdrop-blur-sm" />
          <motion.section role="dialog" aria-modal="true" aria-labelledby="shop-sheet-title" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }} className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[72dvh] max-w-xl overflow-y-auto rounded-t-3xl border-t border-border bg-card safe-bottom">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/95 px-5 py-4 backdrop-blur-xl">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-pink">Outfit annotations</p><h2 id="shop-sheet-title" className="mt-1 font-display text-xl font-extrabold">SHOP THIS LOOK</h2></div>
              <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-4 py-3">
              {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : tags.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No outfit tags were added to this look.</p> : (
                <ul className="space-y-2">
                  {tags.map((tag) => (
                    <li key={tag.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3">
                      {tag.product?.image_url ? <img src={tag.product.image_url} alt={tag.item_name} className="h-14 w-12 shrink-0 rounded-xl object-cover bg-muted" /> : <span className="h-14 w-12 shrink-0 rounded-xl bg-gradient-to-br from-brand-pink/20 to-brand-purple/25" aria-hidden="true" />}
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{tag.item_name}</p><p className="mt-1 text-sm font-extrabold tabular-nums">K{Number(tag.price).toLocaleString()}</p>{tag.product && <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-pink">Available on Shopitt</p>}</div>
                      {tag.product && <button type="button" onClick={() => { onClose(); navigate(`/p/${tag.product?.id}`); }} className="shrink-0 rounded-full gradient-brand px-3 py-2.5 text-[11px] font-bold text-white shadow-brand"><ExternalLink className="mr-1 inline h-3.5 w-3.5" /> VIEW PRODUCT</button>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
};
