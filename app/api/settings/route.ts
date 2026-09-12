import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseForRequest } from "@/lib/supabaseRequest";

export async function GET() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("price_per_id")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const price = Number(body.price_per_id);

  if (Number.isNaN(price) || price < 0) {
    return NextResponse.json(
      { error: "price_per_id must be a non-negative number" },
      { status: 400 }
    );
  }

  const db = getSupabaseForRequest(req);
  const { data, error } = await db
    .from("app_settings")
    .update({ price_per_id: price, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}
