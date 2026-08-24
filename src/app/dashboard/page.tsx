"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Users,
  Send,
  MessageSquareText,
  ChevronLeft,
  Store,
  Sparkles,
  Pin,
} from "lucide-react";
import { Avatar } from "@/components/brand";
import { fetchJson, formatNumber } from "@/lib/client-utils";

interface PageRow {
  id: number;
  facebookPageId: string;
  name: string;
  category: string | null;
  pictureUrl: string | null;
  contactsCount: number;
  pinned?: boolean;
}

interface PinningInfo {
  enabled: boolean;
  label: string;
}

export default function DashboardPage() {
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [pinning, setPinning] = useState<PinningInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await fetchJson<{
        pages: PageRow[];
        isDemo: boolean;
        pinning: PinningInfo | null;
      }>("/api/pages");
      setPages(data.pages);
      setIsDemo(data.isDemo);
      setPinning(data.pinning ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر التحميل");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refreshPages = async () => {
    setRefreshing(true);
    setError("");
    try {
      if (!isDemo) await fetchJson("/api/pages", { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التحديث");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">صفحات فيسبوك</h1>
          <p className="text-white/45 text-sm mt-2">
            كل الصفحات المرتبطة بحسابك — اختر صفحة لعرض عملائها أو بدء حملة.
          </p>
        </div>
        <button
          onClick={refreshPages}
          disabled={refreshing}
          className="btn-ghost glass inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "جاري التحديث..." : "تحديث من فيسبوك"}
        </button>
      </div>

      {error && (
        <div className="glass border border-red-400/30 text-red-200 rounded-2xl px-5 py-3.5 text-sm">
          {error}
        </div>
      )}

      {pinning?.enabled && (
        <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3 border border-brand/25 bg-brand/6">
          <span className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center shrink-0">
            <Pin size={17} />
          </span>
          <div className="text-sm">
            <p className="font-extrabold">وضع الصفحة المثبتة مفعّل</p>
            <p className="text-white/50 text-xs mt-0.5">
              هذا التثبيت يتعامل حصريًا مع الصفحة {pinning.label} — لن تظهر أي صفحة أخرى.
            </p>
          </div>
        </div>
      )}

      {!pages && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-3xl p-6 h-44 shimmer-bar" />
          ))}
        </div>
      )}

      {pages && pages.length === 0 && (
        <div className="glass rounded-3xl p-14 text-center">
          <Store className="mx-auto text-white/25 mb-4" size={44} />
          <h2 className="font-extrabold text-xl">
            {pinning?.enabled ? "لم نعثر على الصفحة المثبتة" : "لا توجد صفحات بعد"}
          </h2>
          <p className="text-white/45 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            {pinning?.enabled
              ? `هذا التثبيت مخصص للصفحة ${pinning.label} فقط — تأكد أنك سجلت الدخول بالحساب المسؤول عنها، ثم اضغط «تحديث من فيسبوك».`
              : "لم نعثر على صفحات مرتبطة بحسابك. تأكد أنك مسؤول عن صفحة فيسبوك ثم اضغط «تحديث من فيسبوك»."}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {pages?.map((p, i) => (
          <div
            key={p.id}
            className="glass card-hover rounded-3xl p-6 flex flex-col"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start gap-4">
              <Avatar name={p.name} src={p.pictureUrl} size={54} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-lg leading-snug truncate">{p.name}</h2>
                  {p.pinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/10 border border-brand/25 rounded-full px-2 py-0.5 shrink-0">
                      <Pin size={10} />
                      مثبتة
                    </span>
                  )}
                </div>
                {p.category && (
                  <p className="text-white/40 text-xs mt-1 truncate">{p.category}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand border border-brand/20 px-3 py-1 text-xs font-bold">
                <Users size={13} />
                {formatNumber(p.contactsCount)} عميل متزامن
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-5 pt-5 border-t border-white/6">
              <Link
                href={`/dashboard/pages/${p.id}`}
                className="btn-ghost glass rounded-xl px-3 py-2.5 text-sm font-bold text-center inline-flex items-center justify-center gap-1.5"
              >
                <MessageSquareText size={15} />
                العملاء
              </Link>
              <Link
                href={`/dashboard/compose/${p.id}`}
                className="btn-primary rounded-xl px-3 py-2.5 text-sm font-bold text-center inline-flex items-center justify-center gap-1.5"
              >
                <Send size={15} />
                حملة جديدة
              </Link>
            </div>
          </div>
        ))}
      </div>

      {pages && pages.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-white/35 pt-2">
          <Sparkles size={13} className="text-brand-2" />
          اضغط «العملاء» لمزامنة محادثات ماسنجر وتحديد المستلمين
          <ChevronLeft size={13} />
        </div>
      )}
    </div>
  );
}
