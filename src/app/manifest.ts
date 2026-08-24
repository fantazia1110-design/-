import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مسنجر برودكاستر — رسائل ماسنجر الجماعية",
    short_name: "برودكاستر",
    description:
      "برنامج إرسال رسائل جماعية (نص وصور وفيديو) لعملاء صفحات فيسبوك عبر ماسنجر — تسجيل دخول بفيسبوك فقط.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: "#05070e",
    theme_color: "#05070e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
