import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Star, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useShop, Product } from "@/context/ShopProvider";
import { Link } from "react-router-dom";
import { useFadeInOnScroll, useCardLift, useHoverScale } from "@/hooks/useAnimations";

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
      className="grid size-8 place-items-center rounded-full text-xs font-semibold text-primary-foreground
        transition-transform duration-300 hover:scale-110"
      style={{ background: color }}
      aria-hidden
    >
      {initials}
    </div>
  );
};

const Media = ({ src, alt }: { src: string; alt: string }) => {
  const { ref, isVisible } = useFadeInOnScroll(0.2);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden rounded-lg transition-all duration-700
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-auto w-full select-none object-cover will-change-transform
          transition-transform duration-500 hover:scale-105"
      />
    </div>
  );
};

interface PostCardProps {
  post: Post;
  onBuy: (p: Product) => void;
}

const PostCard = ({ post, onBuy }: PostCardProps) => {
  const { toggleWishlist, wishlist } = useShop();
  const [liked, setLiked] = useState(false);
  const likeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useCardLift();
  const buyButtonRef = useHoverScale(1.05);
  const { ref: fadeRef, isVisible } = useFadeInOnScroll(0.3);

  const likeClick = () => {
    setLiked((v) => !v);
    if (likeRef.current) {
      likeRef.current.classList.remove("animate-pop");
      void likeRef.current.offsetWidth; // Trigger reflow
      likeRef.current.classList.add("animate-pop");
    }
  };

  const saved = !!wishlist[post.product.id];

  return (
    <article
      ref={fadeRef as React.RefObject<HTMLArticleElement>}
      className={`space-y-2 transition-all duration-700
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      {/* Header with creator info */}
      <header className="flex items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-2">
          <Avatar name={post.product.seller.name} />
          <div className="flex flex-col">
            <Link
              to={`/profile/${post.product.seller.handle}`}
              className="font-semibold text-sm hover:underline transition-colors"
            >
              {post.product.seller.name}
            </Link>
            <span className="text-xs text-muted-foreground">@{post.product.seller.handle}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleWishlist(post.product.id)}
          className={`transition-all duration-300 ${saved ? 'text-accent' : ''} 
            hover:scale-110 active:scale-95`}
        >
          <Star className="h-5 w-5" fill={saved ? "currentColor" : "none"} />
        </Button>
      </header>

      {/* Media with card lift effect */}
      <div
        ref={cardRef as React.RefObject<HTMLDivElement>}
        className="px-2 transition-transform duration-300 cursor-pointer"
      >
        <Media src={post.product.media[0]} alt={post.product.title} />
      </div>

      {/* Caption */}
      <div className="px-2 space-y-1">
        <p className="text-sm font-medium">{post.product.title}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{post.caption}</p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-primary hover:underline cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Engagement metrics */}
      <div className="px-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{post.likes} likes</span>
        <span>{post.product.currency}{post.product.price.toFixed(0)}</span>
      </div>

      {/* Action buttons */}
      <footer className="flex items-center gap-2 px-2">
        <Button
          ref={likeRef}
          variant="ghost"
          size="icon"
          onClick={likeClick}
          className={`transition-all duration-200 ${liked ? 'text-accent' : ''} 
            hover:scale-110 active:scale-95`}
        >
          <Heart className="h-5 w-5" fill={liked ? "currentColor" : "none"} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:scale-110 active:scale-95 transition-transform duration-200"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:scale-110 active:scale-95 transition-transform duration-200"
        >
          <Send className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
        <Button
          ref={buyButtonRef as React.RefObject<HTMLButtonElement>}
          onClick={() => onBuy(post.product)}
          className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded
            transition-all duration-200 hover:bg-primary/90 active:scale-95
            flex items-center gap-1"
        >
          <Sparkles className="h-4 w-4" />
          Buy
        </Button>
      </footer>
    </article>
  );
};

export default PostCard;
