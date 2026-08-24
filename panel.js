/*
 * اللوحة لا تجري أي نداءات شبكية بنفسها (قيود CORS على سياق الإضافات).
 * الإطار الداخلي هو نفس أصل الخادم فيدير الجلسة وتسجيل الدخول والتحديث
 * التلقائي — اللوحة فقط تعرضه وتحفظ رابط الخادم.
 */
const frame = document.getElementById("app");
const overlay = document.getElementById("setupOverlay");
const originInput = document.getElementById("originInput");
const originLabel = document.getElementById("originLabel");
const originError = document.getElementById("originError");
const saveBtn = document.getElementById("saveOrigin");

let APP_ORIGIN = "";

function hostLabel() {
  try {
    originLabel.textContent = new URL(APP_ORIGIN).host;
  } catch {
    originLabel.textContent = "";
  }
}

function loadFrame(path) {
  frame.src = APP_ORIGIN + (path || "/dashboard");
}

/**
 * ينظف الرابط من الرموز الخفية التي تأتي مع النسخ من نص عربي RTL،
 * ويلتقط أول URL من النص، ويضيف https إن كتب المستخدم الدومين فقط.
 */
function sanitizeOrigin(raw) {
  const cleaned = String(raw || "")
    .replace(/[‎-‏‪-‮⁦-⁩﻿]/g, "")
    .trim();
  const match = cleaned.match(/https?:\/\/[^\s"'<>]+/i);
  let v = (match ? match[0] : cleaned).replace(/["'<>،؛.,;:!؟]+$/, "");
  if (!/^https?:\/\//i.test(v)) {
    if (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(v)) v = "https://" + v;
  }
  return v.replace(/\/+$/, "");
}

function isValidOrigin(v) {
  return /^https:\/\/.+\..+/.test(v) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(v);
}

function showError(msg) {
  originInput.style.borderColor = "#f87171";
  if (originError) {
    originError.textContent = msg;
    originError.hidden = false;
  }
}

function clearError() {
  originInput.style.borderColor = "";
  if (originError) originError.hidden = true;
}

function save() {
  const v = sanitizeOrigin(originInput.value);
  if (!isValidOrigin(v)) {
    showError("الرابط غير صالح — تأكد أنه يبدأ بـ https:// بدون رموز أو نصوص إضافية");
    return;
  }
  APP_ORIGIN = v;
  originInput.value = v;
  clearError();
  overlay.hidden = true;
  overlay.style.display = "none"; // ضمان مضاعف مع قاعدة CSS
  hostLabel();
  loadFrame();
  chrome.storage.local.set({ appOrigin: v }).catch(() => {});
}

saveBtn.addEventListener("click", save);
originInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    save();
  }
});
originInput.addEventListener("input", clearError);

document.getElementById("settings").addEventListener("click", () => {
  originInput.value = APP_ORIGIN || "";
  clearError();
  overlay.style.display = "";
  overlay.hidden = false;
});

document.getElementById("reload").addEventListener("click", () => {
  if (!APP_ORIGIN) return;
  try {
    frame.contentWindow.location.reload();
  } catch {
    loadFrame();
  }
});

document.getElementById("openTab").addEventListener("click", () => {
  if (APP_ORIGIN) chrome.tabs.create({ url: APP_ORIGIN + "/dashboard" });
});

/** يجرب العناوين المرشحة ويعيد أول خادم حي — تلقائي بالكامل. */
async function probe(origins) {
  for (const o of origins) {
    try {
      const r = await fetch(o + "/api/health", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json().catch(() => null);
        if (d && d.ok) return o;
      }
    } catch {
      /* جرّب التالي */
    }
  }
  return null;
}

async function boot() {
  const data = await chrome.storage.local.get("appOrigin").catch(() => ({}));
  let origin = data.appOrigin || null;
  if (!origin) {
    // اكتشاف تلقائي صامت لأول خادم شغال — بلا أي سؤال للمستخدم
    origin = await probe(APP_DEFAULT_ORIGINS);
    if (origin) chrome.storage.local.set({ appOrigin: origin }).catch(() => {});
  }
  if (origin) {
    APP_ORIGIN = origin;
    hostLabel();
    loadFrame();
  } else {
    // لا خادم متاح من القائمة — الإدخال اليدوي fallback فقط
    originInput.value = "";
    clearError();
    overlay.style.display = "";
    overlay.hidden = false;
  }
}

boot();
