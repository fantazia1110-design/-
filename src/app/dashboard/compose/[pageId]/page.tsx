"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Send,
  Image as ImageIcon,
  Film,
  Link2,
  UploadCloud,
  X,
  Timer,
  Shuffle,
  Users,
  Loader2,
  Info,
  CheckCheck,
} from "lucide-react";
import { Avatar } from "@/components/brand";
import { fetchJson, formatDuration, formatNumber } from "@/lib/client-utils";

interface PageInfo {
  id: number;
  name: string;
  pictureUrl: string | null;
}

interface Selection {
  mode: "all" | "selected";
  ids: number[];
}

export default function ComposePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = use(params);
  const router = useRouter();

  const [page, setPage] = useState<PageInfo | null>(null);
  const [totalContacts, setTotalContacts] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [selection, setSelection] = useState<Selection>({ mode: "all", ids: [] });

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [attTab, setAttTab] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"image" | "video">("image");
  const [attUrl, setAttUrl] = useState("");
  const [attUrlType, setAttUrlType] = useState<"image" | "video">("image");
  const [delay, setDelay] = useState(15);
  const [jitter, setJitter] = useState(10);
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson<{
          contacts: { id: number; name: string }[];
          page: PageInfo;
        }>(`/api/pages/${pageId}/contacts`);
        setPage(data.page);
        setTotalContacts(data.contacts.length);
        setNames(data.contacts.slice(0, 6).map((c) => c.name));
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر التحميل");
      }
    })();
    try {
      const raw = sessionStorage.getItem(`compose-sel-${pageId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Selection;
        setSelection(parsed);
        setMode(parsed.mode === "selected" && parsed.ids.length ? "selected" : "all");
      }
    } catch {
      /* ignore */
    }
  }, [pageId]);

  const recipientCount =
    mode === "all" ? totalContacts : Math.min(selection.ids.length, totalContacts);

  const avgPerMsg = delay + jitter / 2;
  const estimatedTotal = avgPerMsg * Math.max(recipientCount - 1, 0);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      setError("الملف يجب أن يكون صورة أو فيديو");
      return;
    }
    setError("");
    setFile(f);
    setFileKind(f.type.startsWith("video/") ? "video" : "image");
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(URL.createObjectURL(f));
  };

  const canSubmit =
    recipientCount > 0 &&
    (text.trim().length > 0 || file !== null || attUrl.trim().length > 0) &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("pageId", pageId);
      fd.set("name", name);
      fd.set("messageText", text);
      fd.set("delaySeconds", String(delay));
      fd.set("jitterSeconds", String(jitter));
      if (file) {
        fd.set("file", file);
        fd.set("attachmentType", fileKind);
      } else if (attUrl.trim()) {
        fd.set("attachmentUrl", attUrl.trim());
        fd.set("attachmentType", attUrlType);
      }
      if (mode === "selected") {
        fd.set("selectionMode", "selected");
        fd.set("contactIds", JSON.stringify(selection.ids));
      } else {
        fd.set("selectionMode", "all");
      }
      const data = await fetchJson<{ campaignId: number }>("/api/campaigns", {
        method: "POST",
        body: fd,
      });
      sessionStorage.removeItem(`compose-sel-${pageId}`);
      router.push(`/dashboard/campaigns/${data.campaignId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء الحملة");
      setSubmitting(false);
    }
  };

  const sliderStyle = (v: number, min: number, max: number) =>
    ({ "--fill": `${((v - min) / (max - min)) * 100}%` }) as React.CSSProperties;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/pages/${pageId}`}
          className="btn-ghost glass rounded-xl p-2.5 text-white/60"
        >
          <ArrowRight size={17} />
        </Link>
        {page && <Avatar name={page.name} src={page.pictureUrl} size={46} />}
        <div>
          <h1 className="text-2xl font-black">حملة رسائل جديدة</h1>
          <p className="text-white/45 text-xs mt-1">
            عبر صفحة «{page?.name ?? "..."}»
          </p>
        </div>
      </div>

      {error && (
        <div className="glass border border-red-400/30 text-red-200 rounded-2xl px-5 py-3.5 text-sm" dir="auto">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* form column */}
        <div className="space-y-5">
          {/* recipients */}
          <section className="glass rounded-3xl p-6">
            <h2 className="font-extrabold flex items-center gap-2 mb-4">
              <Users size={18} className="text-brand" />
              المستلمون
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => setMode("all")}
                className={`rounded-2xl border-2 p-4 text-start transition-all cursor-pointer ${
                  mode === "all"
                    ? "border-brand/60 bg-brand/8"
                    : "border-white/8 hover:border-white/20"
                }`}
              >
                <p className="font-black text-lg">{formatNumber(totalContacts)}</p>
                <p className="text-sm font-bold mt-0.5">كل العملاء</p>
                <p className="text-white/40 text-xs mt-1">
                  {names.slice(0, 3).join("، ")}{totalContacts > 3 ? "..." : ""}
                </p>
              </button>
              <button
                onClick={() => selection.ids.length && setMode("selected")}
                disabled={!selection.ids.length}
                className={`rounded-2xl border-2 p-4 text-start transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  mode === "selected"
                    ? "border-brand/60 bg-brand/8"
                    : "border-white/8 hover:border-white/20"
                }`}
              >
                <p className="font-black text-lg">{formatNumber(selection.ids.length)}</p>
                <p className="text-sm font-bold mt-0.5">المحددون فقط</p>
                <p className="text-white/40 text-xs mt-1">
                  {selection.ids.length
                    ? "تم تحديدهم من صفحة العملاء"
                    : "حدّد عملاء من صفحة العملاء أولًا"}
                </p>
              </button>
            </div>
          </section>

          {/* message */}
          <section className="glass rounded-3xl p-6 space-y-4">
            <h2 className="font-extrabold flex items-center gap-2">
              <Send size={18} className="text-brand" />
              محتوى الرسالة
            </h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم الحملة (اختياري) — مثل: عروض نهاية الأسبوع"
              className="field w-full rounded-xl px-4 py-3 text-sm placeholder:text-white/30"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب نص الرسالة هنا... مثال: أهلًا بك! خصم ٢٠٪ على كل المنتجات هذا الأسبوع فقط."
              rows={5}
              className="field w-full rounded-xl px-4 py-3 text-sm leading-relaxed placeholder:text-white/30 resize-y min-h-28"
            />

            {/* attachment */}
            <div>
              <div className="flex gap-2 mb-3">
                {(
                  [
                    { k: "file", label: "رفع ملف", icon: UploadCloud },
                    { k: "url", label: "رابط مباشر", icon: Link2 },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setAttTab(t.k)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold border transition-colors cursor-pointer ${
                      attTab === t.k
                        ? "bg-white/10 border-white/25"
                        : "border-white/8 text-white/50 hover:text-white"
                    }`}
                  >
                    <t.icon size={14} />
                    {t.label}
                  </button>
                ))}
              </div>

              {attTab === "file" ? (
                file && filePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10">
                    {fileKind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={filePreview} alt="" className="w-full max-h-64 object-cover" />
                    ) : (
                      <video src={filePreview} controls className="w-full max-h-64" />
                    )}
                    <button
                      onClick={() => {
                        setFile(null);
                        if (filePreview) URL.revokeObjectURL(filePreview);
                        setFilePreview(null);
                      }}
                      className="absolute top-3 end-3 glass-strong rounded-xl p-2 hover:text-red-300 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                    <div className="absolute bottom-3 start-3 glass-strong rounded-xl px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5">
                      {fileKind === "image" ? <ImageIcon size={13} /> : <Film size={13} />}
                      {file.name}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      pickFile(e.dataTransfer.files?.[0] ?? null);
                    }}
                    className={`w-full rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                      dragOver ? "border-brand/60 bg-brand/5" : "border-white/12 hover:border-white/25"
                    }`}
                  >
                    <UploadCloud className="mx-auto text-white/30 mb-3" size={30} />
                    <p className="text-sm font-bold">اسحب صورة أو فيديو هنا أو اضغط للاختيار</p>
                    <p className="text-white/35 text-xs mt-1">يُرفع مباشرة إلى فيسبوك كمرفق قابل لإعادة الاستخدام</p>
                  </button>
                )
              ) : (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    value={attUrl}
                    onChange={(e) => setAttUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    dir="ltr"
                    className="field flex-1 rounded-xl px-4 py-3 text-sm placeholder:text-white/30 text-left"
                  />
                  <div className="flex gap-2">
                    {(
                      [
                        { k: "image", label: "صورة", icon: ImageIcon },
                        { k: "video", label: "فيديو", icon: Film },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.k}
                        onClick={() => setAttUrlType(t.k)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold border transition-colors cursor-pointer ${
                          attUrlType === t.k
                            ? "bg-white/10 border-white/25"
                            : "border-white/8 text-white/50 hover:text-white"
                        }`}
                      >
                        <t.icon size={14} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </section>

          {/* timing */}
          <section className="glass rounded-3xl p-6 space-y-6">
            <h2 className="font-extrabold flex items-center gap-2">
              <Timer size={18} className="text-brand" />
              إيقاع الإرسال
            </h2>

            <div>
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="font-bold text-white/70">الفاصل بين الرسائل</span>
                <span className="font-black grad-text text-lg">{delay} ثانية</span>
              </div>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="slider w-full"
                style={sliderStyle(delay, 5, 120)}
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1.5">
                <span>٥ ث (سريع)</span>
                <span>١٢٠ ث (حذِر)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="font-bold text-white/70 inline-flex items-center gap-1.5">
                  <Shuffle size={14} />
                  هامش عشوائي (يبدو طبيعيًا أكثر)
                </span>
                <span className="font-black grad-text text-lg">حتى {jitter} ثانية</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={jitter}
                onChange={(e) => setJitter(Number(e.target.value))}
                className="slider w-full"
                style={sliderStyle(jitter, 0, 60)}
              />
            </div>

            <div className="rounded-2xl bg-white/4 border border-white/8 p-4 text-sm flex flex-wrap gap-x-8 gap-y-2">
              <span className="text-white/50">
                متوسط الإيقاع: <b className="text-white">{avgPerMsg.toFixed(1)} ث/رسالة</b>
              </span>
              <span className="text-white/50">
                المدة التقديرية للحملة:{" "}
                <b className="text-white">{formatDuration(estimatedTotal)}</b>
              </span>
            </div>
          </section>
        </div>

        {/* preview column */}
        <div className="lg:sticky lg:top-24 space-y-5">
          <section className="glass rounded-3xl p-6">
            <h2 className="font-extrabold text-sm text-white/60 mb-5">معاينة حية</h2>
            <div className="rounded-2xl bg-[#0b1020] border border-white/8 p-4 space-y-3 min-h-64">
              <div className="flex items-end gap-2.5">
                {page && <Avatar name={page.name} src={page.pictureUrl} size={30} />}
                <div className="max-w-[80%] space-y-2">
                  {text.trim() && (
                    <div className="rounded-2xl rounded-bl-md bg-[#26324d] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                      {text}
                    </div>
                  )}
                  {(file && filePreview) || attUrl.trim() ? (
                    <div className="rounded-2xl rounded-bl-md overflow-hidden border border-white/10 max-w-56">
                      {file && filePreview ? (
                        fileKind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={filePreview} alt="" className="w-full object-cover" />
                        ) : (
                          <video src={filePreview} className="w-full" />
                        )
                      ) : attUrlType === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attUrl} alt="" className="w-full object-cover" />
                      ) : (
                        <video src={attUrl} className="w-full" />
                      )}
                    </div>
                  ) : null}
                  {!text.trim() && !file && !attUrl.trim() && (
                    <div className="rounded-2xl rounded-bl-md bg-[#26324d]/40 px-4 py-3 text-sm text-white/30">
                      ستظهر رسالتك هنا...
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-start ps-10">
                <span className="text-[10px] text-white/25 inline-flex items-center gap-1">
                  <CheckCheck size={12} />
                  الآن — {page?.name ?? ""}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-brand/8 border border-brand/25 p-3.5 text-[12px] leading-relaxed text-white/60">
              <Info size={14} className="text-brand shrink-0 mt-0.5" />
              <p>
                فيسبوك يسمح بالرسائل خلال <b className="text-white">٢٤ ساعة</b> من
                آخر تفاعل للعميل. العملاء خارج النافذة سيسجَّل لهم خطأ في التقرير
                دون أي أثر على صفحتك.
              </p>
            </div>
          </section>

          {totalContacts === 0 && (
            <Link
              href={`/dashboard/pages/${pageId}`}
              className="glass card-hover rounded-2xl p-4 flex items-center gap-3 text-sm"
            >
              <span className="w-10 h-10 rounded-xl bg-amber/15 text-amber flex items-center justify-center shrink-0">
                <Users size={17} />
              </span>
              <span className="text-white/70">
                لا يوجد عملاء متزامنون لهذه الصفحة بعد —{" "}
                <b className="text-white">اضغط هنا للمزامنة من ماسنجر أولًا</b>
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="btn-primary w-full rounded-2xl py-4 font-black text-base inline-flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                جاري تجهيز الحملة...
              </>
            ) : (
              <>
                <Send size={18} />
                بدء الإرسال إلى {formatNumber(recipientCount)} عميل
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
