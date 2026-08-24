import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contacts, pages } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { fetchPageConversations, fetchProfilePic } from "@/lib/facebook";
import { generateDemoContacts } from "@/lib/demo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ pageId: string }> };

async function getOwnedPage(ctx: Ctx, userId: number) {
  const { pageId } = await ctx.params;
  const rows = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, Number(pageId)), eq(pages.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
  const page = await getOwnedPage(ctx, user.id);
  if (!page) return NextResponse.json({ error: "صفحة غير موجودة" }, { status: 404 });

  const rows = await db
    .select()
    .from(contacts)
    .where(eq(contacts.pageId, page.id))
    .orderBy(desc(contacts.lastInteractionAt));

  return NextResponse.json({
    contacts: rows,
    page: { id: page.id, name: page.name, pictureUrl: page.pictureUrl, facebookPageId: page.facebookPageId },
  });
}

/** Sync conversations from Messenger into local contacts. */
export async function POST(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
  const page = await getOwnedPage(ctx, user.id);
  if (!page) return NextResponse.json({ error: "صفحة غير موجودة" }, { status: 404 });

  try {
    let list;
    if (user.isDemo) {
      list = generateDemoContacts(page.facebookPageId, 26);
    } else {
      if (!page.accessToken) {
        return NextResponse.json(
          { error: "لا يوجد توكن صلاحية للصفحة — أعد تسجيل الدخول أو حدّث الصفحات" },
          { status: 400 },
        );
      }
      list = await fetchPageConversations(page.facebookPageId, page.accessToken);
    }

    for (const c of list) {
      await db
        .insert(contacts)
        .values({
          pageId: page.id,
          psid: c.psid,
          name: c.name,
          profilePic: c.profilePic ?? null,
          snippet: c.snippet ?? null,
          threadId: c.threadId,
          lastInteractionAt: c.updatedTime ? new Date(c.updatedTime) : null,
        })
        .onConflictDoUpdate({
          target: [contacts.pageId, contacts.psid],
          set: {
            name: c.name,
            snippet: c.snippet ?? null,
            threadId: c.threadId,
            lastInteractionAt: c.updatedTime ? new Date(c.updatedTime) : null,
          },
        });
    }

    // Best-effort profile pics for real contacts missing one (limited batch)
    if (!user.isDemo && page.accessToken) {
      const missing = await db
        .select()
        .from(contacts)
        .where(eq(contacts.pageId, page.id))
        .limit(40);
      await Promise.all(
        missing
          .filter((c) => !c.profilePic)
          .slice(0, 25)
          .map(async (c) => {
            const pic = await fetchProfilePic(c.psid, page.accessToken!);
            if (pic) {
              await db
                .update(contacts)
                .set({ profilePic: pic })
                .where(eq(contacts.id, c.id));
            }
          }),
      );
    }

    const rows = await db
      .select()
      .from(contacts)
      .where(eq(contacts.pageId, page.id))
      .orderBy(desc(contacts.lastInteractionAt));

    return NextResponse.json({ contacts: rows, synced: list.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل مزامنة المحادثات" },
      { status: 400 },
    );
  }
}
