import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { buildAuthUrl } from "@/lib/facebook";
import { getRequestOrigin, isFacebookConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isFacebookConfigured()) {
    // gracefully bounce back to the landing with a readable banner.
    // relative Location keeps the user's real (proxied) origin.
    const reason =
      "مفاتيح تطبيق فيسبوك غير مضبوطة بعد. اتبع خطوات الإعداد بالأسفل (FACEBOOK_APP_ID / FACEBOOK_APP_SECRET) — أو جرّب الوضع التجريبي الآن.";
    return new NextResponse(null, {
      status: 307,
      headers: { Location: `/?authError=${encodeURIComponent(reason)}` },
    });
  }
  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("msgr_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(buildAuthUrl(state, getRequestOrigin(req)));
}
