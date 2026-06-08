import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon, Monitor, LogOut, Check } from "lucide-react";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun; hint: string }[] = [
  { value: "light", label: "Light", icon: Sun, hint: "Bright & editorial" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Premium charcoal" },
  { value: "system", label: "System", icon: Monitor, hint: "Match your device" },
];

const Settings = () => {
  const { mode, setMode } = useTheme();
  const { isAuthed, profile } = useIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Settings — Shopitt";
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <main className="min-h-[100dvh] bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/menu"
            aria-label="Back"
            className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-base font-bold">Settings</h1>
          <span className="h-9 w-9" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        <section>
          <h2 className="px-2 mb-2 text-[11px] uppercase tracking-[0.18em] font-bold text-brand-pink">
            Appearance
          </h2>
          <div className="rounded-3xl bg-card border border-border overflow-hidden">
            {themeOptions.map((opt, idx) => {
              const Icon = opt.icon;
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors ${
                    idx > 0 ? "border-t border-border/60" : ""
                  } ${active ? "bg-muted/40" : "hover:bg-muted/30"}`}
                >
                  <span
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      active ? "gradient-brand text-white" : "bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-foreground">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                  </span>
                  {active && (
                    <span className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="px-2 mb-2 text-[11px] uppercase tracking-[0.18em] font-bold text-brand-pink">
            Account
          </h2>
          <div className="rounded-3xl bg-card border border-border overflow-hidden">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-4 hover:bg-muted/30 transition-colors"
            >
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-foreground">
                  {isAuthed && profile?.username ? `@${profile.username}` : "Sign in"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {isAuthed ? "View & edit your profile" : "Continue with Google"}
                </span>
              </span>
            </Link>
            {isAuthed && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-4 border-t border-border/60 hover:bg-muted/30 transition-colors text-left"
              >
                <span className="h-10 w-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center">
                  <LogOut className="h-5 w-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-destructive">Sign out</span>
                  <span className="block text-xs text-muted-foreground">End your session</span>
                </span>
              </button>
            )}
          </div>
        </section>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          Shopitt by <span className="font-bold text-foreground">AETHØNN Inc.</span> · v1.1
        </p>
      </div>
    </main>
  );
};

export default Settings;
