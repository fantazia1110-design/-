"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  CircleCheck,
  CircleDashed,
  CircleX,
  Loader2,
  LogIn,
  FlaskConical,
  Clock3,
  HelpCircle,
  Sparkles,
  AppWindow,
  MousePointerClick,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { useInIframe } from "@/lib/client-utils";

interface Status {
  appIdSet: boolean;
  secretSet: boolean;
  keysValid: boolean | null;
  error: string | null;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold border transition-all cursor-pointer ${
        copied
          ? "bg-mint/15 border-mint/40 text-mint"
          : "bg-white/5 border-white/12 text-white/70 hover:text-white hover:border-white/30"
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "تم النسخ!" : (label ?? "نسخ")}
    </button>
  );
}

function StatusRow({
  ok,
  label,
  hint,
}: {
  ok: boolean | null;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/3 border border-white/7 px-4 py-3">
      {ok === null ? (
        <Loader2 size={17} className="animate-spin text-white/40 shrink-0" />
      ) : ok ? (
        <CircleCheck size={17} className="text-mint shrink-0" />
      ) : (
        <CircleX size={17} className="text-amber shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        {hint && <p className="text-[11px] text-white/40 truncate" dir="auto">{hint}</p>}
      </div>
    </div>
  );
}

export default function SetupPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [origin, setOrigin] = useState("https://YOUR-DOMAIN");
  const [demoLoading, setDemoLoading] = useState(false);
  const inIframe = useInIframe();

  useEffect(() => {
    setOrigin(window.location.origin);
    const check = () =>
      fetch("/api/setup/status", { cache: "no-store" })
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => {});
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, []);

  const redirectUri = `${origin}/api/auth/facebook/callback`;
  const ready = Boolean(status?.keysValid);

  const startDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) throw new Error();
      window.location.href = "/dashboard";
    } catch {
      setDemoLoading(false);
    }
  };

  const steps = [
    {
      title: "أنشئ تطبيقك المجاني",
      desc: (
        <>
          افتح بوابة مطوري فيسبوك وسجّل الدخول <b>بنفس حسابك الحالي</b> صاحب
          الصفحات، ثم «إنشاء تطبيق» واختر النوع «أعمال» (Business). لا موقع
          مطلوب ولا بيانات دفع.
        </>
      ),
      link: { href: "https://developers.facebook.com/apps/create/", label: "فتح صفحة إنشاء التطبيق" },
    },
    {
      title: "أضف منتجَي الدخول والماسنجر",
      desc: (
        <>
          من لوحة تحكم التطبيق: «إضافة منتج» ← فعّل <b>Facebook Login</b> ثم{" "}
          <b>Messenger</b>. يظهران بالقائمة الجانبية بعد التفعيل مباشرة.
        </>
      ),
      link: { href: "https://developers.facebook.com/apps/", label: "فتح قائمة تطبيقاتي" },
    },
    {
      title: "انسخ المعرّف والرمز السري",
      desc: (
        <>
          من «الإعدادات ← الأساسية» ستجد <b>معرّف التطبيق</b> و <b>الرمز السري
          للتطبيق</b> — اضغط «إظهار» وانسخهما.
        </>
      ),
    },
    {
      title: "أضف رابط التحويل الخاص بك",
      desc: (
        <>
          في «Facebook Login ← الإعدادات» ضع هذا الرابط في خانة{" "}
          <b>Valid OAuth Redirect URIs</b> واحفظ:
        </>
      ),
      copy: { text: redirectUri, mono: true },
    },
    {
      title: "بيانات الاعتماد مضمّنة بالكامل",
      desc: (
        <>
          أنجزها المطوّر نيابة عنك: معرّف التطبيق مضمّن، والرمز السري مضمّن في
          كود الخادم فقط (لا يصل للإضافة أو المتصفح إطلاقًا — يمكنك التحقق:
          حالة الفحص أعلاه أخضر بالكامل). <b>لا يُطلب منك ولا من أي مستخدم
          إدخال أي شيء</b> — الخطوات السابقة للإطلاع فقط. تبقى نقرة واحدة من
          جهة فيسبوك نفسه: فعّل «وضع التشغيل» أعلى لوحة تطبيقك ليتمكن أي
          زائر من الدخول بحسابه.
        </>
      ),
      copy: {
        text: `لا شيء مطلوب هنا — كل شيء جاهز`,
        mono: false,
      },
    },
  ];

  const faqs = [
    {
      q: "لماذا لا يمكن بدون هذه الخطوة أصلًا؟",
      a: "لأن الوصول للصفحات ورسائل العملاء لا يتم إلا عبر بوابة مطوري فيسبوك — قاعدة من فيسبوك نفسه تحمي المستخدمين، وتسري على كل الأدوات بلا استثناء حتى المدفوعة منها. أي أداة تَعِد بالوصول المباشر بدونها تعمل بطرق مخالفة تعرّض صفحتك وحسابك للحظر الدائم.",
    },
    {
      q: "هل أنشئ حساب فيسبوك جديدًا؟ هل هي مدفوعة؟",
      a: "لا ولا. تستخدم حسابك الحالي كما هو، وتسجيل التطبيق مجاني 100% ولا يُطلب أي وسيلة دفع. «التطبيق» هنا مجرد مفتاح وصول رسمي باسمك — وليس منتجًا أو موقعًا عليك بناؤه.",
    },
    {
      q: "كيف أتيح الدخول لأي مستخدم (ليس فريق التطوير فقط)؟",
      a: "بنقرة واحدة من جهة فيسبوك: في «وضع التطوير» لا يسجل الدخول إلا أعضاء فريق التطبيق. حوّل التطبيق إلى «وضع التشغيل» من المفتاح أعلى لوحة التطبيق، فيصبح أي شخص قادرًا على الدخول بحسابه ورؤية صفحاته. صلاحية مراسلة كل العملاء (pages_messaging بصلاحية متقدمة) قد تتطلب مراجعة مجانية قصيرة من فيسبوك لاحقًا — وكل ما عداها جاهز من طرف البرنامج فورًا.",
    },
    {
      q: "وما قصة نافذة الـ ٢٤ ساعة؟",
      a: "قاعدة فيسبوك عالمية على الجميع: يمكنك مراسلة العميل بحرية خلال ٢٤ ساعة من آخر رسالة منه لك. بعدها تحتاج وسوم رسائل أو رسائل مدعومة. الأداة ترشّح لك العملاء داخل النافذة بشارة خضراء، وتعرض في التقرير من تعذّر الوصول إليه — دون أي ضرر على صفحتك.",
    },
  ];

  return (
    <main className="bg-scene min-h-screen relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-brand-2/70 to-transparent" />

      <nav className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={38} />
          <span className="font-extrabold">مسنجر برودكاستر</span>
        </Link>
        <Link
          href="/"
          className="btn-ghost glass inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <ArrowRight size={15} />
          الرئيسية
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-20 space-y-8 relative z-10">
        {/* hero */}
        <header className="text-center pt-6 pb-2">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-semibold text-amber">
              <Clock3 size={13} />
              مرة واحدة فقط · مجاني · بحسابك الحالي
            </div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-semibold text-brand">
              <CircleCheck size={13} />
              عامة لأي مستخدم — الدخول بحسابه يكفيه
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-snug">
            معالج ربط <span className="grad-text">حساب فيسبوك الحقيقي</span>
          </h1>
          <p className="text-white/50 mt-4 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
            هذه الخطوات لك أنت كمالك البرنامج — <b className="text-white/80">مرة واحدة فقط</b>.
            بعدها أي شخص يثبّت الإضافة يسجّل دخوله بفيسبوك فورًا ويرى صفحاته،
            دون أن يضيف أي مفاتيح من طرفه إطلاقًا.
          </p>
        </header>

        {/* live status */}
        <section className="glass-strong rounded-3xl p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-extrabold flex items-center gap-2">
              <ShieldCheck size={19} className="text-brand" />
              فحص حي بحالة الربط
            </h2>
            <span className="text-[11px] text-white/35">يتحدث تلقائيًا كل ٥ ثوانٍ</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <StatusRow
              ok={status ? status.appIdSet : null}
              label="معرّف التطبيق FACEBOOK_APP_ID"
              hint={status && !status.appIdSet ? "غير موجود بعد في متغيرات البيئة" : undefined}
            />
            <StatusRow
              ok={status ? status.secretSet : null}
              label="الرمز السري FACEBOOK_APP_SECRET"
              hint={status && !status.secretSet ? "غير موجود بعد في متغيرات البيئة" : undefined}
            />
            <StatusRow
              ok={status ? (status.appIdSet && status.secretSet ? status.keysValid : false) : null}
              label="صلاحية المفاتيح (فحص مباشر مع فيسبوك)"
              hint={status?.error ?? undefined}
            />
          </div>

          {ready ? (
            <div className="mt-5 rounded-2xl border border-mint/30 bg-mint/8 p-5 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-mint/15 text-mint flex items-center justify-center">
                  <Sparkles size={19} />
                </span>
                <div>
                  <p className="font-extrabold text-mint">تم الربط بنجاح!</p>
                  <p className="text-white/55 text-sm">مفاتيحك صالحة — ادخل الآن بحسابك الحقيقي.</p>
                </div>
              </div>
              <a
                href="/api/auth/facebook"
                {...(inIframe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="btn-primary inline-flex items-center gap-2.5 rounded-2xl px-6 py-3.5 font-bold cursor-pointer"
              >
                <LogIn size={17} />
                الدخول بحساب فيسبوك
              </a>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-wrap items-center gap-3 justify-between text-sm text-white/55">
              <span>لم يكتمل الربط بعد — أو تخطَّ الإعداد الآن وجرّب الأداة كاملة:</span>
              <button
                type="button"
                onClick={startDemo}
                disabled={demoLoading}
                className="btn-ghost glass inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold cursor-pointer"
              >
                {demoLoading ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} className="text-brand-3" />}
                {demoLoading ? "جاري التجهيز..." : "الوضع التجريبي"}
              </button>
            </div>
          )}
        </section>

        {/* steps */}
        <section className="space-y-4">
          <h2 className="font-black text-2xl flex items-center gap-2.5">
            <MousePointerClick size={22} className="text-brand-2" />
            الخطوات الخمس
          </h2>
          <div className="space-y-3.5">
            {steps.map((s, i) => (
              <div key={s.title} className="glass card-hover rounded-3xl p-5 sm:p-6 flex gap-5">
                <span className="w-11 h-11 rounded-2xl grad-bg text-lg font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <h3 className="font-extrabold text-lg">{s.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{s.desc}</p>
                  {s.link && (
                    <a
                      href={s.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-brand/12 border border-brand/30 text-brand px-4 py-2.5 text-sm font-bold hover:bg-brand/20 transition-colors"
                    >
                      <ExternalLink size={14} />
                      {s.link.label}
                    </a>
                  )}
                  {s.copy && (
                    <div className="rounded-2xl bg-black/40 border border-white/10 p-4 flex items-start gap-3 justify-between">
                      <code className="text-[12px] text-emerald-300/90 whitespace-pre-wrap break-all leading-relaxed" dir="ltr">
                        {s.copy.text}
                      </code>
                      <CopyButton text={s.copy.text} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-brand/6 border border-brand/20 p-4 text-sm text-white/60">
            <AppWindow size={17} className="text-brand shrink-0 mt-0.5" />
            <p>
              <b className="text-white">الأذونات المطلوبة:</b>{" "}
              <code dir="ltr" className="text-emerald-300/90 text-xs">pages_show_list, pages_messaging</code>
              {" "}— تُطلب تلقائيًا أثناء تسجيل الدخول، وفي «وضع التطوير» تعمل
              فورًا مع صفحاتك وحسابات المختبِرين دون أي مراجعة.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4 pt-4">
          <h2 className="font-black text-2xl flex items-center gap-2.5">
            <HelpCircle size={22} className="text-amber" />
            أسئلة شائعة — بصراحة كاملة
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {faqs.map((f) => (
              <div key={f.q} className="glass rounded-3xl p-6">
                <h3 className="font-extrabold">{f.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed mt-3">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center pt-4">
          <Link href="/" className="text-white/40 text-sm hover:text-white inline-flex items-center gap-1.5">
            <ArrowRight size={14} />
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
