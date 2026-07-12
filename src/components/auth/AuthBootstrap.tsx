import { useEffect } from "react";
import { useIdentity } from "@/hooks/useIdentity";
import { shopitt } from "@/store/useShopittStore";
import { FEED } from "@/data/feed";
import { toast } from "sonner";

/**
 * Mount once at the app root.
 * - Subscribes to Supabase auth state
 * - On successful sign-in, restores the pending action (like/save/buy/comment)
 *   that was saved before the OAuth redirect.
 */
export const AuthBootstrap = () => {
  const { user, loading, isAuthed } = useIdentity();

  useEffect(() => {
    shopitt.setAuthed(isAuthed);
  }, [isAuthed]);

  useEffect(() => {
    if (loading || !user) return;

    const raw = sessionStorage.getItem("shopitt:pendingAction");
    if (!raw) return;

    try {
      const pending = JSON.parse(raw) as {
        type: "like" | "save" | "buy" | "comment";
        itemId?: string;
      };
      if (pending.itemId) {
        const item = FEED.find((f) => f.id === pending.itemId);
        if (item) {
          if (pending.type === "like") {
            shopitt.toggleLike(item.id);
            toast.success("Liked 🔥");
          }
          if (pending.type === "save") {
            shopitt.toggleSave(item.id);
            toast.success("Saved to your wishlist");
          }
          if (pending.type === "buy") {
            shopitt.addToBag(item);
            toast.success("Added to your bag");
          }
          if (pending.type === "comment") {
            toast.success("You can comment now");
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore pending action", e);
    } finally {
      sessionStorage.removeItem("shopitt:pendingAction");
      shopitt.setPending(null);
    }
  }, [user, loading]);

  return null;
};
