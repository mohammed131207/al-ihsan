// يبني app/seed.json (حساب جاهز + الطالبات) من ملفات Excel الخاصة بالمحفّظة.
// الملف الناتج فيه بيانات شخصية: لا يُرفع على GitHub (موجود في .gitignore) ولا يدخل في الموقع العام.
//
// الاستخدام:
//   node scripts/seed-from-excel.js --name "إحسان" --center "مركز آلاء الرحمن الإلكتروني" --pass "..." \
//        --report "تقرير الشهر.xlsx" --students "بيانات الطالبات.xlsx" --month 2026-10
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const Quran = require('../app/js/quran.js');

const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : ''; };
const NAME = arg('name'), CENTER = arg('center'), PASS = arg('pass'), REPORT = arg('report'), STUDENTS = arg('students');
const MONTH = arg('month') || '2026-10';
if (!NAME || !PASS) { console.error('--name and --pass are required'); process.exit(1); }

// نفس دوال التطبيق (import.js) لتوحيد الأسماء والتواريخ والأرقام
const Import = new Function(fs.readFileSync(path.join(__dirname, '..', 'app', 'js', 'import.js'), 'utf8') + ';return Import;')();
const norm = Import.norm;
const uid = () => Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
const cell = (v) => (v && typeof v === 'object' ? (v.richText ? v.richText.map((t) => t.text).join('') : v.result ?? v.text ?? v) : v);
const txt = (v) => String(cell(v) ?? '').replace(/\s+/g, ' ').trim();

const surahByName = new Map();
for (const s of Quran.surahs) { surahByName.set(norm(s.name), s.n); surahByName.set(norm(s.name).replace(/^ال/, ''), s.n); }
const surahOf = (v) => { const k = norm(txt(v)); return k ? surahByName.get(k) || surahByName.get(k.replace(/^ال/, '')) || null : null; };

async function rows(file) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const out = [];
  wb.worksheets[0].eachRow((r) => out.push(r.values.slice(1).map(cell)));
  return out;
}

// تطابق الأسماء بين الملفين حتى لو اختلفت قليلاً (مثلاً: «داليا أبو حطب» و«داليا محمد يوسف أبو حطب»)
function sameName(a, b) {
  const A = txt(a).split(' ').map(norm).filter(Boolean), B = txt(b).split(' ').map(norm).filter(Boolean);
  if (A.join('') === B.join('')) return true;
  return A[0] === B[0] && A[A.length - 1] === B[B.length - 1];
}

(async () => {
  const students = [];
  const notes = [];
  const monthEnd = `${MONTH}-${String(new Date(+MONTH.slice(0, 4), +MONTH.slice(5), 0).getDate()).padStart(2, '0')}`;
  const BEFORE = '1900-01-01';

  // ملف البيانات الشخصية: م | الاسم | تاريخ الميلاد | رقم الهوية | الجوال
  if (STUDENTS) {
    for (const r of await rows(STUDENTS)) {
      const name = txt(r[1]);
      if (!name || !/^\d+$/.test(txt(r[0]))) continue;
      students.push({
        id: uid(), name, direction: 'backward', juz: {}, archived: false, created: new Date().toISOString(),
        birthDate: Import.cleanDate(cell(r[2])), nationalId: txt(r[3]).replace(/\D/g, ''),
        phone: '', guardianPhone: Import.cleanPhone(cell(r[4])),
      });
    }
  }

  // تقرير الشهر: م | الاسم | الأجزاء | بداية (سورة، آية) | نهاية (سورة، آية) | صفحات الحفظ | صفحات المراجعة | آخر اختبار متفرق | آخر اختبار مجتمع | الغياب | ملحوظات
  if (REPORT) {
    for (const r of await rows(REPORT)) {
      const name = txt(r[1]);
      if (!name || !/^\d+$/.test(txt(r[0]))) continue;
      let s = students.find((x) => sameName(x.name, name));
      if (!s) { s = { id: uid(), name, direction: 'backward', juz: {}, archived: false, created: new Date().toISOString(), birthDate: '', nationalId: '', phone: '', guardianPhone: '' }; students.push(s); }
      const juzN = Math.min(30, parseInt(txt(r[2]), 10) || 0);
      const fs1 = surahOf(r[3]), fa = parseInt(txt(r[4]), 10) || 1, ts = surahOf(r[5]), ta = parseInt(txt(r[6]), 10) || 1;
      if (fs1 && ts) s.direction = fs1 < ts || (fs1 === ts && fa <= ta) ? 'forward' : 'backward';
      for (let k = 0; k < juzN; k++) s.juz[s.direction === 'forward' ? k + 1 : 30 - k] = BEFORE;
      if (ts) s.lastPos = { surah: ts, ayah: Math.min(ta, Quran.surah(ts).ayahs), date: monthEnd };
      const parts = [];
      if (fs1 && ts) parts.push(`من ${Quran.label(fs1, fa)} إلى ${Quran.label(ts, ta)}`);
      if (txt(r[7])) parts.push(`حفظ ${txt(r[7])} وجهاً`);
      if (txt(r[8])) parts.push(`مراجعة ${txt(r[8])} وجهاً`);
      if (txt(r[11])) parts.push(`أيام الغياب: ${txt(r[11])}`);
      if (txt(r[9])) parts.push(`آخر اختبار متفرق: ${txt(r[9])}`);
      if (txt(r[10])) parts.push(`آخر اختبار مجتمع: ${txt(r[10])}`);
      if (txt(r[12])) parts.push(txt(r[12]));
      if (parts.length) notes.push({ id: uid(), studentId: s.id, date: monthEnd, text: `تقرير ${MONTH.slice(5) === '10' ? 'أكتوبر' : MONTH} ${MONTH.slice(0, 4)}: ${parts.join(' · ')}` });
    }
  }

  const salt = crypto.randomBytes(8).toString('hex');
  const account = {
    id: 'acc' + crypto.randomBytes(5).toString('hex'), name: NAME, salt,
    passHash: crypto.createHash('sha256').update(`${salt}:${PASS}`).digest('hex'),
    pinHash: null, created: new Date().toISOString(),
  };
  const data = {
    v: 1, halaqaName: CENTER || 'حلقتي', students, entries: [], notes, reminders: [], dismissed: [],
    settings: { primary: '#0E5E4E', countryCode: '970', lastBackup: null, backupEvery: 7 }, changes: 0,
  };
  const out = path.join(__dirname, '..', 'app', 'seed.json');
  fs.writeFileSync(out, JSON.stringify({ account, data }));
  console.log(`seed.json: ${students.length} students, ${notes.length} notes`);
  for (const s of students) console.log(` - ${s.name} | ${s.direction} | juz ${Object.keys(s.juz).length} | next after ${s.lastPos ? Quran.label(s.lastPos.surah, s.lastPos.ayah) : '-'} | ${s.birthDate || '-'} | ${s.guardianPhone || '-'}`);
})();
