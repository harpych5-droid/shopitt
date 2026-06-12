import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  country: string | null;
};

type IdentityContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthed: boolean;
  refresh: () => Promise<void>;
  setProfile: (p: Profile | null) => void;
};

const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

const sanitizeHandle = (raw: string) =>
  raw.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 24) || "shopper";

async function fetchOrCreateProfile(user: User): Promise<Profile | null> {
  // 1) Try to fetch existing profile
  const { data: existing, error: fetchErr } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, country")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[identity] fetch profile failed", fetchErr);
  }
  if (existing) return existing as Profile;

  // 2) Auto-create profile from auth metadata
  const meta = (user.user_metadata ?? {}) as Record<string, any>;
  const handleSeed =
    meta.preferred_username ||
    meta.user_name ||
    user.email?.split("@")[0] ||
    `user_${user.id.slice(0, 6)}`;
  const insertPayload = {
    id: user.id,
    username: sanitizeHandle(handleSeed),
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
  };

  const { data: created, error: createErr } = await supabase
    .from("profiles")
    .insert(insertPayload)
    .select("id, username, avatar_url, country")
    .maybeSingle();

  if (createErr) {
    console.error("[identity] auto-create failed", createErr);
    // Fallback so the app still has identity in memory
    return { ...insertPayload, country: null } as Profile;
  }
  return (created as Profile) ?? ({ ...insertPayload, country: null } as Profile);
}

export const IdentityProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserId = useRef<string | null>(null);

  const hydrate = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      lastUserId.current = null;
      setProfileState(null);
      return;
    }
    if (lastUserId.current === nextUser.id && profile) return;
    lastUserId.current = nextUser.id;
    const p = await fetchOrCreateProfile(nextUser);
    setProfileState(p);
    console.log("GLOBAL PROFILE:", p);
  }, [profile]);

  useEffect(() => {
    let active = true;

    // Subscribe FIRST (before getSession) to avoid missing events
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Defer Supabase calls out of the auth callback
      setTimeout(() => {
        if (!active) return;
        hydrate(newSession?.user ?? null);
      }, 0);
    });

    // THEN restore existing session
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await hydrate(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    lastUserId.current = null;
    await hydrate(user);
  }, [user, hydrate]);

  const setProfile = useCallback((p: Profile | null) => {
    setProfileState(p);
  }, []);

  const value = useMemo<IdentityContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      isAuthed: !!session,
      refresh,
      setProfile,
    }),
    [session, user, profile, loading, refresh, setProfile],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
};

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}
