"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Users,
  Timer,
  ImagePlay,
  ShieldCheck,
  LayoutDashboard,
  MousePointerClick,
  MessageSquareText,
  FlaskConical,
  ArrowLeft,
  KeyRound,
  Webhook,
  CheckCircle2,
  WandSparkles,
  Info,
  LogIn,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { useInIframe } from "@/lib/client-utils";

function AuthErrorBanner() {
  const params = useSearchParams();
  const err = params.get("authError");
  if (!err) return null;
  return (
    <div className="glass-strong border border-red-400/30 text-red-200 rounded-2xl px-5 py-3.5 text-sm max-w-lg">
      {err}
    </div>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: "عملاؤك الحقيقيون فقط",
    desc: "سحب تلقائي لكل من راسل صفحتك على ماسنجر سابقًا — لا قوائم مزيفة ولا أرقام عشوائية.",
  },
  {
    icon: ImagePlay,
    title: "نص + صور + فيديو",
    desc: "أنشئ رسالة واحدة تجمع نصًا وصورة أو فيديو، وترفع مباشرة إلى فيسبوك لتصل بجودة كاملة.",
  },
  {
    icon: Timer,
    title: "فواصل زمنية ذكية",
    desc: "حدد الفاصل بين الرسائل مع هامش عشوائي يحاكي الإيقاع الطبيعي ويحترم حدود فيسبوك.",
  },
  {
    icon: ShieldCheck,
    title: "آمن ورسمي 100%",
    desc: "تسجيل دخول حقيقي عبر Facebook Login وواجهة Graph API الرسمية — صفحتك في أمان تام.",
  },
];

const STEPS = [
  {
    icon: LogIn,
    title: "سجّل بحسابك",
    desc: "دخول آمن عبر فيسبوك يعرض كل الصفحات المرتبطة بحسابك تلقائيًا.",
  },
  {
    icon: MousePointerClick,
    title: "اختر الصفحة والعملاء",
    desc: "زامن محادثات ماسنجر، تصفح العملاء، وحدد من تريد أو اختر الجميع.",
  },
  {
    icon: Send,
    title: "اكتب وأرسل",
    desc: "نص أو صورة أو فيديو، اضبط الفاصل الزمني، وتابع الإرسال لحظة بلحظة.",
  },
];

interface SessionInfo {
  user: { name: string; isDemo: boolean } | null;
  facebookConfigured: boolean;
}

