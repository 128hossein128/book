import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const { data, error } = await db
      .from("books")
      .select("id,title,category,position")
      .eq("is_deleted", false)
      .order("position", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در دریافت فهرست کتاب‌ها" }, { status: 500 });
  }
}
