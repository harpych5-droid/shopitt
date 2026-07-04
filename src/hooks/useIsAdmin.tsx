import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "./useIdentity";

/**
 * Admin check against the external Vylogue Supabase schema.
 *
 * That schema stores role directly on `profiles.role` (no separate
 * `user_roles` table). We query for `role = 'admin'` on the current
 * user's profile.
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
    (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!active) return;
        setIsAdmin(data?.role === "admin");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  return { isAdmin, loading };
}
