import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export async function GET() {
  const { data, error, count } = await supabase
    .from("id_orders")
    .select("quantity, idType, released, paid", { count: "exact" })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(data, count);

  return NextResponse.json({
    orders: data,
    total: count ?? 0,
  });
}