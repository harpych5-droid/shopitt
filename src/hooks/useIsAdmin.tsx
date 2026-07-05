import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "./useIdentity";

const ADMIN_EMAILS = ["shopitt54@gmail.com"];

/**
 * Admin check against the external Shopitt Supabase schema.
 *
 * Tries in order:
 *   1. profiles.role === 'admin'
 *   2. user_roles table with role='admin'
 *   3. hard-coded admin email fallback (shopitt54@gmail.com)
 */
export function useIsAdmin() {
  const { user } = useIdentity();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);

    (async () => {
      // 1. profiles.role
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (prof?.role === "admin") {
        setIsAdmin(true); setLoading(false); return;
      }

      // 2. user_roles table
      const { data: ur } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      if (ur) {
        setIsAdmin(true); setLoading(false); return;
      }

      // 3. email fallback
      const email = user.email?.toLowerCase();
      setIsAdmin(!!email && ADMIN_EMAILS.includes(email));
      setLoading(false);
    })();

    return () => { active = false; };
  }, [user]);

  return { isAdmin, loading };
}
