import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseForRequest } from "@/lib/supabaseRequest";
import type { NewIdOrder } from "@/types/order";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "10") || 10)
  );
  const q = searchParams.get("q")?.trim();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("id_orders")
    .select("*", { count: "exact" })
    .order("student_name", { ascending: true })
    .range(from, to);

  if (q) {
    // Escape % and _ so search text can't be used to build unintended
    // wildcard patterns.
    const escaped = q.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.or(
      `student_name.ilike.%${escaped}%,year.ilike.%${escaped}%,block.ilike.%${escaped}%`
    );
  }

  const paidParam = searchParams.get("paid"); // e.g. "true" | "false" | null
  if (paidParam !== null) {
    query = query.eq("paid", paidParam === "true");
  }

  const releasedParam = searchParams.get("released");
  if (releasedParam !== null) {
    query = query.eq("released", releasedParam === "true");
  }

  const typeParam = searchParams.get('type');
  if (typeParam !== null) {
    query = query.eq('idType', typeParam);
  }

  const [ dateOpParam, dateValParam ] = [searchParams.get('op'), searchParams.get('val')];
  if (dateOpParam && dateValParam) {
    switch (dateOpParam) {
      case 'GT': 
        query = query.gt("date_bought", dateValParam);
        break;
      case 'LT': 
        query = query.lt("date_bought", dateValParam);
        break;
      case 'EQ': 
        query = query.eq("date_bought", dateValParam);
        break;
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: data,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<NewIdOrder>;

  if (!body.student_name || !body.year || !body.block) {
    return NextResponse.json(
      { error: "student_name, year, and block are required" },
      { status: 400 }
    );
  }

  console.log(body.idType);

  const payload: NewIdOrder = {
    student_name: body.student_name,
    year: body.year,
    block: body.block,
    quantity: body.quantity && body.quantity > 0 ? body.quantity : 1,
    paid: body.paid ?? false,
    date_bought: body.date_bought ?? new Date().toISOString().slice(0, 10),
    released: body.released ?? false,
    idType: body.idType!
  };

  const db = getSupabaseForRequest(req);
  const { data, error } = await db
    .from("id_orders")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ order: data }, { status: 201 });
}
