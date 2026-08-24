import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaignRecipients, campaigns, contacts, pages } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { sendMessage, FacebookError } from "@/lib/facebook";
import { simulateDemoSend } from "@/lib/demo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

/** Processes the messages that are due right now (respecting the delay schedule). */
export async function POST(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
  const { id } = await ctx.params;

  const rows = await db
    .select({ campaign: campaigns, page: pages })
    .from(campaigns)
    .innerJoin(pages, eq(pages.id, campaigns.pageId))
    .where(and(eq(campaigns.id, Number(id)), eq(campaigns.userId, user.id)))
    .limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "حملة غير موجودة" }, { status: 404 });
  const { campaign, page } = row;

  if (campaign.status !== "running") {
    return NextResponse.json({ ok: true, status: campaign.status, processed: 0 });
  }

  const due = await db
    .select({
      recipient: campaignRecipients,
      lastInteractionAt: contacts.lastInteractionAt,
    })
    .from(campaignRecipients)
    .leftJoin(contacts, eq(contacts.id, campaignRecipients.contactId))
    .where(
      and(
        eq(campaignRecipients.campaignId, campaign.id),
        eq(campaignRecipients.status, "pending"),
        sql`${campaignRecipients.scheduledAt} <= now()`,
      ),
    )
    .orderBy(asc(campaignRecipients.scheduledAt))
    .limit(6);

  let processed = 0;
  for (const d of due) {
    let result: { ok: true } | { ok: false; error: string };
    if (user.isDemo) {
      await new Promise((r) => setTimeout(r, 300));
      result = simulateDemoSend(d.lastInteractionAt ?? null);
    } else if (!page.accessToken) {
      result = { ok: false, error: "لا يوجد توكن صلاحية للصفحة" };
    } else {
      try {
        await sendMessage(page.facebookPageId, page.accessToken, d.recipient.psid, {
          text: campaign.messageText,
          attachment: campaign.attachmentType
            ? {
                type: campaign.attachmentType as "image" | "video",
                attachmentId: campaign.attachmentId,
                url: campaign.attachmentUrl,
              }
            : null,
        });
        result = { ok: true };
      } catch (e) {
        result = {
          ok: false,
          error:
            e instanceof FacebookError
              ? e.message
              : e instanceof Error
                ? e.message
                : "خطأ غير معروف",
        };
      }
    }

    await db
      .update(campaignRecipients)
      .set({
        status: result.ok ? "sent" : "failed",
        error: result.ok ? null : result.error,
        sentAt: new Date(),
      })
      .where(eq(campaignRecipients.id, d.recipient.id));
    processed += 1;
  }

  // refresh aggregated stats
  const stats = await db
    .select({
      sent: sql<number>`count(*) filter (where ${campaignRecipients.status} = 'sent')::int`,
      failed: sql<number>`count(*) filter (where ${campaignRecipients.status} = 'failed')::int`,
      pending: sql<number>`count(*) filter (where ${campaignRecipients.status} = 'pending')::int`,
    })
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaign.id));
  const s = stats[0] ?? { sent: 0, failed: 0, pending: 0 };

  let status = campaign.status;
  let finishedAt: Date | null = null;
  if (s.pending === 0) {
    status = "completed";
    finishedAt = new Date();
  }
  await db
    .update(campaigns)
    .set({
      sent: s.sent,
      failed: s.failed,
      status,
      finishedAt,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaign.id));

  return NextResponse.json({
    ok: true,
    processed,
    status,
    sent: s.sent,
    failed: s.failed,
    pending: s.pending,
  });
}
