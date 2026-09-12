import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabaseRequest";
import type { IdOrder } from "@/types/order";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const updates = (await req.json()) as Partial<IdOrder>;

  // Never let the row's id or created_at be overwritten via the body.
  delete updates.id;
  delete updates.created_at;

  const db = getSupabaseForRequest(req);
  const { data, error } = await db
    .from("id_orders")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getSupabaseForRequest(req);
  const { error } = await db.from("id_orders").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
