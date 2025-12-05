import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useShop, Product } from "@/context/ShopProvider";
import { Link } from "react-router-dom";

export type Post = {
  id: string;
  product: Product;
  caption: string;
  hashtags?: string[];
  likes: number;
};

const Avatar = ({ name, color = "hsl(221 100% 58%)" }: { name: string; color?: string }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="grid size-8 place-items-center rounded-full text-xs font-semibold text-primary-foreground"
      style={{ background: color }}
      aria-hidden
    >
      {initials}
    </div>
  );
};

const Media = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative overflow-hidden rounded-lg">
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-auto w-full select-none object-cover will-change-transform"
    />
  </div>
);

const PostCard = ({ post, onBuy }: { post: Post; onBuy: (p: Product) => void }) => {
  const { toggleWishlist, wishlist } = useShop();
  const [liked, setLiked] = useState(false);
  const likeRef = useRef<HTMLButtonElement>(null);

  const likeClick = () => {
    setLiked((v) => !v);
    likeRef.current?.classList.remove("animate-pop");
    void likeRef.current?.offsetWidth;
    likeRef.current?.classList.add("animate-pop");
  };

  const saved = !!wishlist[post.product.id];

  return (
    <article className="animate-fade-in-up space-y-2">
      <header className="flex items-center gap-2 px-2">
        <Avatar name={post.product.seller.name} />
        <div className="leading-tight">
          <Link to={`/profile/${post.product.seller.handle}`} className="block text-sm font-semibold">
            {post.product.seller.name}
          </Link>
          <span className="text-xs text-muted-foreground">@{post.product.seller.handle}</span>
        </div>
      </header>

      <div className="relative">
        <Media src={post.product.media[0]} alt={post.product.title} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button variant="cta" size="sm" onClick={() => onBuy(post.product)}>
            Buy Now • {post.product.currency}
            {post.product.price.toFixed(0)}
          </Button>
        </div>
        <button
          aria-label="Save to wishlist"
          onClick={() => toggleWishlist(post.product.id)}
          className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition hover:bg-background"
        >
          <Heart className={saved ? "fill-current" : undefined} />
        </button>
      </div>

      <div className="px-2">
        <p className="text-sm">
          <span className="font-medium mr-1">{post.product.title}</span>
          {post.caption}
        </p>
        {post.hashtags && (
          <p className="text-xs text-muted-foreground mt-1">{post.hashtags.map((h) => `#${h}`).join(" ")}</p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <button ref={likeRef} onClick={likeClick} className="inline-flex items-center gap-1 text-sm">
            <Heart className={liked ? "fill-current" : undefined} />
            <span>{post.likes + (liked ? 1 : 0)}</span>
          </button>
          <button className="inline-flex items-center gap-1 text-sm">
            <MessageCircle />
            <span>12</span>
          </button>
          <button
            className="inline-flex items-center gap-1 text-sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: post.product.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <Send />
            <span>Share</span>
          </button>
          <div className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="text-attention" />
            <span>4.8</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
