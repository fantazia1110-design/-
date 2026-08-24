import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, users } from "@/db/schema";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  fetchMe,
  fetchUserPages,
} from "@/lib/facebook";
import { createSession } from "@/lib/session";
import { getRequestOrigin } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const savedState = store.get("msgr_oauth_state")?.value;
  store.delete("msgr_oauth_state");

  const fail = (reason: string) =>
    new NextResponse(null, {
      status: 307,
      headers: { Location: `/?authError=${encodeURIComponent(reason)}` },
    });

  if (!code || !state || !savedState || state !== savedState) {
    return fail("فشل التحقق من جلسة تسجيل الدخول — حاول مجددًا");
  }

  try {
    const origin = getRequestOrigin(req);
    const short = await exchangeCodeForToken(code, origin);
    const long = await getLongLivedToken(short.access_token);
    const me = await fetchMe(long.access_token);

    const tokenExpiresAt = long.expires_in
      ? new Date(Date.now() + long.expires_in * 1000)
      : null;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.facebookId, me.id))
      .limit(1);

    let userId: number;
    if (existing[0]) {
      userId = existing[0].id;
      await db
        .update(users)
        .set({
          name: me.name,
          email: me.email ?? null,
          pictureUrl: me.pictureUrl ?? null,
          accessToken: long.access_token,
          tokenExpiresAt,
        })
        .where(eq(users.id, userId));
    } else {
      const inserted = await db
        .insert(users)
        .values({
          facebookId: me.id,
          name: me.name,
          email: me.email ?? null,
          pictureUrl: me.pictureUrl ?? null,
          accessToken: long.access_token,
          tokenExpiresAt,
        })
        .returning({ id: users.id });
      userId = inserted[0].id;
    }

    const fbPages = await fetchUserPages(long.access_token);
    for (const p of fbPages) {
      await db
        .insert(pages)
        .values({
          userId,
          facebookPageId: p.id,
          name: p.name,
          category: p.category ?? null,
          pictureUrl: p.pictureUrl ?? null,
          accessToken: p.accessToken ?? null,
        })
        .onConflictDoUpdate({
          target: [pages.userId, pages.facebookPageId],
          set: {
            name: p.name,
            category: p.category ?? null,
            pictureUrl: p.pictureUrl ?? null,
            accessToken: p.accessToken ?? null,
          },
        });
    }

    await createSession(userId);
    return new NextResponse(null, {
      status: 307,
      headers: { Location: "/dashboard" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return fail(msg);
  }
}
