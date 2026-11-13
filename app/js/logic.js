// منطق الحساب: التواريخ، ملخصات الطالبات، التقديرات
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const GRADES = ['ممتاز', 'جيد جداً', 'جيد', 'إعادة'];
const TYPES = { new: 'حفظ جديد', review: 'مراجعة', test: 'اختبار', absent: 'غياب' };
const TYPE_SHORT = { new: 'حفظ', review: 'مراجعة', test: 'اختبار', absent: 'غياب' };
// أسماء الأجزاء المشهورة في المراكز (للاختبار المتفرق)
const JUZ_NAMES = { 30: 'عمّ', 29: 'تبارك', 28: 'قد سمع', 27: 'الذاريات', 26: 'الأحقاف' };
const juzName = (j) => JUZ_NAMES[j] || `الجزء ${j}`;

const D = {
  pad(n) { return String(n).padStart(2, '0'); },
  iso(d) { return `${d.getFullYear()}-${D.pad(d.getMonth() + 1)}-${D.pad(d.getDate())}`; },
  today() { return D.iso(new Date()); },
  parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
  month(s) { return s.slice(0, 7); },
  thisMonth() { return D.today().slice(0, 7); },
  monthName(ym) { const [y, m] = ym.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; },
  monthDays(ym) { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); },
  shiftMonth(ym, k) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return D.iso(d).slice(0, 7); },
  dow(s) { return DAYS[D.parse(s).getDay()]; },
  short(s) { const d = D.parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; },
  long(s) { return `${D.dow(s)} ${D.short(s)}`; },
  slash(s) { return s.replaceAll('-', '/'); },
  daysBetween(a, b) { return Math.round((D.parse(b) - D.parse(a)) / 86400000); },
  relative(s) {
    const n = D.daysBetween(D.today(), s);
    if (n === 0) return 'اليوم';
    if (n === 1) return 'غداً';
    if (n === -1) return 'أمس';
    if (n === 2) return 'بعد يومين';
    if (n === -2) return 'قبل يومين';
    if (n > 0) return `بعد ${n} ${n <= 10 ? 'أيام' : 'يوماً'}`;
    return `قبل ${-n} ${-n <= 10 ? 'أيام' : 'يوماً'}`;
  },
};

function plural(n, one, two, few, many) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}
const juzWord = (n) => (n === 0 ? '0 أجزاء' : plural(n, 'جزء واحد', 'جزآن', 'أجزاء', 'جزءاً'));
const pageWord = (n) => (n === 0 ? '0 وجه' : n === 1 ? 'وجه واحد' : n === 2 ? 'وجهان' : `${fmtNum(n)} ${n <= 10 && Number.isInteger(n) ? 'أوجه' : 'وجهاً'}`);
const errWord = (n) => (n === 0 ? 'بدون أخطاء' : plural(n, 'خطأ واحد', 'خطآن', 'أخطاء', 'خطأً'));
const studentWord = (n) => plural(n, 'طالبة واحدة', 'طالبتان', 'طالبات', 'طالبة');
const sessWord =(n) => (n === 0 ? 'لا جلسات' : plural(n, 'جلسة واحدة', 'جلستان', 'جلسات', 'جلسة'));
const dayWord = (n) => (n === 0 ? '0 أيام' : plural(n, 'يوم واحد', 'يومان', 'أيام', 'يوماً'));
const hintWord =(n) => (n === 0 ? '' : plural(n, 'تنبيه', 'تنبيهان', 'تنبيهات', 'تنبيهاً'));
function fmtNum(n) {
  const v = Number(n);
  if (n === '' || n == null || !isFinite(v)) return String(n ?? '');
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, '');
}

function gradeFromScore(score) {
  if (score >= 90) return 'ممتاز';
  if (score >= 80) return 'جيد جداً';
  if (score >= 70) return 'جيد';
  return 'إعادة';
}

