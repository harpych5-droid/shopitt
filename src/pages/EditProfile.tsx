import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Check } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { toast } from "sonner";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/lib/supabase";
import { IdentityAvatar } from "@/components/identity/IdentityAvatar";

const EditProfile = () => {
  const navigate = useNavigate();
  const { profile, user, isAuthed, refresh, setProfile } = useIdentity();

  const [form, setForm] = useState({
    username: "",
    country: "",
    avatar_url: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Edit profile — Shopitt";
  }, []);

  // Hydrate form from global identity when it lands
  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username ?? "",
        country: profile.country ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
    }
  }, [profile]);

  if (!isAuthed || !user) {
    return (
      <main className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-lg font-extrabold">Sign in required</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You need to sign in before editing your profile.
        </p>
        <Link
          to="/profile"
          className="mt-4 inline-flex rounded-full gradient-brand text-white text-sm font-bold px-5 py-2.5 shadow-brand"
        >
          Go to profile
        </Link>
      </main>
    );
  }

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!user) return;
    const cleanHandle = form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (cleanHandle.length < 2) {
      toast.error("Username must be at least 2 characters");
      return;
    }

    setSaving(true);
    const payload = {
      username: cleanHandle,
      country: form.country.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    };
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select("id, username, avatar_url, country")
      .maybeSingle();
    setSaving(false);

    if (error) {
      console.error("Save profile failed", error);
      toast.error(error.message ?? "Could not save profile");
      return;
    }

    // Update global state immediately so every surface reflects the change
    if (data) {
      setProfile(data);
    } else {
      await refresh();
    }
    toast.success("Profile updated");
    navigate("/profile");
  };

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/menu"
            aria-label="Back"
            className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Edit profile</h1>
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-full gradient-brand text-white text-xs font-extrabold px-4 h-9 shadow-brand inline-flex items-center gap-1 disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
            {saving ? "Saving" : "Save"}
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">
        {/* Avatar */}
        <section className="flex flex-col items-center gap-3">
          <div className="relative">
            <IdentityAvatar
              profile={{
                id: user.id,
                username: form.username || profile?.username || null,
                avatar_url: form.avatar_url || null,
                country: form.country || null,
              }}
              size={96}
            />
            <span className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center border-4 border-background">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Paste a public image URL below to change your photo
          </p>
        </section>

        {/* Form — only fields that exist on the profiles table */}
        <section className="space-y-3">
          <Field label="Username" prefix="@">
            <input
              type="text"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              placeholder="your_handle"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field label="Avatar URL">
            <input
              type="url"
              value={form.avatar_url}
              onChange={(e) => update("avatar_url", e.target.value)}
              placeholder="https://…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field label="Country">
            <input
              type="text"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              placeholder="Zambia"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>
        </section>

        <Link
          to="/country"
          className="flex items-center justify-between rounded-2xl bg-card border border-border/60 px-4 py-3.5"
        >
          <span className="text-sm font-semibold">Pick from country list</span>
          <span className="text-sm text-muted-foreground">{form.country || "—"} →</span>
        </Link>
      </div>

      <BottomNav />
    </main>
  );
};

const Field = ({
  label,
  prefix,
  children,
}: {
  label: string;
  prefix?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl bg-card border border-border/60 px-4 py-3">
    <label className="block text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">
      {label}
    </label>
    <div className="flex items-center gap-1 mt-1">
      {prefix && <span className="text-sm font-bold text-muted-foreground">{prefix}</span>}
      {children}
    </div>
  </div>
);

export default EditProfile;
