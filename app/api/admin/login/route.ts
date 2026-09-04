import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, createAdminToken, safeEqual } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || expected.length < 8) {
    return NextResponse.json({ error: "رمز مدیر در سرور تنظیم نشده است." }, { status: 500 });
  }

  if (!safeEqual(password, expected)) {
    return NextResponse.json({ error: "رمز عبور نادرست است." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), adminCookieOptions);
  return response;
}
