import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { contacts, pages } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { fetchUserPages } from "@/lib/facebook";
import {
  PINNING_ENABLED,
  PINNED_PAGES_LABEL,
  isPinnedPage,
} from "@/lib/pinned";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  let rows = await db
    .select({
      id: pages.id,
      facebookPageId: pages.facebookPageId,
      name: pages.name,
      category: pages.category,
      pictureUrl: pages.pictureUrl,
      contactsCount: sql<number>`count(${contacts.id})::int`,
    })
    .from(pages)
    .leftJoin(contacts, eq(contacts.pageId, pages.id))
    .where(eq(pages.userId, user.id))
    .groupBy(pages.id)
    .orderBy(pages.id);

  const pinningActive = PINNING_ENABLED && !user.isDemo;
  if (pinningActive) {
    rows = rows.filter((r) => isPinnedPage(r.facebookPageId));
  }

  return NextResponse.json({
    pages: rows.map((r) => ({ ...r, pinned: isPinnedPage(r.facebookPageId) })),
    isDemo: user.isDemo,
    pinning: pinningActive ? { enabled: true, label: PINNED_PAGES_LABEL } : null,
  });
}

/** Re-fetch the Facebook page list (real mode only). */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
  if (user.isDemo || !user.accessToken) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  try {
    const fbPages = await fetchUserPages(user.accessToken);
    for (const p of fbPages) {
      await db
        .insert(pages)
        .values({
          userId: user.id,
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
    return NextResponse.json({ ok: true, count: fbPages.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل تحديث الصفحات" },
      { status: 400 },
    );
  }
}
