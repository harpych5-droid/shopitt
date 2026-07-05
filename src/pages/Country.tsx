import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Globe, Search } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { COUNTRIES } from "@/data/countries";
import { toast } from "sonner";

const Country = () => {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState("ZM");

  useEffect(() => {
    document.title = "Country & Region — Shopitt";
  }, []);

  const list = useMemo(() => {
    if (!q.trim()) return COUNTRIES;
    const needle = q.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.code.toLowerCase().includes(needle),
    );
  }, [q]);

  const onPick = (code: string, name: string) => {
    setSelected(code);
    toast.success(`Country set to ${name}`);
  };

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/menu" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Country & Region</h1>
          <span className="h-9 w-9" />
        </div>
        <div className="max-w-md mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 h-10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search country…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-3">
        <p className="text-[11px] text-muted-foreground mb-2 inline-flex items-center gap-1">
          <Globe className="h-3 w-3 text-brand-pink" />
          {COUNTRIES.length} countries supported
        </p>
        <ul className="rounded-2xl bg-card border border-border/60 overflow-hidden divide-y divide-border/60">
          {list.map((c) => (
            <li key={c.code}>
              <button
                onClick={() => onPick(c.code, c.name)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              >
                <span className="text-lg leading-none w-7 text-center">{c.flag}</span>
                <span className="flex-1 text-sm font-semibold">{c.name}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{c.dial}</span>
                {selected === c.code && (
                  <Check className="h-4 w-4 text-brand-pink" />
                )}
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No countries match “{q}”.
            </li>
          )}
        </ul>
      </div>

      <BottomNav />
    </main>
  );
};

export default Country;
