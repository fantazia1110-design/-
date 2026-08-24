"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Pause,
  Play,
  Ban,
  CheckCircle2,
  XCircle,
  Clock3,
  Send,
  Timer,
  PartyPopper,
  Image as ImageIcon,
  Film,
  Radio,
} from "lucide-react";
import { Avatar } from "@/components/brand";
import { fetchJson, formatNumber, timeAgo } from "@/lib/client-utils";

interface Recipient {
  id: number;
  name: string;
  psid: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  scheduledAt: string;
  sentAt: string | null;
}

interface Campaign {
  id: number;
  name: string;
  pageName: string;
  messageText: string | null;
  attachmentType: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  delaySeconds: number;
  jitterSeconds: number;
  status: string;
  total: number;
  sent: number;
  failed: number;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  running: "قيد الإرسال",
  paused: "متوقفة مؤقتًا",
  completed: "مكتملة",
  canceled: "ملغاة",
};

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const busy = useRef(false);

  const load = useCallback(async () => {
    const data = await fetchJson<{ campaign: Campaign; recipients: Recipient[] }>(
      `/api/campaigns/${id}`,
    );
    setCampaign(data.campaign);
    setRecipients(data.recipients);
    return data.campaign.status;
  }, [id]);

  const tick = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await fetchJson(`/api/campaigns/${id}/run`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ أثناء الإرسال");
    } finally {
      busy.current = false;
    }
  }, [id, load]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "تعذر التحميل"));
  }, [load]);

  // engine: while running, drive the queue every 3.5s; while paused just refresh
  const status = campaign?.status;
  useEffect(() => {
    if (!status) return;
    if (status === "running") {
      tick();
      const t = setInterval(tick, 3500);
      return () => clearInterval(t);
    }
    if (status === "paused") {
      const t = setInterval(() => load().catch(() => {}), 7000);
      return () => clearInterval(t);
    }
  }, [status, tick, load]);

  const action = async (a: "pause" | "resume" | "cancel") => {
    setActing(true);
    try {
      await fetchJson(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: a }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الإجراء");
    } finally {
      setActing(false);
    }
  };

  if (error && !campaign) {
    return (
      <div className="glass border border-red-400/30 text-red-200 rounded-2xl px-5 py-4" dir="auto">
        {error}
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <div className="glass rounded-3xl h-32 shimmer-bar" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-2xl h-24 shimmer-bar" />
          ))}
        </div>
      </div>
    );
  }

  const done = campaign.sent + campaign.failed;
  const pending = campaign.total - done;
  const pct = campaign.total ? Math.round((done / campaign.total) * 100) : 0;
  const processed = [...recipients]
    .filter((r) => r.status !== "pending")
    .sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""));
  const nextUp = recipients.find((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/campaigns"
            className="btn-ghost glass rounded-xl p-2.5 text-white/60"
          >
            <ArrowRight size={17} />
          </Link>
          <div>
            <h1 className="text-2xl font-black">{campaign.name}</h1>
            <p className="text-white/45 text-xs mt-1">
              صفحة «{campaign.pageName}» · فاصل {campaign.delaySeconds} ث + عشوائية{" "}
              {campaign.jitterSeconds} ث
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {campaign.status === "running" && (
            <>
              <span className="inline-flex items-center gap-2 text-xs font-bold text-brand bg-brand/10 border border-brand/25 rounded-full px-4 py-2 animate-pulse-ring">
                <Radio size={13} className="animate-pulse" />
                بث مباشر
              </span>
              <button
                onClick={() => action("pause")}
                disabled={acting}
                className="btn-ghost glass rounded-xl p-3 text-amber cursor-pointer"
                title="إيقاف مؤقت"
              >
                <Pause size={17} />
              </button>
            </>
          )}
          {campaign.status === "paused" && (
            <button
              onClick={() => action("resume")}
              disabled={acting}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Play size={15} />
              استئناف الإرسال
            </button>
          )}
          {(campaign.status === "running" || campaign.status === "paused") && (
            <button
              onClick={() => action("cancel")}
              disabled={acting}
              className="btn-ghost glass rounded-xl p-3 text-red-300 cursor-pointer"
              title="إلغاء الحملة"
            >
              <Ban size={17} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="glass border border-red-400/30 text-red-200 rounded-2xl px-5 py-3.5 text-sm" dir="auto">
          {error}
        </div>
      )}

      {/* completion banner */}
      {campaign.status === "completed" && (
        <div className="rounded-3xl border border-mint/30 bg-mint/8 p-6 flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-mint/15 text-mint flex items-center justify-center">
            <PartyPopper size={22} />
          </span>
          <div>
            <p className="font-extrabold text-lg text-mint">اكتملت الحملة!</p>
            <p className="text-white/55 text-sm">
              وصلت {formatNumber(campaign.sent)} رسالة بنجاح من أصل {formatNumber(campaign.total)}.
            </p>
          </div>
        </div>
      )}

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المستلمين", value: campaign.total, icon: Send, cls: "text-white" },
          { label: "أُرسلت بنجاح", value: campaign.sent, icon: CheckCircle2, cls: "text-mint" },
          { label: "فشلت", value: campaign.failed, icon: XCircle, cls: "text-red-300" },
          { label: "في الانتظار", value: pending, icon: Clock3, cls: "text-amber" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className={`${s.cls}`}>
                <s.icon size={18} />
              </span>
            </div>
            <p className="font-black text-3xl mt-2">{formatNumber(s.value)}</p>
            <p className="text-white/40 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* progress */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="font-bold text-white/60">
            {STATUS_LABEL[campaign.status]}
            {campaign.status === "running" && nextUp && (
              <> — التالية: <b className="text-white">{nextUp.name}</b></>
            )}
          </span>
          <span className="font-black grad-text text-xl">{pct}%</span>
        </div>
        <div className="h-3.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full grad-bg transition-all duration-700 relative"
            style={{ width: `${Math.max(pct, 1)}%` }}
          >
            {campaign.status === "running" && (
              <span className="absolute inset-0 shimmer-bar rounded-full" />
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* message summary */}
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="font-extrabold text-sm text-white/60">محتوى الحملة</h2>
          {campaign.messageText && (
            <div className="rounded-2xl bg-[#26324d] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
              {campaign.messageText}
            </div>
          )}
          {campaign.attachmentType && (
            <div className="flex items-center gap-3 rounded-2xl bg-white/4 border border-white/8 p-3.5 text-sm">
              <span className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                {campaign.attachmentType === "image" ? <ImageIcon size={17} /> : <Film size={17} />}
              </span>
              <div className="min-w-0">
                <p className="font-bold">{campaign.attachmentType === "image" ? "صورة مرفقة" : "فيديو مرفق"}</p>
                <p className="text-white/35 text-xs truncate" dir="ltr">
                  {campaign.attachmentName ?? campaign.attachmentUrl ?? "مرفق مرفوع"}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Timer size={13} />
            كل رسالة بعد {campaign.delaySeconds}–{campaign.delaySeconds + campaign.jitterSeconds} ثانية من سابقتها
          </div>
        </div>

        {/* live log */}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-extrabold text-sm text-white/60 mb-4">
            سجل الإرسال المباشر ({formatNumber(processed.length)})
          </h2>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pe-1">
            {processed.length === 0 && (
              <div className="text-center py-10 text-white/30 text-sm">
                <Clock3 className="mx-auto mb-3 animate-pulse" size={26} />
                {campaign.status === "running"
                  ? "الرسالة الأولى في الطريق..."
                  : "لم تبدأ الرسائل بعد"}
              </div>
            )}
            {processed.map((r) => (
              <div
                key={r.id}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 border text-sm ${
                  r.status === "sent"
                    ? "border-mint/15 bg-mint/5"
                    : "border-red-400/20 bg-red-500/5"
                }`}
              >
                {r.status === "sent" ? (
                  <CheckCircle2 size={16} className="text-mint shrink-0" />
                ) : (
                  <XCircle size={16} className="text-red-300 shrink-0" />
                )}
                <Avatar name={r.name} src={null} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{r.name}</p>
                  {r.error && (
                    <p className="text-[11px] text-red-300/80 truncate" dir="auto" title={r.error}>
                      {r.error}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-white/30 shrink-0">
                  {r.sentAt ? timeAgo(r.sentAt) : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
