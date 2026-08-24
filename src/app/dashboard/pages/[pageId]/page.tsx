"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  RefreshCw,
  Search,
  Send,
  Users,
  CheckCheck,
  CircleAlert,
} from "lucide-react";
import { Avatar } from "@/components/brand";
import { fetchJson, timeAgo, isWithin24h, formatNumber } from "@/lib/client-utils";

interface Contact {
  id: number;
  psid: string;
  name: string;
  profilePic: string | null;
  snippet: string | null;
  lastInteractionAt: string | null;
}

interface PageInfo {
  id: number;
  name: string;
  pictureUrl: string | null;
  facebookPageId: string;
}

export default function ContactsPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = use(params);
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [page, setPage] = useState<PageInfo | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const data = await fetchJson<{ contacts: Contact[]; page: PageInfo }>(
      `/api/pages/${pageId}/contacts`,
    );
    setContacts(data.contacts);
    setPage(data.page);
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "تعذر التحميل"));
  }, [pageId]);

  const sync = async () => {
    setSyncing(true);
    setError("");
    try {
      const data = await fetchJson<{ contacts: Contact[]; synced: number }>(
        `/api/pages/${pageId}/contacts`,
        { method: "POST" },
      );
      setContacts(data.contacts);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشلت المزامنة");
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const q = search.trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.includes(q) || (c.snippet ?? "").includes(q),
    );
  }, [contacts, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allFilteredSelected) {
      filtered.forEach((c) => next.delete(c.id));
    } else {
      filtered.forEach((c) => next.add(c.id));
    }
    setSelected(next);
  };

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const goCompose = (mode: "all" | "selected") => {
    const ids = mode === "all" ? (contacts ?? []).map((c) => c.id) : Array.from(selected);
    sessionStorage.setItem(
      `compose-sel-${pageId}`,
      JSON.stringify({ mode, ids }),
    );
    router.push(`/dashboard/compose/${pageId}`);
  };

  const withinCount = (contacts ?? []).filter((c) =>
    isWithin24h(c.lastInteractionAt),
  ).length;

  return (
    <div className="space-y-6 pb-28">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="btn-ghost glass rounded-xl p-2.5 text-white/60"
          >
            <ArrowRight size={17} />
          </Link>
          {page && <Avatar name={page.name} src={page.pictureUrl} size={46} />}
          <div>
            <h1 className="text-2xl font-black">{page?.name ?? "..."}</h1>
            <p className="text-white/45 text-xs mt-1">
              عملاء تواصلوا مع الصفحة عبر ماسنجر
            </p>
          </div>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold cursor-pointer"
        >
          <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
          {syncing ? "جاري سحب المحادثات..." : "مزامنة محادثات ماسنجر"}
        </button>
      </div>

      {error && (
        <div className="glass border border-red-400/30 text-red-200 rounded-2xl px-5 py-3.5 text-sm flex items-start gap-2">
          <CircleAlert size={16} className="shrink-0 mt-0.5" />
          <span dir="auto">{error}</span>
        </div>
      )}

      {/* stats chips */}
      {contacts && contacts.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs font-bold">
          <span className="glass rounded-full px-4 py-2 inline-flex items-center gap-2 text-white/70">
            <Users size={14} className="text-brand" />
            {formatNumber(contacts.length)} عميل
          </span>
          <span className="glass rounded-full px-4 py-2 inline-flex items-center gap-2 text-mint">
            <CheckCheck size={14} />
            {formatNumber(withinCount)} داخل نافذة الـ ٢٤ ساعة
          </span>
          <span className="glass rounded-full px-4 py-2 inline-flex items-center gap-2 text-white/70">
            {formatNumber(selected.size)} محدد
          </span>
        </div>
      )}

      {/* toolbar */}
      {contacts && contacts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="field flex items-center gap-2.5 rounded-xl px-4 py-2.5 flex-1 min-w-56 cursor-text">
            <Search size={16} className="text-white/35" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو نص المحادثة..."
              className="bg-transparent outline-none w-full text-sm placeholder:text-white/30"
            />
          </label>
          <button
            onClick={toggleAll}
            className="btn-ghost glass rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer"
          >
            {allFilteredSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
          </button>
        </div>
      )}

      {/* list */}
      {!contacts && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass rounded-2xl h-18 shimmer-bar" />
          ))}
        </div>
      )}

      {contacts && contacts.length === 0 && (
        <div className="glass rounded-3xl p-16 text-center">
          <MessageSquareTextIcon />
          <h2 className="font-extrabold text-xl mt-4">لا يوجد عملاء متزامنون بعد</h2>
          <p className="text-white/45 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            اضغط «مزامنة محادثات ماسنجر» لسحب كل الأشخاص الذين راسلوا صفحتك
            سابقًا.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {filtered.map((c) => {
          const isSel = selected.has(c.id);
          const within = isWithin24h(c.lastInteractionAt);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`w-full text-start glass rounded-2xl px-4 py-3.5 flex items-center gap-4 transition-all cursor-pointer ${
                isSel
                  ? "border-brand/60 bg-brand/8 shadow-[0_0_0_4px_rgba(59,157,255,0.08)]"
                  : "hover:bg-white/5"
              }`}
            >
              <span
                className={`w-5.5 h-5.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSel ? "bg-brand border-brand" : "border-white/20"
                }`}
              >
                {isSel && (
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="white" strokeWidth="4">
                    <path d="M4 12.5 9.5 18 20 6.5" />
                  </svg>
                )}
              </span>
              <Avatar name={c.name} src={c.profilePic} size={44} />
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{c.name}</p>
                {c.snippet && (
                  <p className="text-white/40 text-xs truncate mt-0.5">{c.snippet}</p>
                )}
              </div>
              <div className="text-end shrink-0">
                <p className="text-[11px] text-white/40">{timeAgo(c.lastInteractionAt)}</p>
                <span
                  className={`inline-block mt-1.5 text-[10px] font-bold rounded-full px-2.5 py-0.5 border ${
                    within
                      ? "text-mint bg-mint/10 border-mint/25"
                      : "text-white/35 bg-white/5 border-white/10"
                  }`}
                >
                  {within ? "داخل نافذة ٢٤س" : "نافذة مغلقة"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* sticky action bar */}
      {contacts && contacts.length > 0 && (
        <div className="fixed bottom-5 inset-x-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 sm:w-[560px] z-50">
          <div className="glass-strong rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl shadow-black/50">
            <div className="flex-1 text-sm font-bold pe-2">
              <span className="grad-text text-lg font-black">{formatNumber(selected.size)}</span>{" "}
              <span className="text-white/60">من {formatNumber(contacts.length)} محدد</span>
            </div>
            <button
              onClick={() => goCompose("selected")}
              disabled={selected.size === 0}
              className="btn-primary rounded-xl px-5 py-3 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Send size={15} />
              إرسال للمحددين
            </button>
            <button
              onClick={() => goCompose("all")}
              className="btn-ghost glass rounded-xl px-5 py-3 text-sm font-bold cursor-pointer"
            >
              إرسال للجميع
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageSquareTextIcon() {
  return (
    <div className="w-16 h-16 mx-auto rounded-3xl glass-strong flex items-center justify-center text-white/25">
      <Users size={28} />
    </div>
  );
}
