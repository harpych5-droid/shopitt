import { createClient } from "@supabase/supabase-js";

/**
 * External Supabase project (Shopitt production backend).
 *
 * This project is shared with the Expo mobile app (lib/supabase.ts).
 * We intentionally do NOT use Lovable Cloud's auto-generated client
 * (src/integrations/supabase/client.ts) — that client points at a
 * different, Cloud-managed project. All web code should import from
 * this file instead:
 *
 *   import { supabase } from "@/lib/supabase";
 *
 * The anon (publishable) key is safe to ship in the client — RLS
 * controls access. Never put the service_role key here.
 */
const SUPABASE_URL = "https://jcjarvyyubsoxbhuajdx.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_QDV6C1bCml2wi3zQjA5lxQ_RfGMi66m";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