export default function LandingPage() {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState("");
  const [fbConfigured, setFbConfigured] = useState<boolean | null>(null);
  const [session, setSession] = useState<SessionInfo["user"]>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const inIframe = useInIframe();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SessionInfo | null) => {
        if (d) {
          setFbConfigured(Boolean(d.facebookConfigured));
          setSession(d.user ?? null);
        }
        setSessionChecked(true);
      })
      .catch(() => setSessionChecked(true));
  }, []);

  // عند التشغيل داخل إطار الإضافة: راقب تسجيل الدخول (يحدث في تبويب خارجي)
  // وانتقل للوحة التحكم تلقائيًا فور اكتماله — نداء نفس-الأصل فلا قيود CORS.
  useEffect(() => {
    if (!inIframe || session) return;
    const t = setInterval(() => {
      fetch("/api/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: SessionInfo | null) => {
          if (d?.user) window.location.href = "/dashboard";
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(t);
  }, [inIframe, session]);

  const startDemo = async () => {
    setDemoLoading(true);
    setDemoError("");
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) throw new Error("تعذر بدء الوضع التجريبي — أعد المحاولة بعد لحظات");
      window.location.href = "/dashboard";
    } catch (e) {
      setDemoError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setDemoLoading(false);
    }
  };

  return (
    <main className="bg-scene min-h-screen relative">
      {/* top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-brand-2/70 to-transparent" />

      {/* nav */}
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Logo size={42} />
          <div>
            <p className="font-extrabold text-lg leading-none">مسنجر برودكاستر</p>
            <p className="text-[11px] text-white/45 mt-1">رسائل جماعية عبر واجهة فيسبوك الرسمية</p>
          </div>
        </div>
        <a
          href="/api/auth/facebook"
          className="btn-ghost glass hidden sm:inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <LogIn size={16} />
          دخول
        </a>
      </nav>

      {/* hero */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-10 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-semibold text-brand/90 mb-6">
              <Sparkles size={13} />
              مبني على Facebook Graph API الرسمية
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black leading-[1.15]">
              رسّل لكل عملائك
              <br />
              على <span className="grad-text">ماسنجر</span> بضغطة واحدة
            </h1>
            <p className="text-white/55 text-lg leading-relaxed mt-6 max-w-xl">
              سجّل الدخول بحساب فيسبوك الحقيقي، اختر صفحتك، وحدّد العملاء الذين
              راسلوك سابقًا — ثم أرسل لهم رسالة نصية أو صورة أو فيديو دفعة
              واحدة، مع فواصل زمنية تضبطها بنفسك.
            </p>

            {sessionChecked && session ? (
              <div className="mt-9 glass-strong rounded-3xl p-6 max-w-lg border border-mint/25">
                <p className="text-white/60 text-sm">أنت مسجل الدخول بالفعل كـ</p>
                <p className="font-black text-xl mt-1">{session.name}</p>
                <Link
                  href="/dashboard"
                  className="btn-primary inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 font-bold text-base mt-5 w-full justify-center"
                >
                  <LayoutDashboard size={18} />
                  متابعة إلى لوحة التحكم — صفحاتي
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4 mt-9">
                <a
                  href="/api/auth/facebook"
                  {...(inIframe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="btn-primary inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 font-bold text-base"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden>
                    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
                  </svg>
                  الدخول بحساب فيسبوك
                  {inIframe && <span className="text-[10px] opacity-80">(في تبويب جديد)</span>}
                </a>
                <button
                  type="button"
                  onClick={startDemo}
                  disabled={demoLoading}
                  className="btn-ghost glass inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 font-bold text-base cursor-pointer"
                >
                  {demoLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <FlaskConical size={18} className="text-brand-3" />
                  )}
                  {demoLoading ? "جاري التجهيز..." : "تجربة الوضع التجريبي"}
                </button>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {demoError && (
                <div className="glass-strong border border-red-400/30 text-red-200 rounded-2xl px-5 py-3.5 text-sm max-w-lg">
                  {demoError}
                </div>
              )}
              {fbConfigured === false && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber/8 border border-amber/25 p-4 text-sm text-white/65 max-w-xl">
                  <Info size={16} className="text-amber shrink-0 mt-0.5" />
                  <p>
                    زر «الدخول بحساب فيسبوك» يتطلب ضبط مفاتيح تطبيقك أولًا —{" "}
                    <a href="/setup" className="text-amber font-bold underline underline-offset-4">
                      معالج الإعداد التفاعلي
                    </a>{" "}
                    يرشدك خطوة بخطوة (٥ دقائق)، أو ابدأ فورًا بزر{" "}
                    <b className="text-white">«تجربة الوضع التجريبي»</b>.
                  </p>
                </div>
              )}
              <Suspense fallback={null}>
                <AuthErrorBanner />
              </Suspense>
            </div>

            <div className="flex flex-wrap gap-6 mt-10 text-sm text-white/45">
              {[
                "صفحاتك الحقيقية",
                "بدون كلمات مرور",
                "تقارير إرسال لحظية",
              ].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-mint" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* visual */}
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-tr from-brand/20 via-brand-2/20 to-brand-3/20 blur-3xl rounded-full" />
            <div className="relative glass-strong rounded-3xl p-3 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero.jpg"
                alt="رسائل ماسنجر"
                className="rounded-2xl w-full object-cover aspect-[4/3]"
              />
              {/* floating cards */}
              <div className="absolute -bottom-6 start-6 glass-strong rounded-2xl px-5 py-4 flex items-center gap-3 animate-float">
                <span className="w-10 h-10 rounded-xl bg-mint/15 text-mint flex items-center justify-center">
                  <Send size={18} />
                </span>
                <div>
                  <p className="text-xs text-white/50">تم الإرسال بنجاح</p>
                  <p className="font-extrabold text-lg leading-tight">١٢٤ رسالة</p>
                </div>
              </div>
              <div className="absolute -top-6 end-6 glass-strong rounded-2xl px-5 py-4 flex items-center gap-3 animate-float-slow">
                <span className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                  <Timer size={18} />
                </span>
                <div>
                  <p className="text-xs text-white/50">الفاصل الزمني</p>
                  <p className="font-extrabold text-lg leading-tight">١٥ ثانية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="text-3xl sm:text-4xl font-black text-center">
          كل ما تحتاجه <span className="grad-text">للتواصل الجماعي</span>
        </h2>
        <p className="text-white/50 text-center mt-3 max-w-2xl mx-auto">
          صُممت الأداة للصفحات التجارية التي تريد الوصول لعملائها المتفاعلين
          فعلًا — بشكل منظم وآمن.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass card-hover rounded-3xl p-6">
              <span className="w-12 h-12 rounded-2xl grad-bg/20 bg-gradient-to-br from-brand/20 to-brand-2/20 text-brand flex items-center justify-center mb-5">
                <f.icon size={22} />
              </span>
              <h3 className="font-extrabold text-lg">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="glass rounded-[2.5rem] p-8 sm:p-14 relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-40" />
          <div className="relative">
            <h2 className="text-3xl font-black text-center">كيف تعمل؟</h2>
            <div className="grid md:grid-cols-3 gap-10 mt-12">
              {STEPS.map((s, i) => (
                <div key={s.title} className="text-center">
                  <div className="relative inline-flex">
                    <span className="w-16 h-16 rounded-3xl glass-strong flex items-center justify-center text-brand">
                      <s.icon size={26} />
                    </span>
                    <span className="absolute -top-2 -end-2 w-7 h-7 rounded-full grad-bg text-sm font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xl mt-5">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mt-2 max-w-xs mx-auto">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* setup guide */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
        <div className="glass rounded-[2rem] p-7 sm:p-10 border border-white/10">
            <div className="flex items-center gap-3 mb-8">
            <span className="w-11 h-11 rounded-2xl bg-amber/15 text-amber flex items-center justify-center">
              <KeyRound size={20} />
            </span>
            <div>
              <h2 className="text-2xl font-black">للدخول بحسابك الحقيقي</h2>
              <p className="text-white/50 text-sm">
                مرة واحدة فقط — مجاني · ~٥ دقائق · بدون حساب جديد
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { icon: KeyRound, t: "تطبيق مجاني", d: "مفتاح وصول رسمي تنشئه من بوابة مطوري فيسبوك بحسابك الحالي." },
              { icon: Webhook, t: "٥ خطوات موجّهة", d: "معالج تفاعلي بروابط مباشرة وأزرار نسخ وفحص حي للمفاتيح." },
              { icon: CheckCircle2, t: "بدون مراجعة للتجربة", d: "في وضع التطوير تعمل الصلاحيات فورًا مع صفحاتك أنت." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl bg-white/3 border border-white/8 p-4">
                <c.icon size={18} className="text-brand mb-2.5" />
                <p className="font-extrabold">{c.t}</p>
                <p className="text-white/45 text-xs leading-relaxed mt-1">{c.d}</p>
              </div>
            ))}
          </div>
          <a
            href="/setup"
            className="btn-primary inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 font-bold mt-8 cursor-pointer"
          >
            <WandSparkles size={18} />
            فتح معالج الإعداد التفاعلي
          </a>
          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-brand/8 border border-brand/25 p-4 text-sm text-white/65">
            <Info size={17} className="text-brand shrink-0 mt-0.5" />
            <p>
              فيسبوك يسمح بالرسائل الحرة خلال <b>٢٤ ساعة</b> من آخر رسالة من
              العميل. الرسائل خارج النافذة تُظهر خطأ لكل مستلم على حدة داخل
              تقرير الحملة — ولن تتأثر صفحتك. حتى تجهز مفاتيحك، جرّب{" "}
              <b>الوضع التجريبي</b> ببيانات عربية كاملة.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14">
        <div className="grad-bg rounded-[2rem] p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-30" />
          <div className="relative">
            <LayoutDashboard className="mx-auto mb-5 opacity-90" size={36} />
            <h2 className="text-3xl sm:text-4xl font-black">جاهز تبدأ؟</h2>
            <p className="text-white/85 mt-3 max-w-xl mx-auto">
              ادخل الآن وشاهد صفحاتك وعملاءك الحقيقيين — أو استكشف الأداة فورًا
              بالوضع التجريبي.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <a
                href="/api/auth/facebook"
                className="inline-flex items-center gap-2 rounded-2xl bg-white text-gray-900 font-extrabold px-7 py-3.5 hover:scale-[1.03] transition-transform"
              >
                <LogIn size={18} />
                الدخول بفيسبوك
              </a>
              <button
                onClick={startDemo}
                className="inline-flex items-center gap-2 rounded-2xl bg-black/25 border border-white/25 font-extrabold px-7 py-3.5 hover:bg-black/35 transition-colors cursor-pointer"
              >
                <FlaskConical size={18} />
                الوضع التجريبي
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/35 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <MessageSquareText size={14} />
          مسنجر برودكاستر — يعمل عبر واجهة فيسبوك الرسمية فقط، ولا يخزن كلمات مرور.
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href="/messenger-broadcaster-chrome-extension.zip?v=8"
            download
            className="inline-flex items-center gap-1.5 text-brand hover:text-white transition-colors font-bold"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            تنزيل إضافة جوجل كروم
          </a>
          <a
            href="/messenger-broadcaster-server-project.zip"
            download
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors font-bold"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            تنزيل مشروع الخادم كاملًا
          </a>
          <a href="/setup" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors font-bold">
            معالج الإعداد
          </a>
        </div>
      </footer>
    </main>
  );
}
