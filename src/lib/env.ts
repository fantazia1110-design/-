export function getAppUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * يستنتج النطاق الخارجي الحقيقي للطلب — حتى خلف بروكسي، دون الحاجة لـ APP_URL.
 */
export function getRequestOrigin(req: Request): string {
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    new URL(req.url).host;
  const isLocal =
    /^localhost(:\d+)?$/.test(host) ||
    /^127\./.test(host) ||
    host.endsWith(".local");
  if (isLocal) {
    const proto =
      req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      new URL(req.url).protocol.replace(":", "");
    return `${proto}://${host}`.replace(/\/$/, "");
  }
  // أي نطاق عام يعمل خلف HTTPS دائمًا — فيسبوك يرفض http في روابط التحويل
  return `https://${host}`.replace(/\/$/, "");
}

/**
 * بيانات اعتماد تطبيق فيسبوك الخاص بالبرنامج — مضمّنة من المطوّر مرة واحدة.
 * تُستخدم على الخادم فقط: لا تُرسل للمتصفح ولا تُضمَّن في إضافة كروم إطلاقًا.
 * المعرّف علني بطبيعته؛ والرمز السري يبقى محصورًا في الشيفرة الخادمية هنا.
 * يمكن تجاوز أيٍّ منهما بمتغيرات البيئة عند الحاجة (تدوير السري مثلًا).
 */
const DEFAULT_FACEBOOK_APP_ID = "1613045337112519";
const DEFAULT_FACEBOOK_APP_SECRET = "685da67289b0f121ae9c0e6f144287dd";

export function isFacebookConfigured() {
  return Boolean(getFacebookAppId() && getFacebookAppSecret());
}

export function getFacebookAppId() {
  return process.env.FACEBOOK_APP_ID || DEFAULT_FACEBOOK_APP_ID;
}

export function getFacebookAppSecret() {
  return process.env.FACEBOOK_APP_SECRET || DEFAULT_FACEBOOK_APP_SECRET;
}

export function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "msgr-broadcaster-dev-secret";
}
