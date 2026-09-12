import { supabase } from "@/lib/supabase";

// Use this instead of plain fetch() for any request that writes data.
// It attaches the current user's access token (if signed in) as a
// Bearer header, so the API route's Supabase client can evaluate RLS
// as that authenticated user. Public reads don't need this.
export async function authFetch(url: string, options: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}
