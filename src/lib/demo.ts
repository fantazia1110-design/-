export const DEMO_PAGES = [
  {
    facebookPageId: "demo-page-1",
    name: "متجر الأناقة للأزياء",
    category: "ملابس (علامة تجارية)",
    accessToken: "demo-token",
    pictureUrl: null,
  },
  {
    facebookPageId: "demo-page-2",
    name: "مطعم البيت الشرقي",
    category: "مطعم",
    accessToken: "demo-token",
    pictureUrl: null,
  },
  {
    facebookPageId: "demo-page-3",
    name: "عيادة د. سارة لطب الأسنان",
    category: "خدمات طبية وصحية",
    accessToken: "demo-token",
    pictureUrl: null,
  },
];

const FIRST = [
  "أحمد", "محمد", "محمود", "مصطفى", "كريم", "عمر", "يوسف", "إبراهيم",
  "خالد", "طارق", "حسن", "سارة", "فاطمة", "مريم", "نور", "هدى",
  "منى", "أمينة", "ريم", "دينا", "سلمى", "ياسمين", "آية", "سمير",
  "وليد", "هشام", "شريف", "نهى", "إيمان", "أسماء",
];

const LAST = [
  "السيد", "علي", "حسين", "عبد الله", "الشريف", "مصطفى", "إبراهيم",
  "النجار", "حمادة", "فتحي", "عادل", "رمضان", "الدين", "كمال",
  "الطيب", "سليمان", "يحيى", "عثمان", "زكي", "فؤاد",
];

const SNIPPETS = [
  "هل المنتج متوفر باللون الأزرق؟",
  "كام سعر القطعة دي؟",
  "ممكن تفاصيل أكتر عن العرض؟",
  "عايز أعرف مواعيد الشحن",
  "هل في توصيل للجيزة؟",
  "شكرًا جزيلًا على الخدمة",
  "ممكن أحجز موعد يوم الخميس؟",
  "الطلب وصل، شكرًا ليكم",
  "في خصم للكميات؟",
  "محتاج مساعدة في تتبع الطلب",
  "أي مقاسات متاحة دلوقتي؟",
  "ممكن الفاتورة على الواتساب؟",
  "تمام، هفكر وأرد عليكم",
  "هل الدفع عند الاستلام متاح؟",
  "عايز ألغي الطلب رقم 45",
];

function pick<T>(arr: T[], rnd: () => number) {
  return arr[Math.floor(rnd() * arr.length)];
}

// deterministic-ish PRNG so re-syncs are stable per page
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DemoContact {
  psid: string;
  name: string;
  profilePic?: string | null;
  snippet: string;
  threadId: string;
  updatedTime: string;
}

export function generateDemoContacts(pageFbId: string, count: number) {
  let seed = 7;
  for (const ch of pageFbId) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const rnd = mulberry(seed);
  const used = new Set<string>();
  const out: DemoContact[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    let name = "";
    do {
      name = `${pick(FIRST, rnd)} ${pick(LAST, rnd)}`;
    } while (used.has(name));
    used.add(name);
    // spread interactions: 40% inside 24h window, 60% older
    const withinWindow = rnd() < 0.4;
    const ageMs = withinWindow
      ? rnd() * 20 * 3600 * 1000
      : (24 + rnd() * 24 * 20) * 3600 * 1000;
    out.push({
      psid: `${pageFbId}-psid-${i + 1}`,
      name,
      snippet: pick(SNIPPETS, rnd),
      threadId: `${pageFbId}-thread-${i + 1}`,
      updatedTime: new Date(now - ageMs).toISOString(),
    });
  }
  out.sort(
    (a, b) =>
      new Date(b.updatedTime).getTime() - new Date(a.updatedTime).getTime(),
  );
  return out;
}

export function simulateDemoSend(lastInteractionAt: Date | null):
  | { ok: true }
  | { ok: false; error: string } {
  // Emulate Facebook's real 24-hour messaging window behaviour
  if (lastInteractionAt && Date.now() - lastInteractionAt.getTime() > 24 * 3600 * 1000) {
    return {
      ok: false,
      error:
        "(#10) لا يمكن الإرسال: انتهت نافذة الـ 24 ساعة لهذه المحادثة (يتطلب وسم رسالة أو رسالة مدعومة)",
    };
  }
  if (Math.random() < 0.05) {
    return { ok: false, error: "(#368) قيود مؤقتة من فيسبوك — حاول لاحقًا" };
  }
  return { ok: true };
}
