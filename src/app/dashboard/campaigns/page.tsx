"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  FlaskConical,
} from "lucide-react";
import { fetchJson, formatNumber, timeAgo } from "@/lib/client-utils";

interface CampaignRow {
  id: number;
  name: string;
  pageName: string;
  status: string;
  total: number;
  sent: number;
  failed: number;
  delaySeconds: number;
  attachmentType: string | null;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  running: { label: "قيد الإرسال", cls: "text-brand bg-brand/10 border-brand/25", dot: "bg-brand animate-pulse" },
  paused: { label: "متوقفة مؤقتًا", cls: "text-amber bg-amber/10 border-amber/25", dot: "bg-amber" },
  completed: { label: "مكتملة", cls: "text-mint bg-mint/10 border-mint/25", dot: "bg-mint" },
  canceled: { label: "ملغاة", cls: "text-white/40 bg-white/5 border-white/10", dot: "bg-white/40" },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[] | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await fetchJson<{ campaigns: CampaignRow[] }>("/api/campaigns");
      setCampaigns(data.campaigns);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر التحميل");
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">الحملات</h1>
        <p className="text-white/45 text-sm mt-2">
          سجل كل حملات الإرسال الجماعي مع نتائج كل رسالة.
        </p>
      </div>

      {error && (
        <div className="glass border border-red-400/30 text-red-200 rounded-2xl px-5 py-3.5 text-sm">
          {error}
        </div>
      )}

      {!campaigns && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-3xl h-28 shimmer-bar" />
          ))}
        </div>
      )}

      {campaigns && campaigns.length === 0 && (
        <div className="glass rounded-3xl p-16 text-center">
          <Megaphone className="mx-auto text-white/25 mb-4" size={44} />
          <h2 className="font-extrabold text-xl">لا توجد حملات بعد</h2>
          <p className="text-white/45 text-sm mt-2">
            ابدأ أول حملة من صفحة «صفحاتي» ← «حملة جديدة».
          </p>
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold mt-6"
          >
            <FlaskConical size={15} />
            الذهاب لصفحاتي
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {campaigns?.map((c) => {
          const meta = STATUS_META[c.status] ?? STATUS_META.canceled;
          const pct = c.total ? Math.round(((c.sent + c.failed) / c.total) * 100) : 0;
          return (
            <Link
              key={c.id}
              href={`/dashboard/campaigns/${c.id}`}
              className="glass card-hover rounded-3xl p-5 sm:p-6 block"
            >
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-extrabold text-lg truncate">{c.name}</h2>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full border px-3 py-1 ${meta.cls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-1.5">
                    صفحة «{c.pageName}» · {timeAgo(c.createdAt)} · فاصل {c.delaySeconds} ث
                    {c.attachmentType && (
                      <> · {c.attachmentType === "image" ? "صورة" : "فيديو"}</>
                    )}
                  </p>
                </div>
                <ChevronLeft size={18} className="text-white/30" />
              </div>

              <div className="mt-4 flex items-center gap-4 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1.5 text-white/60">
                  <Clock3 size={13} />
                  {formatNumber(c.total)} مستلم
                </span>
                <span className="inline-flex items-center gap-1.5 text-mint">
                  <CheckCircle2 size={13} />
                  {formatNumber(c.sent)} ناجحة
                </span>
                <span className="inline-flex items-center gap-1.5 text-red-300">
                  <XCircle size={13} />
                  {formatNumber(c.failed)} فاشلة
                </span>
                <div className="flex-1 min-w-40">
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full grad-bg transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="font-black text-sm w-12 text-end">{pct}%</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
