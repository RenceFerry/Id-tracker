import { createClient } from "@supabase/supabase-js";

// Server-only client. Never import this from a client component —
// it uses the service role key, which must stay off the browser bundle.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
