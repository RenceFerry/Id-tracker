import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

/**
 * Server-side client scoped to one request. If the request carries the
 * signed-in user's access token (attached by lib/authFetch.ts on the
 * client), Postgres RLS evaluates the request as that authenticated
 * user, so admin-only writes succeed. With no token, it behaves as the
 * public anon role — which our RLS policies only allow to read.
 *
 * This is the actual security boundary: it's enforced in Postgres, not
 * just by hiding buttons in the UI.
 */
export function getSupabaseForRequest(req: Request) {
  const authHeader = req.headers.get("authorization") ?? undefined;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : {},
    auth: { persistSession: false },
  });
}