const Logic = {
  studentEntries(data, sid) {
    return data.entries.filter((e) => e.studentId === sid).sort((a, b) => (b.date + b.created).localeCompare(a.date + a.created));
  },

  lastNew(data, sid) {
    return Logic.studentEntries(data, sid).find((e) => e.type === 'new');
  },

  juzCount(student, uptoDate) {
    const juz = student.juz || {};
    return Object.values(juz).filter((d) => !uptoDate || d <= uptoDate).length;
  },

  lastDate(data, sid) {
    const e = Logic.studentEntries(data, sid).find((x) => x.type !== 'absent');
    return e ? e.date : null;
  },

  status(data, s) {
    const today = D.today();
    const last = Logic.lastDate(data, s.id);
    const test = Logic.nextTest(data, s.id);
    const since = last ? D.daysBetween(last, today) : null;
    let text, tone = 'ok';
    if (test) { text = `عليها ${test.title} · ${D.relative(test.date)}`; tone = 'test'; }
    else if (!last) { text = 'لم تُسجَّل أي جلسة بعد'; tone = 'muted'; }
    else if (since === 0) { text = 'سمّعت اليوم'; }
    else if (since >= 7) { text = `لم تُسمّع منذ ${since} ${since <= 10 ? 'أيام' : 'يوماً'}`; tone = 'late'; }
    else { text = `آخر تسميع ${D.relative(last)}`; }
    const absentToday = data.entries.some((e) => e.studentId === s.id && e.type === 'absent' && e.date === today);
    if (absentToday) { text = 'غائبة اليوم'; tone = 'muted'; }
    return { text, tone, since, last, test, today: since === 0 || absentToday, absentToday };
  },

  nextTest(data, sid) {
    return data.reminders
      .filter((r) => r.studentId === sid && !r.done && r.kind === 'test')
      .sort((a, b) => a.date.localeCompare(b.date))[0];
  },

  // اقتراح جدولة اختبار عند إتمام 5 أو 10 أو 15... أجزاء
  suggestions(data) {
    const out = [];
    for (const s of data.students.filter((x) => !x.archived)) {
      const n = Logic.juzCount(s);
      if (n === 0 || n % 5 !== 0) continue;
      const key = `${s.id}:${n}`;
      if (data.dismissed.includes(key)) continue;
      const hasReminder = data.reminders.some((r) => r.studentId === s.id && r.kind === 'test' && r.juz === n);
      const hasTest = data.entries.some((e) => e.studentId === s.id && e.type === 'test' && e.testJuz === n);
      if (!hasReminder && !hasTest) out.push({ key, student: s, juz: n });
    }
    return out;
  },

  monthSummary(data, s, ym) {
    const start = `${ym}-01`, end = `${ym}-${D.pad(D.monthDays(ym))}`;
    const all = data.entries
      .filter((e) => e.studentId === s.id && e.date >= start && e.date <= end)
      .sort((a, b) => (a.date + a.created).localeCompare(b.date + b.created));
    const absences = all.filter((e) => e.type === 'absent');
    const list = all.filter((e) => e.type !== 'absent');
    // آخر اختبار متفرق (جزء واحد) وآخر اختبار مجتمع (أكثر من جزء) حتى نهاية الشهر
    const testsUpTo = data.entries.filter((e) => e.studentId === s.id && e.type === 'test' && e.date <= end)
      .sort((a, b) => (b.date + b.created).localeCompare(a.date + a.created));
    const lastSingle = testsUpTo.find((t) => t.testJuz === 1);
    const lastCombined = testsUpTo.find((t) => t.testJuz > 1);
    const news = list.filter((e) => e.type === 'new');
    const reviews = list.filter((e) => e.type === 'review');
    const tests = list.filter((e) => e.type === 'test');
    const sum = (arr, k) => arr.reduce((t, e) => t + (Number(e[k]) || 0), 0);
    const grades = { 'ممتاز': 0, 'جيد جداً': 0, 'جيد': 0, 'إعادة': 0 };
    list.filter((e) => e.type !== 'test').forEach((e) => { if (grades[e.grade] !== undefined) grades[e.grade]++; });
    const topGrade = Object.entries(grades).sort((a, b) => b[1] - a[1])[0];
    const notes = data.notes.filter((n) => n.studentId === s.id && n.date >= start && n.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date));
    const entryNotes = list.filter((e) => e.note).map((e) => ({ date: e.date, text: e.note }));
    const dayBefore = D.iso(new Date(D.parse(start).getTime() - 86400000));
    return {
      ym, start, end, list, news, reviews, tests, absences, absentDays: new Set(absences.map((e) => e.date)).size,
      lastSingle, lastCombined,
      sessions: new Set(list.map((e) => e.date)).size,
      newPages: sum(news, 'pages'),
      reviewPages: sum(reviews, 'pages'),
      errors: sum(list, 'errors'),
      hints: sum(list, 'hints'),
      grades,
      topGrade: topGrade && topGrade[1] > 0 ? topGrade[0] : '—',
      testScores: tests.map((t) => t.score),
      testAvg: tests.length ? Math.round(sum(tests, 'score') / tests.length) : null,
      juzStart: Logic.juzCount(s, dayBefore),
      juzEnd: Logic.juzCount(s, end),
      firstNew: news[0], lastNew: news[news.length - 1],
      notes: [...notes, ...entryNotes].sort((a, b) => a.date.localeCompare(b.date)),
    };
  },

  // تسمية الاختبار كما في كشوف المراكز: المتفرق باسم الجزء (عمّ)، والمجتمع بمداه (26-30)
  testLabel(e) {
    if (!e || e.type !== 'test' || !e.testJuz) return '';
    if (e.testJuz === 1) return juzName(e.testFromJuz);
    return `${e.testFromJuz}-${e.testFromJuz + e.testJuz - 1}`;
  },

  entryRange(e) {
    if (e.type === 'absent') return 'غياب';
    if (e.type === 'test' && e.testJuz) return e.testJuz === 1 ? `متفرق: ${juzName(e.testFromJuz)}` : `مجتمع: الأجزاء ${e.testFromJuz}–${e.testFromJuz + e.testJuz - 1}`;
    if (!e.fromSurah) return '—';
    return Quran.range(e.fromSurah, e.fromAyah, e.toSurah, e.toAyah);
  },

  entryGrade(e) { return e.type === 'test' ? `${e.score} من 100` : e.type === 'absent' ? '—' : e.grade; },

  // هل وصل هذا التسميع إلى نهاية جزء لم يُعلَّم بعد؟
  completedJuz(student, e) {
    if (e.type !== 'new' || !e.toSurah) return [];
    const toIdx = Quran.index(e.toSurah, e.toAyah);
    const out = [];
    const first = Quran.juzOf(e.fromSurah, e.fromAyah), last = Quran.juzOf(e.toSurah, e.toAyah);
    for (let j = Math.min(first, last); j <= Math.max(first, last); j++) {
      const [es, ea] = Quran.juzEnd(j);
      const [ss, sa] = Quran.juzStart(j);
      const fromIdx = Quran.index(e.fromSurah, e.fromAyah);
      // الحفظ من البقرة للناس: يكتمل الجزء عند الوصول لآخره
      // الحفظ من الناس للبقرة (الأشيع مع الصغار): يكتمل الجزء عند الوصول لأوله
      const edge = student.direction === 'forward' ? Quran.index(es, ea) : Quran.index(ss, sa);
      if (fromIdx <= edge && toIdx >= edge && !(student.juz || {})[j]) out.push(j);
    }
    return out;
  },
};
