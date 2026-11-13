// تخزين محلي على الجهاز (IndexedDB) — كل شيء يعمل بدون إنترنت
const DB = (() => {
  const NAME = 'halaqa-db';
  const STORE = 'kv';
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function get(key) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const r = db.transaction(STORE).objectStore(STORE).get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  async function set(key, value) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function del(key) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // نطلب من المتصفح ألّا يحذف البيانات تلقائياً
  async function persist() {
    try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (e) {}
    return false;
  }

  return { get, set, del, persist };
})();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function hashSecret(text, salt) {
  const input = `${salt}:${text}`;
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // احتياط بسيط إذا لم تتوفر مكتبة التشفير (مثلاً عند الفتح من ملف)
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 'f' + (h >>> 0).toString(16);
}

function emptyData(halaqaName) {
  return {
    v: 1,
    halaqaName: halaqaName || 'حلقتي',
    students: [],
    entries: [],
    notes: [],
    reminders: [],
    dismissed: [],
    settings: { primary: '#B8336A', countryCode: '970', lastBackup: null, backupEvery: 7 },
  };
}
