# مسنجر برودكاستر — مشروع الخادم (Next.js 16 + PostgreSQL)

برنامج رسائل ماسنجر الجماعية لعملاء صفحات فيسبوك — إضافة كروم في `chrome-extension/`
+ خادم Next.js يدير OAuth وبيانات الاعتماد ومحرك الإرسال المجدول.

## النشر الدائم (رابط ثابت — 10 دقائق)

هذا المشروع Next.js قياسي + PostgreSQL — يعمل على أي استضافة Node حديثة.

### الخيار الأسرع: Vercel + قاعدة Postgres مُدارة (Neon/Supabase/…)

1. ارفع المشروع إلى GitHub ثم استورده في Vercel (Build افتراضي: `npm run build`).
2. أنشئ قاعدة Postgres (Neon.tech مجانًا مثلًا) وخذ رابطها.
3. في Vercel ← Environment Variables أضف:
   - `DATABASE_URL` = رابط القاعدة
   - (اختياري للتدوير لاحقًا) `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`
4. بعد أول نشر ناجح نفّذ تهيئة الجداول **مرة واحدة** من جهازك:
   ```bash
   DATABASE_URL="<رابط_القاعدة>" npx drizzle-kit push
   ```
5. ثبّت النطاق: `https://your-domain.vercel.app` (أو نطاقك الخاص).

### الخيار الثاني: VPS

```bash
npm install
npm run build
DATABASE_URL="postgres://..." npx drizzle-kit push
DATABASE_URL="postgres://..." npm run start   # خلف Nginx + HTTPS
```

## بعد النشر الدائم — 4 تعديلات ربط (مرة أخيرة نهائيًا)

1. **فيسبوك**: في إعدادات Facebook Login بتطبيقك أضف
   `https://YOUR-DOMAIN/api/auth/facebook/callback` واحذف روابط المعاينة المؤقتة.
2. **الإضافة**: في `chrome-extension/config.js` اجعل نطاقك الدائم العنصر الأول
   في `APP_DEFAULT_ORIGINS` ثم أعد تثبيت/تحديث الإضافة.
3. **مفاتيح التطبيق**: مضمّنة في `src/lib/env.ts` — عدّلها هناك عند تدوير السري
   (لا تضعها في الإضافة إطلاقًا؛ الإضافة لا تحتاج أي مفاتيح).
4. **وضع التشغيل**: فعّل Live أعلى لوحة تطبيقك ليتمكن أي مستخدم من الدخول.

## التشغيل التجريبي بدون أي إعداد

كل شيء يعمل فورًا عبر زر «تجربة الوضع التجريبي» حتى بدون مفاتيح فيسبوك.

## بنية الكود

```
src/app/                 واجهات (عربية RTL): الرئيسية، /setup، /dashboard/*
src/app/api/             REST: auth(facebook/demo/logout), pages, contacts, campaigns
src/lib/facebook.ts      عميل Graph API v21 (OAuth + صفحات + محادثات + إرسال)
src/lib/env.ts           بيانات الاعتماد المضمّنة + استنتاج النطاق التلقائي
src/lib/session.ts       جلسات كوكي (SameSite=None للإضافة)
src/lib/pinned.ts        تثبيت صفحة معيّنة (اختياري — معطّل)
src/db/schema.ts         جداول Drizzle: users/pages/contacts/campaigns/recipients
chrome-extension/        إضافة MV3: شريط جانبي + اكتشاف خادم تلقائي + بلا أسرار
```
