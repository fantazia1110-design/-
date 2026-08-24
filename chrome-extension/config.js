/*
 * عناوين الخادم المرشحة — الإضافة تجربها بالترتيب وتختار العامل تلقائيًا،
 * فلا يُطلب من المستخدم أي إدخال إطلاقًا.
 * عند النشر على نطاق ثابت: اجعل نطاقك هو العنصر الأول دائمًا.
 */
const APP_DEFAULT_ORIGINS = [
  "https://3000-icwo1bc9w1fzplvbq4lrw.e2b.app",
  "https://3000-iakeq2gqoe5gmeumkhkw9.e2b.app",
  "https://3000-ieipzuoeeswq5jyy8gtx4.e2b.app",
  "https://3000-iv5jhgcqfxpiv9cdch00a.e2b.app",
];

/* توافقًا مع الخلفية */
const APP_DEFAULT_ORIGIN = APP_DEFAULT_ORIGINS[0];

if (typeof self !== "undefined") {
  self.APP_DEFAULT_ORIGINS = APP_DEFAULT_ORIGINS;
  self.APP_DEFAULT_ORIGIN = APP_DEFAULT_ORIGIN;
}
