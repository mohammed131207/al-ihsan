// ينشئ حساب العرض «تجربة» (ويعمل أيضاً باسم «تست») ببيانات وهمية لشهرين: طالبات، تسميع، مراجعات، اختبارات، غياب، ملاحظات، تذكيرات.
// الأسماء كلها وهمية. الاستخدام: node scripts/demo-seed.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, writeBatch, setDoc, collection, getDocs } = require('firebase/firestore');
const Quran = require('../app/js/quran.js');

const USERNAME = 'تجربة', ALIAS = 'تست', PASS = '123456789';
const Import = new Function(fs.readFileSync(path.join(__dirname, '..', 'app', 'js', 'import.js'), 'utf8') + ';return Import;')();
const key = (u) => crypto.createHash('sha256').update('alihsan:' + Import.norm(u)).digest('hex');
const emailFor = (u) => `u${key(u).slice(0, 28)}@alihsan.app`;

// مولّد أرقام ثابت (نفس البيانات كل مرة)
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const id = () => 'd' + Math.floor(rnd() * 1e12).toString(36) + Math.floor(rnd() * 1e6).toString(36);
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const BEFORE = '1900-01-01';

const app = initializeApp({ apiKey: 'AIzaSyB5yuU58F0HGdhe6SvVAbIlJtpGPkZGBqw', authDomain: 'al-ihsan-quran.firebaseapp.com', projectId: 'al-ihsan-quran' });

const NAMES = [
  ['سلمى خالد العمري', 2, 'h1'], ['ريم أحمد سعيد', 1, 'h1'], ['لين محمد يوسف', 3, 'h1'], ['تالا يوسف ناصر', 1, 'h1'],
  ['جود سامي حمدان', 4, 'h1'], ['حلا عمر عيسى', 2, 'h1'], ['ميار حسن الشامي', 5, 'h1'], ['دانة فادي سالم', 1, 'h1'],
  ['رزان ماهر داود', 2, 'h2'], ['شهد وائل منصور', 6, 'h2'], ['نور الهدى صالح', 3, 'h2'], ['آية إبراهيم زيد', 2, 'h2'], ['بيان طارق حسين', 4, 'h2'],
];
const GRADES = ['ممتاز', 'ممتاز', 'ممتاز', 'جيد جداً', 'جيد جداً', 'جيد'];
const NOTES = ['تحتاج تثبيت المتشابهات', 'ممتازة في التجويد، ما شاء الله', 'تحتاج مراجعة يومية في البيت', 'تحسّن واضح هذا الأسبوع', 'انتبهي لأحكام المدود'];

