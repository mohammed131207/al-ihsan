// يحفظ ملفات التطبيق على الجهاز حتى يفتح ويعمل بدون إنترنت
const VERSION = 'halaqa-v5';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/quran.js', 'js/db.js', 'js/logic.js', 'js/native.js', 'js/export.js', 'js/import.js', 'js/app.js',
  'vendor/exceljs.min.js', 'vendor/html2canvas.min.js', 'vendor/jspdf.umd.min.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'vendor/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2',
  'vendor/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2',
  'vendor/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2',
  'vendor/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2',
  'vendor/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2',
  'vendor/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2',
  'vendor/fonts/readex-pro-arabic-500-normal.woff2',
  'vendor/fonts/readex-pro-arabic-600-normal.woff2',
  'vendor/fonts/readex-pro-arabic-700-normal.woff2',
  'vendor/fonts/readex-pro-latin-500-normal.woff2',
  'vendor/fonts/readex-pro-latin-600-normal.woff2',
  'vendor/fonts/readex-pro-latin-700-normal.woff2',
  'vendor/fonts/amiri-arabic-700-normal.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الملفات من الذاكرة أولاً، مع تحديثها في الخلفية عند توفّر الإنترنت
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      const res = await network;
      return res || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => {
    if (list[0]) return list[0].focus();
    return self.clients.openWindow('./#/reminders');
  }));
});
