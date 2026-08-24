/**
 * تثبيت صفحة معيّنة (اختياري — معطّل حاليًا).
 *
 * الإضافة الآن عامة لأي مستخدم: يسجّل بحسابه فيرى كل الصفحات التي يملكها أو
 * يديرها. إن أردت لاحقًا تقييد تثبيتٍ ما بصفحة واحدة، أضفها هنا فقط.
 */
export const PINNED_PAGES: ReadonlyArray<{
  facebookPageId: string;
  name: string;
}> = [
  // مثال عند الحاجة:
  // { facebookPageId: "102402202945188", name: "عالم المنظفات ومستحضرات التجميل والعطور" },
];

export const PINNING_ENABLED = PINNED_PAGES.length > 0;

export function isPinnedPage(facebookPageId: string) {
  return PINNED_PAGES.some((p) => p.facebookPageId === facebookPageId);
}

export const PINNED_PAGES_LABEL = PINNED_PAGES.map((p) => `«${p.name}»`).join(
  "، ",
);
