import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const Search = () => {
  useEffect(() => {
    document.title = "Search – Shopit";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Search products and creators on Shopit.");
  }, []);

  return (
    <div>
      <h1 className="mb-3 text-xl font-bold">Search</h1>
      <div className="mb-4">
        <Input placeholder="Search products, creators, hashtags…" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
