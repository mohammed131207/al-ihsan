// عند التشغيل كتطبيق أندرويد (APK) نستخدم إمكانيات الجوال: المشاركة، الملفات، الإشعارات، فتح واتساب
const Native = (() => {
  const C = window.Capacitor;
  const isNative = !!(C && C.isNativePlatform && C.isNativePlatform());
  const P = isNative ? C.Plugins : {};

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  // نحفظ الملف مؤقتاً ثم نفتح قائمة المشاركة (Drive، واتساب، الملفات...)
  async function shareFile(blob, filename, title) {
    const data = await blobToBase64(blob);
    const safe = filename.replace(/[\\/:*?"<>|]/g, '-');
    const res = await P.Filesystem.writeFile({ path: safe, data, directory: 'CACHE' });
    try {
      await P.Share.share({ title: title || safe, files: [res.uri], dialogTitle: title || safe });
      return 'shared';
    } catch (e) {
      return /cancel/i.test(String(e && (e.message || e))) ? 'cancelled' : 'shared';
    }
  }

  async function openUrl(url) {
    try { await P.AppLauncher.openUrl({ url }); } catch (e) { location.href = url; }
  }

  async function notifyPermission() {
    const r = await P.LocalNotifications.requestPermissions();
    return r.display === 'granted';
  }

  // إشعارات الساعة 7 صباحاً في يوم كل اختبار/تذكير (تعمل والتطبيق مغلق)
  let timer = null;
  function scheduleReminders(data, studentName) {
    if (!isNative) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const pending = await P.LocalNotifications.getPending();
        if (pending.notifications.length) await P.LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
        if (!data.settings.notify) return;
        const now = Date.now();
        const list = data.reminders
          .filter((r) => !r.done)
          .map((r) => {
            const [y, m, d] = r.date.split('-').map(Number);
            return { r, at: new Date(y, m - 1, d, 7, 0, 0) };
          })
          .filter((x) => x.at.getTime() > now)
          .slice(0, 60)
          .map((x, i) => ({
            id: 1000 + i,
            title: x.r.kind === 'test' ? 'اختبار اليوم' : 'تذكير اليوم',
            body: `${studentName(x.r.studentId)}: ${x.r.title}`,
            schedule: { at: x.at, allowWhileIdle: true },
            smallIcon: 'ic_stat_notify',
            iconColor: '#0E5E4E',
          }));
        if (list.length) await P.LocalNotifications.schedule({ notifications: list });
      } catch (e) { /* الإشعارات ليست ضرورية لعمل التطبيق */ }
    }, 800);
  }

  return { isNative, P, shareFile, openUrl, notifyPermission, scheduleReminders };
})();
