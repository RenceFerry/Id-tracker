import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Supabase free-tier projects pause after 7 days with no activity.
// This route runs on a schedule (see vercel.json) and issues a trivial
// query so the project always looks active. It reads nothing sensitive
// and writes nothing.
export async function GET(req: NextRequest) {
  // Optional extra safety: if you set CRON_SECRET in your env vars,
  // Vercel Cron will send it as a Bearer token and this checks it,
  // so randoms can't hit the route and spam your database.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { error } = await supabaseAdmin
    .from("id_orders")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, pinged_at: new Date().toISOString() });
}
