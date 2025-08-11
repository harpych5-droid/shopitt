import { useEffect, useRef, useState } from "react";
import PostCard, { type Post } from "./PostCard";
import { mockPosts } from "@/data/mockPosts";
import { Product, useShop } from "@/context/ShopProvider";

const Feed = ({ onBuy }: { onBuy: (p: Product) => void }) => {
  const [posts, setPosts] = useState<Post[]>(mockPosts.slice(0, 5));
  const [page, setPage] = useState(1);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );
    if (sentinel.current) io.observe(sentinel.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const start = page * 5;
    const more = mockPosts.slice(start, start + 5);
    if (more.length) setPosts((prev) => [...prev, ...more]);
    else setPosts((prev) => [...prev, ...mockPosts.slice(0, 5)]);
  }, [page]);

  return (
    <div className="space-y-6">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onBuy={onBuy} />
      ))}
      <div ref={sentinel} className="h-8" />
    </div>
  );
};

export default Feed;
