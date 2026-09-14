import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const query = supabase
    .from("id_orders")
    .select("quantity, paid, released, idType", { count: "exact" })

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: data,
    total: count ?? 0,
  });
}