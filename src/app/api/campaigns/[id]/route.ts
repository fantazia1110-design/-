import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaignRecipients, campaigns, pages } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnedCampaign(ctx: Ctx, userId: number) {
  const { id } = await ctx.params;
  const rows = await db
    .select({ campaign: campaigns, pageName: pages.name, pageFbId: pages.facebookPageId })
    .from(campaigns)
    .innerJoin(pages, eq(pages.id, campaigns.pageId))
    .where(and(eq(campaigns.id, Number(id)), eq(campaigns.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
  const row = await getOwnedCampaign(ctx, user.id);
  if (!row) return NextResponse.json({ error: "حملة غير موجودة" }, { status: 404 });

  const recipients = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, row.campaign.id))
    .orderBy(asc(campaignRecipients.id))
    .limit(500);

  return NextResponse.json({
    campaign: { ...row.campaign, pageName: row.pageName, pageFbId: row.pageFbId },
    recipients,
    isDemo: user.isDemo,
  });
}

const ALLOWED: Record<string, "paused" | "running" | "canceled"> = {
  pause: "paused",
  resume: "running",
  cancel: "canceled",
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
  const row = await getOwnedCampaign(ctx, user.id);
  if (!row) return NextResponse.json({ error: "حملة غير موجودة" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const status = ALLOWED[body.action ?? ""];
  if (!status) {
    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
  if (row.campaign.status === "completed") {
    return NextResponse.json({ error: "الحملة مكتملة بالفعل" }, { status: 400 });
  }
  await db
    .update(campaigns)
    .set({ status, updatedAt: new Date() })
    .where(eq(campaigns.id, row.campaign.id));
  return NextResponse.json({ ok: true, status });
}
