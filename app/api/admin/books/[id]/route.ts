import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/session";
import { normalizeCategory, normalizeTitle } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("title" in body) {
    const title = normalizeTitle(body.title);
    if (!title) return NextResponse.json({ error: "نام کتاب معتبر نیست." }, { status: 400 });
    updates.title = title;
  }

  if ("category" in body) {
    const category = normalizeCategory(body.category);
    if (!category) return NextResponse.json({ error: "گروه نامعتبر است." }, { status: 400 });
    updates.category = category;
  }

  const db = getDb();

  if (body.restore === true) {
    const { data: last } = await db
      .from("books")
      .select("position")
      .eq("is_deleted", false)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    updates.is_deleted = false;
    updates.deleted_at = null;
    updates.position = (last?.position ?? 0) + 1;
  }

  const { data, error } = await db
    .from("books")
    .update(updates)
    .eq("id", id)
    .select("id,title,category,position,is_deleted,deleted_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });

  const db = getDb();
  const now = new Date().toISOString();
  const { error } = await db
    .from("books")
    .update({ is_deleted: true, deleted_at: now, updated_at: now })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
