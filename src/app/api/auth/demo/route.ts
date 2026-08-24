import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, users } from "@/db/schema";
import { createSession } from "@/lib/session";
import { DEMO_PAGES } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function POST() {
  const fbId = "demo-user";
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.facebookId, fbId))
    .limit(1);

  let userId: number;
  if (existing[0]) {
    userId = existing[0].id;
  } else {
    const inserted = await db
      .insert(users)
      .values({
        facebookId: fbId,
        name: "حساب تجريبي",
        isDemo: true,
      })
      .returning({ id: users.id });
    userId = inserted[0].id;
  }

  for (const p of DEMO_PAGES) {
    await db
      .insert(pages)
      .values({
        userId,
        facebookPageId: p.facebookPageId,
        name: p.name,
        category: p.category,
        accessToken: p.accessToken,
      })
      .onConflictDoNothing({ target: [pages.userId, pages.facebookPageId] });
  }

  await createSession(userId);
  return NextResponse.json({ ok: true });
}
