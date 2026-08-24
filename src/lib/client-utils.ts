export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `خطأ في الخادم (${res.status})`);
  }
  return data;
}

const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

export function timeAgo(isoOrDate?: string | Date | null) {
  if (!isoOrDate) return "—";
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const diff = date.getTime() - Date.now();
  const absSec = Math.abs(diff / 1000);
  if (absSec < 60) return "الآن";
  if (absSec < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (absSec < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (absSec < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return date.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
}

export function isWithin24h(isoOrDate?: string | Date | null) {
  if (!isoOrDate) return false;
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return Date.now() - date.getTime() < 24 * 3600 * 1000;
}

export function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) return `${Math.round(totalSeconds)} ثانية`;
  const mins = totalSeconds / 60;
  if (mins < 60) return `${Math.round(mins)} دقيقة`;
  const hours = Math.floor(mins / 60);
  const rest = Math.round(mins % 60);
  return `${hours} ساعة${rest ? ` و ${rest} دقيقة` : ""}`;
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("ar-EG").format(n);
}

/** True when the app is embedded (e.g. inside the Chrome extension side panel). */
export function useInIframe() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
