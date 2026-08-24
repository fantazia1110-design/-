importScripts("config.js");

// فتح الشريط الجانبي عند الضغط على أيقونة الإضافة (كروم 114+)
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {});
}

async function openTab(path) {
  const data = await chrome.storage.local.get("appOrigin").catch(() => ({}));
  const origin = data.appOrigin || APP_DEFAULT_ORIGIN;
  chrome.tabs.create({ url: origin + path });
}

// بديل للإصدارات الأقدم: فتح البرنامج في تبويب
chrome.action.onClicked.addListener(() => {
  openTab("/dashboard");
});

// عند أول تثبيت: فتح صفحة الخادم للترحيب
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    openTab("/");
  }
});
