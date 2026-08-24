import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "مسنجر برودكاستر — رسائل جماعية لعملاء صفحتك على ماسنجر",
  description:
    "أداة آمنة عبر واجهة فيسبوك الرسمية لإرسال رسائل نصية وصور وفيديو لعملاء صفحتك المتفاعلين على ماسنجر، مع تحديد المستلمين وفواصل زمنية ذكية.",
};

export const viewport: Viewport = {
  themeColor: "#05070e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
