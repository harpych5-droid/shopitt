import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, Monitor, LogOut, Check, MessageCircle, Phone, Loader2 } from "lucide-react";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { normalizeWhatsAppNumber, buildWhatsAppUrl } from "@/services/ordersService";
import { BackButton } from "@/components/navigation/BackButton";

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun; hint: string }[] = [
  { value: "light", label: "Light", icon: Sun, hint: "Bright & editorial" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Premium charcoal" },
  { value: "system", label: "System", icon: Monitor, hint: "Match your device" },
];

const Settings = () => {
  const { mode, setMode } = useTheme();
  const { isAuthed, profile, user, refresh } = useIdentity();
  const navigate = useNavigate();
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsapp_number ?? "");
  const [whatsappEnabled, setWhatsappEnabled] = useState(Boolean(profile?.whatsapp_enabled));
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  useEffect(() => {
    setWhatsappNumber(profile?.whatsapp_number ?? "");
    setWhatsappEnabled(Boolean(profile?.whatsapp_enabled));
  }, [profile]);

  useEffect(() => {
    document.title = "Settings — Shopitt";
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const handleWhatsAppSave = async () => {
    if (!user) return;
    const normalized = normalizeWhatsAppNumber(whatsappNumber);
    if (!normalized) {
      toast.error("Use a valid WhatsApp number in international format.");
      return;
    }
    setSavingWhatsapp(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        whatsapp_number: normalized,
        whatsapp_enabled: whatsappEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSavingWhatsapp(false);

    if (error) {
      toast.error(error.message ?? "Could not save WhatsApp settings");
      return;
    }

    await refresh();
    toast.success(whatsappEnabled ? "WhatsApp enabled for order alerts" : "WhatsApp notifications turned off");
  };

  const testWhatsAppLink = buildWhatsAppUrl(whatsappNumber || profile?.whatsapp_number || null, "Shopitt test notification: your WhatsApp connection is active.");

  return (
    <main className="min-h-[100dvh] bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton fallback="/menu" />
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
            WhatsApp orders
          </h2>
          <div className="rounded-3xl bg-card border border-border overflow-hidden p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Receive new order notifications on WhatsApp</p>
                <p className="text-xs text-muted-foreground">{profile?.whatsapp_number ? "Connected" : "Not connected"}</p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappEnabled((v) => !v)}
                className={`relative h-7 w-12 rounded-full transition-colors ${whatsappEnabled ? "bg-brand-pink" : "bg-muted"}`}
                aria-label="Toggle WhatsApp notifications"
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${whatsappEnabled ? "left-6" : "left-1"}`} />
              </button>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/50 px-3 py-2">
              <label className="block text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">WhatsApp business number</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+260971234567"
                className="mt-2 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleWhatsAppSave}
                disabled={savingWhatsapp}
                className="flex-1 rounded-full gradient-brand text-white text-xs font-extrabold px-4 h-10 shadow-brand inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {savingWhatsapp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />}
                {savingWhatsapp ? "Saving" : "Save"}
              </button>
              <a
                href={testWhatsAppLink ?? undefined}
                aria-disabled={!testWhatsAppLink}
                className={`flex-1 rounded-full border text-xs font-extrabold px-4 h-10 inline-flex items-center justify-center gap-2 ${testWhatsAppLink ? "border-border bg-card" : "pointer-events-none border-muted bg-muted text-muted-foreground"}`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Test
              </a>
            </div>
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
          Shopitt by <span className="font-bold text-foreground">H&amp;D CREATION</span> · v1.1
        </p>
      </div>
    </main>
  );
};

export default Settings;
