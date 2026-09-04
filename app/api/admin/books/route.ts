import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/session";
import { normalizeCategory, normalizeTitle } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { data, error } = await db
    .from("books")
    .select("id,title,category,position,is_deleted,deleted_at")
    .order("is_deleted", { ascending: true })
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = normalizeTitle(body.title);
  const category = normalizeCategory(body.category);
  if (!title || !category) {
    return NextResponse.json({ error: "نام یا گروه کتاب معتبر نیست." }, { status: 400 });
  }

  const db = getDb();
  const { data: last } = await db
    .from("books")
    .select("position")
    .eq("is_deleted", false)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("books")
    .insert({ title, category, position: (last?.position ?? 0) + 1 })
    .select("id,title,category,position,is_deleted,deleted_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
