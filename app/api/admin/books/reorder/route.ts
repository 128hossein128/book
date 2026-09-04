import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/session";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.orderedIds)
    ? body.orderedIds.map(Number).filter(Number.isInteger)
    : [];

  if (!ids.length || new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "ترتیب ارسالی معتبر نیست." }, { status: 400 });
  }

  const db = getDb();
  const { error } = await db.rpc("reorder_books", { ordered_ids: ids });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