(async () => {
  const auth = getAuth(app);
  let user;
  try { user = (await createUserWithEmailAndPassword(auth, emailFor(USERNAME), PASS)).user; console.log('created demo account'); }
  catch (e) { if (!String(e.code).includes('email-already-in-use')) throw e; user = (await signInWithEmailAndPassword(auth, emailFor(USERNAME), PASS)).user; console.log('demo account exists, refreshing data'); }
  const db = getFirestore(app);
  const uid = user.uid;

  // نمسح بيانات العرض القديمة (حساب التجربة فقط)
  for (const c of ['halaqat', 'students', 'entries', 'notes', 'reminders']) {
    const snap = await getDocs(collection(db, 'users', uid, c));
    for (let i = 0; i < snap.docs.length; i += 400) { const b = writeBatch(db); snap.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref)); await b.commit(); }
  }

  const now = new Date();
  const halaqat = [{ id: 'h1', name: 'حلقة الفجر', created: '2026-09-01T08:00:00Z' }, { id: 'h2', name: 'حلقة العصر', created: '2026-09-01T08:00:00Z' }];
  const students = [], entries = [], notes = [], reminders = [];
  const start = new Date(2026, 9, 1); // 1 أكتوبر

  for (const [name, juzCount, hid] of NAMES) {
    const s = { id: id(), name, direction: 'backward', halaqaId: hid, juz: {}, created: '2026-09-15T08:00:00Z', archived: false,
      birthDate: `20${pad(8 + Math.floor(rnd() * 8))}-${pad(1 + Math.floor(rnd() * 12))}-${pad(1 + Math.floor(rnd() * 28))}`,
      nationalId: String(400000000 + Math.floor(rnd() * 99999999)), guardianPhone: '059' + String(1000000 + Math.floor(rnd() * 8999999)), phone: '' };
    for (let k = 0; k < juzCount; k++) s.juz[30 - k] = BEFORE;
    // موضع البداية: أول سورة في الجزء الحالي (حفظ من الناس إلى البقرة)
    const j = 30 - juzCount;
    let [cs] = Quran.juzEnd(j); let ca = 1;
    const skill = 0.6 + rnd() * 0.4;
    let testDone = false;
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (dow === 5 || dow === 6) continue; // الجمعة والسبت عطلة
      const date = iso(d), created = d.toISOString();
      if (rnd() < 0.09) { entries.push({ id: id(), studentId: s.id, date, type: 'absent', errors: 0, hints: 0, note: '', created }); continue; }
      if (dow === 4) {
        // الخميس: مراجعة جزء محفوظ
        const rj = 30 - Math.floor(rnd() * Math.max(1, juzCount));
        const [fs1, fa] = Quran.juzStart(rj), [ts, ta] = Quran.juzEnd(rj);
        entries.push({ id: id(), studentId: s.id, date, type: 'review', fromSurah: fs1, fromAyah: fa, toSurah: ts, toAyah: ta, pages: Quran.pages(fs1, fa, ts, ta), grade: pick(GRADES), errors: Math.floor(rnd() * 4), hints: Math.floor(rnd() * 3), note: '', created });
        continue;
      }
      // حفظ جديد: من 3 إلى 12 آية حسب المستوى
      const sur = Quran.surah(cs);
      const ta = Math.min(sur.ayahs, ca + Math.floor((3 + rnd() * 9) * skill));
      entries.push({ id: id(), studentId: s.id, date, type: 'new', fromSurah: cs, fromAyah: ca, toSurah: cs, toAyah: ta, pages: Quran.pages(cs, ca, cs, ta), grade: pick(GRADES), errors: Math.floor(rnd() * 3), hints: Math.floor(rnd() * 2), note: rnd() < 0.08 ? pick(NOTES) : '', created });
      if (ta >= sur.ayahs) {
        // أنهت السورة: إذا كانت أول سورة في الجزء فقد أتمّت الجزء
        const [js, ja] = Quran.juzStart(Quran.juzOf(cs, 1));
        if (js === cs && ja === 1 && !s.juz[Quran.juzOf(cs, 1)]) s.juz[Quran.juzOf(cs, 1)] = date;
        cs = cs - 1; ca = 1;
      } else ca = ta + 1;
      // اختبار متفرق مرة في منتصف أكتوبر لبعض الطالبات
      if (!testDone && d.getMonth() === 9 && d.getDate() >= 14 && rnd() < 0.25) {
        testDone = true;
        const score = Math.round(78 + rnd() * 22);
        entries.push({ id: id(), studentId: s.id, date, type: 'test', testFromJuz: 30, testJuz: 1, score, grade: score >= 90 ? 'ممتاز' : score >= 80 ? 'جيد جداً' : 'جيد', errors: Math.floor(rnd() * 4), hints: Math.floor(rnd() * 3), note: '', created });
      }
    }
    if (juzCount >= 5 && rnd() < 0.7) {
      const score = Math.round(85 + rnd() * 15), date = '2026-11-10';
      entries.push({ id: id(), studentId: s.id, date, type: 'test', testFromJuz: 26, testJuz: 5, score, grade: score >= 90 ? 'ممتاز' : 'جيد جداً', errors: 2, hints: 1, note: '', created: '2026-11-10T09:00:00Z' });
    }
    if (rnd() < 0.5) notes.push({ id: id(), studentId: s.id, date: '2026-11-05', text: pick(NOTES) });
    students.push(s);
  }
  // تذكيرات اختبارات قادمة
  for (const s of students.slice(0, 4)) {
    const d = new Date(now); d.setDate(d.getDate() + 2 + Math.floor(rnd() * 10));
    const n = Object.keys(s.juz).length;
    reminders.push({ id: id(), studentId: s.id, kind: 'test', juz: Math.max(1, n), title: `اختبار ${n <= 1 ? 'جزء واحد' : n === 2 ? 'جزأين' : n + ' أجزاء'}`, date: iso(d), done: false, created: now.toISOString() });
  }

  await setDoc(doc(db, 'users', uid), {
    name: 'محفّظة تجريبية', username: USERNAME, centerName: 'مركز تجريبي لتحفيظ القرآن', recoveryEmail: '',
    settings: { primary: '#B8336A', countryCode: '970', themeV: 2, notify: false, backupEvery: 999 }, dismissed: [], created: '2026-09-01T08:00:00Z',
  });
  const items = [...halaqat.map((x) => ['halaqat', x]), ...students.map((x) => ['students', x]), ...entries.map((x) => ['entries', x]), ...notes.map((x) => ['notes', x]), ...reminders.map((x) => ['reminders', x])];
  for (let i = 0; i < items.length; i += 400) {
    const b = writeBatch(db);
    for (const [c, x] of items.slice(i, i + 400)) b.set(doc(db, 'users', uid, c, x.id), JSON.parse(JSON.stringify(x)));
    await b.commit();
  }
  // «تجربة» و«تست» يدخلان نفس الحساب
  for (const u of [USERNAME, ALIAS]) await setDoc(doc(db, 'usernames', key(u)), { uid, email: emailFor(USERNAME) });
  console.log(`demo ready: ${students.length} students, ${entries.length} entries, ${notes.length} notes, ${reminders.length} reminders`);
  process.exit(0);
})().catch((e) => { console.error('ERR', e.code || '', e.message); process.exit(1); });
