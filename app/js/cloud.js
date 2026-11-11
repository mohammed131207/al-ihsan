// المزامنة مع Firebase: حسابات المحفّظات + قاعدة بيانات Firestore تعمل بدون إنترنت وتتزامن عند الاتصال
const Cloud = (() => {
  const CONFIG = {
    apiKey: 'AIzaSyB5yuU58F0HGdhe6SvVAbIlJtpGPkZGBqw',
    authDomain: 'al-ihsan-quran.firebaseapp.com',
    projectId: 'al-ihsan-quran',
    storageBucket: 'al-ihsan-quran.firebasestorage.app',
    messagingSenderId: '622707989773',
    appId: '1:622707989773:web:7317fc52b8bb8f964d2444',
  };
  const COLS = ['halaqat', 'students', 'entries', 'notes', 'reminders'];
  const PROFILE_KEYS = ['name', 'username', 'centerName', 'settings', 'dismissed'];

  let auth = null, db = null, ready = false;
  let uid = null, unsubs = [], synced = {}, onChange = null;

  function init() {
    if (ready) return;
    firebase.initializeApp(CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    // نسخة محلية من البيانات على الجهاز: القراءة والكتابة تعمل بدون نت وتُرفع عند الاتصال
    db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    ready = true;
  }

  // ترتيب ثابت للمفاتيح حتى نعرف بدقة ما الذي تغيّر
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    return JSON.stringify(v ?? null);
  }
  const clean = (o) => JSON.parse(JSON.stringify(o));

  // اسم المستخدم (بالعربي) ← بريد داخلي ثابت. «احسان» و«إحسان» نفس الحساب
  async function emailFor(username) {
    const n = Import.norm(username);
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('alihsan:' + n));
    const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `u${hex.slice(0, 28)}@alihsan.app`;
  }

  function errorText(e) {
    const c = (e && e.code) || '';
    if (c.includes('network')) return 'لا يوجد اتصال بالإنترنت. أول دخول للحساب على أي جهاز يحتاج إنترنت.';
    if (c.includes('wrong-password') || c.includes('invalid-credential') || c.includes('user-not-found') || c.includes('invalid-login')) return 'اسم المستخدم أو كلمة المرور غير صحيحة';
    if (c.includes('email-already-in-use')) return 'اسم المستخدم مستعمل، اختاري اسماً آخر';
    if (c.includes('weak-password')) return 'كلمة المرور قصيرة، 6 أحرف أو أرقام على الأقل';
    if (c.includes('too-many-requests')) return 'محاولات كثيرة، انتظري دقيقة ثم حاولي';
    if (c.includes('operation-not-allowed') || c.includes('configuration-not-found')) return 'الحسابات غير مفعّلة بعد على الخادم';
    return 'حدث خطأ، حاولي مرة أخرى';
  }

  async function signIn(username, password) {
    return (await auth.signInWithEmailAndPassword(await emailFor(username), password)).user;
  }

  async function signUp(username, password, profile) {
    const user = (await auth.createUserWithEmailAndPassword(await emailFor(username), password)).user;
    await db.doc(`users/${user.uid}`).set(clean({ ...profile, username, created: new Date().toISOString() }));
    return user;
  }

  function signOut() { stop(); return auth.signOut(); }
  const onAuth = (cb) => auth.onAuthStateChanged(cb);
  const currentUser = () => (auth ? auth.currentUser : null);

  function stop() {
    unsubs.forEach((u) => u());
    unsubs = []; synced = {}; uid = null;
  }

  // يقرأ كل البيانات (من النسخة المحلية فوراً، ثم من الخادم) ويستمع لأي تغيير من جهاز آخر
  function start(userId, cb) {
    stop();
    uid = userId; onChange = cb;
    const data = { profile: null };
    COLS.forEach((c) => { data[c] = null; synced[c] = new Map(); });
    let first = true;
    return new Promise((resolve) => {
      const maybeReady = () => {
        if (!first || data.profile === null || COLS.some((c) => data[c] === null)) return;
        first = false;
        resolve(data);
      };
      // نُبلّغ الواجهة فقط عندما يأتي تغيير من جهاز آخر (وليس صدى ما كتبناه نحن)
      unsubs.push(db.doc(`users/${uid}`).onSnapshot((snap) => {
        const p = snap.exists ? snap.data() : {};
        const s = stable(pick(p));
        const remote = !first && s !== synced.profile;
        data.profile = p; synced.profile = s;
        if (first) maybeReady(); else if (remote) onChange && onChange(data);
      }, () => { data.profile = data.profile || {}; maybeReady(); }));
      COLS.forEach((c) => {
        unsubs.push(db.collection(`users/${uid}/${c}`).onSnapshot((snap) => {
          const remote = !first && snap.docChanges().some((ch) => (ch.type === 'removed'
            ? synced[c].has(ch.doc.id)
            : synced[c].get(ch.doc.id) !== stable(ch.doc.data())));
          data[c] = snap.docs.map((d) => d.data());
          synced[c] = new Map(data[c].map((x) => [x.id, stable(x)]));
          if (first) maybeReady(); else if (remote) onChange && onChange(data);
        }, () => { data[c] = data[c] || []; maybeReady(); }));
      });
    });
  }

  const pick = (p) => Object.fromEntries(PROFILE_KEYS.filter((k) => p && p[k] !== undefined).map((k) => [k, p[k]]));

  // يرفع ما تغيّر فقط (إضافة، تعديل، حذف). بدون نت: يُحفظ محلياً ويُرفع لاحقاً تلقائياً
  function push(data) {
    if (!uid) return;
    const ops = [];
    const prof = pick(data);
    const ps = stable(prof);
    if (ps !== synced.profile) { ops.push((b) => b.set(db.doc(`users/${uid}`), clean(prof), { merge: true })); synced.profile = ps; }
    for (const c of COLS) {
      const seen = new Set();
      for (const item of data[c] || []) {
        seen.add(item.id);
        const s = stable(item);
        if (synced[c].get(item.id) !== s) { const v = clean(item); ops.push((b) => b.set(db.doc(`users/${uid}/${c}/${item.id}`), v)); synced[c].set(item.id, s); }
      }
      for (const id of [...synced[c].keys()]) {
        if (!seen.has(id)) { ops.push((b) => b.delete(db.doc(`users/${uid}/${c}/${id}`))); synced[c].delete(id); }
      }
    }
    for (let i = 0; i < ops.length; i += 400) {
      const b = db.batch();
      ops.slice(i, i + 400).forEach((f) => f(b));
      b.commit().catch((e) => console.error('sync', e));
    }
    return ops.length;
  }

  // هل كل التعديلات وصلت للخادم؟
  async function flushed() {
    try { await db.waitForPendingWrites(); return true; } catch (e) { return false; }
  }

  return { init, signIn, signUp, signOut, onAuth, currentUser, start, push, stop, flushed, errorText, emailFor, COLS };
})();
