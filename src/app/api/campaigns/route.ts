import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaignRecipients, campaigns, contacts, pages } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { uploadAttachment, FacebookError } from "@/lib/facebook";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const rows = await db
    .select({
      campaign: campaigns,
      pageName: pages.name,
    })
    .from(campaigns)
    .innerJoin(pages, eq(pages.id, campaigns.pageId))
    .where(eq(campaigns.userId, user.id))
    .orderBy(desc(campaigns.createdAt))
    .limit(100);

  return NextResponse.json({
    campaigns: rows.map((r) => ({ ...r.campaign, pageName: r.pageName, accessToken: undefined })),
  });
}

function clampInt(v: string | null, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "صيغة الطلب غير صحيحة" }, { status: 400 });
  }

  const pageId = Number(form.get("pageId"));
  const messageText = String(form.get("messageText") ?? "").trim() || null;
  const attachmentUrlRaw = String(form.get("attachmentUrl") ?? "").trim() || null;
  let attachmentType = (String(form.get("attachmentType") ?? "") || null) as
    | "image"
    | "video"
    | null;
  if (attachmentType !== "image" && attachmentType !== "video") attachmentType = null;
  const delaySeconds = clampInt(form.get("delaySeconds") as string | null, 3, 300, 15);
  const jitterSeconds = clampInt(form.get("jitterSeconds") as string | null, 0, 120, 5);
  const nameRaw = String(form.get("name") ?? "").trim();
  const selectionMode = String(form.get("selectionMode") ?? "all");
  const file = form.get("file");

  const pageRows = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, user.id)))
    .limit(1);
  const page = pageRows[0];
  if (!page) return NextResponse.json({ error: "صفحة غير موجودة" }, { status: 404 });

  // recipients
  let targets: { id: number; psid: string; name: string }[] = [];
  if (selectionMode === "all") {
    targets = await db
      .select({ id: contacts.id, psid: contacts.psid, name: contacts.name })
      .from(contacts)
      .where(eq(contacts.pageId, page.id));
  } else {
    let ids: number[] = [];
    try {
      ids = (JSON.parse(String(form.get("contactIds") ?? "[]")) as unknown[])
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x));
    } catch {
      ids = [];
    }
    if (ids.length) {
      targets = await db
        .select({ id: contacts.id, psid: contacts.psid, name: contacts.name })
        .from(contacts)
        .where(eq(contacts.pageId, page.id));
      targets = targets.filter((t) => ids.includes(t.id));
    }
  }
  if (targets.length === 0) {
    return NextResponse.json(
      { error: "لم يتم اختيار أي مستلم — زامن المحادثات أولًا" },
      { status: 400 },
    );
  }

  // attachment
  let attachmentId: string | null = null;
  let attachmentName: string | null = null;
  let attachmentUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!attachmentType) {
      attachmentType = file.type.startsWith("video/") ? "video" : "image";
    }
    attachmentName = file.name;
    if (user.isDemo) {
      attachmentId = `demo-att-${Date.now()}`;
    } else {
      if (!page.accessToken) {
        return NextResponse.json(
          { error: "لا يوجد توكن صلاحية للصفحة" },
          { status: 400 },
        );
      }
      try {
        attachmentId = await uploadAttachment(
          page.facebookPageId,
          page.accessToken,
          attachmentType,
          file,
        );
      } catch (e) {
        if (e instanceof FacebookError) {
          return NextResponse.json(
            { error: `فشل رفع المرفق إلى فيسبوك: ${e.message}` },
            { status: 400 },
          );
        }
        throw e;
      }
    }
  } else if (attachmentUrlRaw) {
    attachmentUrl = attachmentUrlRaw;
    if (!attachmentType) attachmentType = "image";
  }

  if (!messageText && !attachmentId && !attachmentUrl) {
    return NextResponse.json(
      { error: "أضف نص الرسالة أو مرفقًا (صورة/فيديو) على الأقل" },
      { status: 400 },
    );
  }

  const campaignName =
    nameRaw ||
    `حملة ${new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long" })} — ${page.name}`;

  const inserted = await db
    .insert(campaigns)
    .values({
      userId: user.id,
      pageId: page.id,
      name: campaignName,
      messageText,
      attachmentType,
      attachmentUrl,
      attachmentId,
      attachmentName,
      delaySeconds,
      jitterSeconds,
      status: "running",
      total: targets.length,
    })
    .returning({ id: campaigns.id });
  const campaignId = inserted[0].id;

  // staggered schedule: each message waits delay + random jitter after the previous
  let cursor = Date.now() + 2500;
  const rows = targets.map((t) => {
    const at = new Date(cursor);
    cursor += (delaySeconds + Math.random() * jitterSeconds) * 1000;
    return {
      campaignId,
      contactId: t.id,
      psid: t.psid,
      name: t.name,
      status: "pending",
      scheduledAt: at,
    };
  });
  await db.insert(campaignRecipients).values(rows);

  return NextResponse.json({ ok: true, campaignId, total: targets.length });
}
