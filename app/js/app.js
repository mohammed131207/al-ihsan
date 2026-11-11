// الإحسان — الواجهة والتنقل
const $app = document.getElementById('app');
const $dlg = document.getElementById('dialog');
const BEFORE = '1900-01-01'; // تاريخ رمزي للأجزاء المحفوظة قبل التسجيل في التطبيق

const S = {
  accounts: [], account: null, data: null, draft: null, lastHash: null,
  ui: { filter: 'all', q: '', tab: 'log', logLimit: 20, remTab: 'up', repMonth: D.thisMonth(), repScope: 'all', repStudent: '', incNotes: true, incPersonal: false },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  sset(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} },
};

// ===== أيقونات =====
const P = {
  users: '<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3.5"/><path d="M21 19v-1a4 4 0 0 0-3-3.9"/><path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  chart: '<path d="M5 20V11"/><path d="M12 20V4"/><path d="M19 20v-6"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="m9 6 6 6-6 6"/>',
  fwd: '<path d="m15 6-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5z"/><path d="m9.5 13.5 2 2 3.5-3.5"/>',
  offline: '<path d="M2 2l20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M12 20h.01"/><path d="M5 12.9a10 10 0 0 1 5.2-2.8"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  book: '<path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5z"/><path d="M12 6v13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  chat: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  userPlus: '<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3.5"/><path d="M19 8v6M16 11h6"/>',
  upload: '<path d="M12 20V9"/><path d="m7 14 5-5 5 5"/><path d="M5 4h14"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
};
const icon = (n, size = 20, sw = 2) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const PATTERN = `<svg class="pattern" aria-hidden="true" viewBox="0 0 390 260" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#fff" stroke-width="1.2"><rect x="24" y="24" width="56" height="56"/><rect x="24" y="24" width="56" height="56" transform="rotate(45 52 52)"/><rect x="300" y="170" width="64" height="64"/><rect x="300" y="170" width="64" height="64" transform="rotate(45 332 202)"/><rect x="310" y="20" width="36" height="36"/><rect x="310" y="20" width="36" height="36" transform="rotate(45 328 38)"/><rect x="44" y="190" width="40" height="40"/><rect x="44" y="190" width="40" height="40" transform="rotate(45 64 210)"/></svg>`;

// ===== أدوات عامة =====
function toast(text) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 2800);
}

function confirmBox(title, text, ok = 'تأكيد', danger = false) {
  return new Promise((resolve) => {
    $dlg.innerHTML = `<form method="dialog"><h2>${esc(title)}</h2><p>${esc(text)}</p>
      <div class="btn-row"><button class="btn ${danger ? 'danger' : 'primary'}" value="ok">${esc(ok)}</button><button class="btn" value="no">إلغاء</button></div></form>`;
    $dlg.onclose = () => resolve($dlg.returnValue === 'ok');
    $dlg.returnValue = '';
    $dlg.showModal();
  });
}

async function save() {
  S.data.changes = (S.data.changes || 0) + 1;
  await DB.set('data:' + S.account.id, S.data);
  if (Native.isNative) Native.scheduleReminders(S.data, (id) => (student(id) || {}).name || '');
}

// معاينة أوراق A4 على شاشة الجوال: تصغير لتناسب العرض
function fitSheets() {
  const box = document.querySelector('.sheets');
  if (box) box.style.zoom = Math.min(1, (window.innerWidth - 16) / 794);
}

function applyTheme() {
  const c = (S.data && S.data.settings.primary) || '#0E5E4E';
  document.documentElement.style.setProperty('--primary', c);
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = c;
}

const student = (id) => S.data.students.find((s) => s.id === id);
const activeStudents = () => S.data.students.filter((s) => !s.archived).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
const firstName = (n) => (n || '').trim().split(/\s+/)[0];
const initial = (n) => (n || '?').trim().charAt(0);
const surahOptions = (sel) => Quran.surahs.map((s) => `<option value="${s.n}"${s.n === Number(sel) ? ' selected' : ''}>${s.n}. ${s.name}</option>`).join('');
const juzOptions = (sel) => Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}"${i + 1 === Number(sel) ? ' selected' : ''}>الجزء ${i + 1}</option>`).join('');

function backupAge() {
  const lb = S.data.settings.lastBackup;
  return lb ? D.daysBetween(lb.slice(0, 10), D.today()) : null;
}

function statusPill() {
  const age = backupAge();
  if (!navigator.onLine) return `<span class="status-pill">${icon('offline', 14, 2.2)} بدون نت · محفوظ على الجهاز</span>`;
  return `<span class="status-pill on">${icon('cloud', 14, 2.2)} ${age === null ? 'محفوظ على الجهاز' : age === 0 ? 'نسخة اليوم محفوظة' : 'محفوظ على الجهاز'}</span>`;
}

function nav(cur) {
  const due = S.data.reminders.filter((r) => !r.done && D.daysBetween(D.today(), r.date) <= 2).length;
  const item = (h, k, ic, label, badge) => `<a href="${h}"${cur === k ? ' aria-current="page"' : ''}><span class="pillbg">${icon(ic, 22)}</span>${label}${badge ? `<span class="dot">${badge}</span>` : ''}</a>`;
  return `<nav class="nav" aria-label="التنقل الرئيسي"><div class="nav-inner">
    ${item('#/students', 'students', 'users', 'الطالبات')}
    ${item('#/reminders', 'reminders', 'bell', 'التذكيرات', due)}
    ${item('#/reports', 'reports', 'chart', 'التقارير')}
    ${item('#/settings', 'settings', 'sliders', 'الإعدادات')}
  </div></nav>`;
}

// آخر موضع حفظ: من آخر تسميع «حفظ جديد»، أو من الموضع المسجّل عند الاستيراد إذا لم يُسجَّل تسميع بعده
function lastPosition(s) {
  const e = Logic.lastNew(S.data, s.id);
  if (e && (!s.lastPos || e.date >= s.lastPos.date)) return e;
  if (s.lastPos) return { toSurah: s.lastPos.surah, toAyah: s.lastPos.ayah, date: s.lastPos.date };
  return e || null;
}

function nextPosition(s) {
  const last = lastPosition(s);
  const back = s.direction !== 'forward';
  if (last) {
    const sur = Quran.surah(last.toSurah);
    if (last.toAyah < sur.ayahs) return [last.toSurah, last.toAyah + 1];
    if (back) return last.toSurah > 1 ? [last.toSurah - 1, 1] : [1, 1];
    return Quran.next(last.toSurah, last.toAyah);
  }
  const n = Logic.juzCount(s);
  if (back) {
    const j = Math.max(1, 30 - n);
    const [es] = Quran.juzEnd(j);
    const [ss, sa] = Quran.juzStart(j);
    return [es, ss === es ? sa : 1];
  }
  return Quran.juzStart(Math.min(30, n + 1));
}

function currentJuz(s) {
  const [a, b] = nextPosition(s);
  return Quran.juzOf(a, b);
}

// ===== شاشات الدخول =====
function hero(sub) {
  return `<div class="hero">${PATTERN}<img class="logo-img" src="icons/icon.svg" alt="" width="76" height="76"><h1>الإحسان</h1><p>${esc(sub || 'لتحفيظ القرآن الكريم · الحفظ والمراجعة والاختبارات')}</p></div>`;
}
const FOOT = `<div class="foot-notes"><span>${icon('offline', 16)} يعمل بدون إنترنت</span><span>${icon('cloud', 16)} نسخ احتياطي على Drive</span></div>`;

function vWelcome() {
  return `<main class="screen no-nav">${hero()}
  <div class="stack" style="padding-top:40px;gap:12px">
    <h2 style="font-size:22px;text-align:center">أهلاً وسهلاً</h2>
    <p class="muted" style="margin:0 0 8px;text-align:center">${S.accounts.length ? 'ادخلي إلى حسابك، أو أنشئي حساباً جديداً لمحفّظة أخرى.' : 'ابدئي بإنشاء حساب المحفّظة.'}</p>
    ${S.accounts.length ? `<a class="btn primary lg block" href="#/login">${icon('lock', 18)} تسجيل الدخول</a>` : ''}
    <a class="btn ${S.accounts.length ? '' : 'primary '}lg block" href="#/setup">${icon('userPlus', 18)} إنشاء حساب جديد</a>
  </div>${FOOT}</main>`;
}

function vSetup() {
  return `<main class="screen no-nav">${hero()}
  <form data-form="setup" class="stack" style="padding-top:24px" novalidate>
    <h2 style="font-size:22px">إنشاء حساب المحفّظة</h2>
    <p class="muted small" style="margin:0">الحساب محفوظ على هذا الجهاز فقط، ويمكن إضافة أكثر من محفّظة على نفس الجهاز.</p>
    <div class="field"><label for="f-name">اسم المحفّظة</label><input id="f-name" name="name" required autocomplete="name" placeholder="مثال: أمل محمود"></div>
    <div class="field"><label for="f-halaqa">اسم المركز أو الحلقة</label><input id="f-halaqa" name="halaqa" placeholder="مثال: مركز النور لتحفيظ القرآن"></div>
    <div class="field"><label for="f-pass">كلمة المرور</label><input id="f-pass" name="pass" type="password" required minlength="4" autocomplete="new-password"><span class="hint">4 أحرف أو أرقام على الأقل</span></div>
    <div class="field"><label for="f-pass2">تأكيد كلمة المرور</label><input id="f-pass2" name="pass2" type="password" required autocomplete="new-password"></div>
    <p class="tone-late small" data-error style="margin:0"></p>
    <button class="btn primary lg block">إنشاء الحساب والبدء</button>
    ${S.accounts.length ? '<a class="btn ghost block" href="#/login">لديّ حساب، تسجيل الدخول</a>' : ''}
    <a class="btn ghost block" href="#/welcome">رجوع</a>
  </form>${FOOT}</main>`;
}

function vLogin() {
  const names = S.accounts.map((a) => `<option value="${esc(a.name)}">`).join('');
  return `<main class="screen no-nav">${hero()}
  <form data-form="login" class="stack" style="padding-top:28px" novalidate>
    <h2 style="font-size:22px">أهلاً بكِ</h2>
    <div class="field"><label for="l-name">اسم المحفّظة</label><input id="l-name" name="name" list="acc-names" required autocomplete="username" value="${S.accounts.length === 1 ? esc(S.accounts[0].name) : ''}"><datalist id="acc-names">${names}</datalist></div>
    <div class="field"><label for="l-pass">كلمة المرور</label><input id="l-pass" name="pass" type="password" required autocomplete="current-password"></div>
    <label class="check"><input type="checkbox" name="remember" checked> تذكّريني على هذا الجهاز</label>
    <p class="tone-late small" data-error style="margin:0"></p>
    <button class="btn primary lg block">دخول</button>
    <a class="btn ghost block" href="#/welcome">رجوع</a>
  </form>${FOOT}</main>`;
}

function vPin() {
  const acc = S.accounts.find((a) => a.id === store.get('halaqa.session'));
  if (!acc) { setTimeout(() => go('#/login')); return ''; }
  return `<main class="screen no-nav">${hero(`أهلاً أ. ${acc.name}`)}
  <form data-form="pin" class="stack" style="padding-top:32px" novalidate>
    <div class="field"><label for="p-pin">${icon('lock', 16)} أدخلي رمز PIN</label><input id="p-pin" class="pin-input" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" autofocus></div>
    <p class="tone-late small" data-error style="margin:0"></p>
    <button class="btn primary lg block">فتح</button>
    <button type="button" class="btn ghost block" data-act="forget">الدخول باسم وكلمة مرور</button>
  </form></main>`;
}

async function enter(acc, remember) {
  S.account = acc;
  const d = await DB.get('data:' + acc.id);
  S.data = Object.assign(emptyData(), d || {});
  S.data.settings = Object.assign(emptyData().settings, S.data.settings || {});
  store.sset('halaqa.unlocked', acc.id);
  if (remember !== undefined) store.set('halaqa.session', remember ? acc.id : null);
  applyTheme();
  DB.persist();
  notifyDue();
  const h = location.hash;
  if (!h || /^#\/(login|setup|pin)?$/.test(h)) go('#/students'); else render();
}

// ===== الطالبات =====
function vStudents() {
  const list = activeStudents();
  const st = list.map((s) => ({ s, st: Logic.status(S.data, s) }));
  const todayCount = st.filter((x) => x.st.today).length;
  const late = st.filter((x) => x.st.tone === 'late').length;
  const f = S.ui.filter;
  const shown = st.filter((x) => f === 'all' || (f === 'today' && !x.st.today) || (f === 'test' && x.st.test) || (f === 'late' && x.st.tone === 'late'));
  const nextTest = S.data.reminders.filter((r) => !r.done && r.kind === 'test' && D.daysBetween(D.today(), r.date) <= 7).sort((a, b) => a.date.localeCompare(b.date))[0];
  const age = backupAge();
  const needBackup = S.data.students.length && (age === null || age >= (S.data.settings.backupEvery || 7));
  const chip = (k, label) => `<button class="chip" data-act="filter" data-v="${k}" aria-pressed="${f === k}">${label}</button>`;

  return `<main class="screen">
  <div class="top"><div class="grow"><div class="muted small">السلام عليكم، أ. ${esc(firstName(S.account.name))}</div><h1>${esc(S.data.halaqaName)}</h1></div>${statusPill()}</div>
  <div class="stack">
    ${needBackup ? `<div class="banner red"><div class="ico">${icon('cloud')}</div><div class="grow"><div class="label">${age === null ? 'لا توجد نسخة احتياطية بعد' : `آخر نسخة احتياطية قبل ${age} ${age <= 10 ? 'أيام' : 'يوماً'}`}</div><div class="small">احفظي نسخة على Google Drive حتى لا تضيع البيانات</div></div><a href="#/settings" class="btn ghost" style="color:var(--red)">حفظ</a></div>` : ''}
    ${nextTest ? (() => { const s = student(nextTest.studentId); return s ? `<div class="banner gold"><div class="ico">${icon('bell')}</div><div class="grow"><div class="label">${esc(D.relative(nextTest.date))} · ${esc(D.long(nextTest.date))}</div><div class="small">${esc(s.name)} · ${esc(nextTest.title)}</div></div><a href="#/reminders" class="btn ghost">عرض</a></div>` : ''; })() : ''}
    <div class="stats">
      <div class="stat"><b>${list.length}</b><span>طالبة</span></div>
      <div class="stat"><b>${todayCount}</b><span>سمّعن اليوم</span></div>
      <div class="stat ${late ? 'red' : ''}"><b>${late}</b><span>متأخرات أسبوعاً</span></div>
    </div>
    ${list.length ? `<div class="search">${icon('search', 18)}<label for="q" class="sr">بحث عن طالبة</label><input id="q" class="input" type="search" placeholder="ابحثي باسم الطالبة" value="${esc(S.ui.q)}" autocomplete="off"></div>
    <div class="chips">${chip('all', 'الكل')}${chip('today', 'لم تُسمّع اليوم')}${chip('test', 'عليها اختبار')}${chip('late', 'متأخرات')}</div>` : ''}
    <div class="stack" id="st-list" style="gap:8px">
      ${shown.map(({ s, st: x }) => {
        const n = Logic.juzCount(s);
        return `<div class="st-row" data-name="${esc(s.name)}"${S.ui.q && !s.name.includes(S.ui.q) ? ' hidden' : ''}>
          <a class="main" href="#/student/${s.id}"><div class="avatar">${esc(initial(s.name))}</div><div class="info">
            <div class="row-flex"><span class="name">${esc(s.name)}</span><span class="tiny muted num">${n}/30</span></div>
            <div class="bar"><span style="width:${Math.round((n / 30) * 100)}%"></span></div>
            <span class="tiny tone-${x.tone}" style="font-weight:500">${esc(x.text)}</span></div></a>
          <a href="#/entry/${s.id}" class="icon-btn soft" aria-label="تسميع لـ ${esc(s.name)}">${icon('plus', 20, 2.4)}</a>
        </div>`;
      }).join('')}
      ${!list.length ? `<div class="empty">${icon('users', 40, 1.6)}<h2 style="font-size:18px;margin-bottom:6px">لا توجد طالبات بعد</h2><p style="margin:0 0 14px">ابدئي بإضافة طالبات الحلقة.</p><div class="stack" style="max-width:280px;margin:0 auto"><a class="btn primary" href="#/students/new">${icon('userPlus')} إضافة أول طالبة</a><button class="btn" data-act="pickImport">${icon('upload', 18)} استيراد قائمة من Excel</button></div></div>` : ''}
      ${list.length && !shown.length ? '<div class="empty">لا توجد طالبات في هذا التصنيف</div>' : ''}
    </div>
  </div>
  ${list.length ? `<a href="#/students/new" class="fab">${icon('userPlus', 18)} طالبة جديدة</a>` : ''}
  ${nav('students')}</main>`;
}

function vStudentForm(id) {
  const s = id ? student(id) : null;
  if (id && !s) return notFound();
  const v = (k) => esc(s ? s[k] || '' : '');
  return `<main class="screen no-nav">
  <div class="top back"><a href="${s ? `#/student/${s.id}` : '#/students'}" class="icon-btn plain" aria-label="رجوع">${icon('back', 22, 2.2)}</a><h1 class="grow" style="font-size:19px">${s ? 'تعديل بيانات الطالبة' : 'طالبة جديدة'}</h1></div>
  ${!s ? `<button type="button" class="banner green" style="width:100%;border:0;text-align:right;margin:4px 0 14px" data-act="pickImport"><span class="ico" style="background:#fff;color:var(--primary)">${icon('upload')}</span><span class="grow"><span class="label" style="color:var(--primary);display:block">عندك القائمة في Excel؟</span><span class="small">استوردي كل الطالبات مرة واحدة</span></span></button>` : ''}
  <form data-form="student" data-id="${s ? s.id : ''}" class="stack" novalidate>
    <div class="field"><label for="s-name">اسم الطالبة</label><input id="s-name" name="name" required value="${v('name')}" autocomplete="off"></div>
    <div class="field"><label for="s-dir">طريقة الحفظ</label><select id="s-dir" name="direction">
      <option value="backward"${!s || s.direction !== 'forward' ? ' selected' : ''}>من الناس إلى البقرة (من جزء عمّ)</option>
      <option value="forward"${s && s.direction === 'forward' ? ' selected' : ''}>من البقرة إلى الناس</option></select></div>
    ${!s ? `<div class="field"><label for="s-juz">الأجزاء المحفوظة قبل التسجيل</label><input id="s-juz" name="juz" type="number" min="0" max="30" value="0" inputmode="numeric"><span class="hint">تُعلَّم تلقائياً على خريطة الأجزاء، ويمكن تعديلها لاحقاً</span></div>` : ''}
    <h2 class="section-title" style="margin-bottom:0">بيانات اختيارية</h2>
    <div class="field"><label for="s-nid">رقم الهوية</label><input id="s-nid" name="nationalId" inputmode="numeric" value="${v('nationalId')}" autocomplete="off"></div>
    <div class="field"><label for="s-phone">جوال الطالبة</label><input id="s-phone" name="phone" type="tel" class="ltr" style="text-align:right" value="${v('phone')}" autocomplete="off"></div>
    <div class="field"><label for="s-gphone">جوال ولي الأمر</label><input id="s-gphone" name="guardianPhone" type="tel" class="ltr" style="text-align:right" value="${v('guardianPhone')}" autocomplete="off"><span class="hint">يُستخدم لإرسال التقارير على واتساب</span></div>
    <div class="field"><label for="s-birth">تاريخ الميلاد</label><input id="s-birth" name="birthDate" type="date" value="${v('birthDate')}"></div>
    <p class="tone-late small" data-error style="margin:0"></p>
    ${s ? `<div class="btn-row mt"><button type="button" class="btn" data-act="archiveStudent" data-id="${s.id}">${s.archived ? 'إرجاع للحلقة' : 'نقل للأرشيف'}</button><button type="button" class="btn danger" data-act="deleteStudent" data-id="${s.id}">${icon('trash', 18)} حذف نهائي</button></div>` : ''}
    <div class="bottombar"><div class="inner"><button class="btn primary lg">${s ? 'حفظ التعديلات' : 'إضافة الطالبة'}</button></div></div>
  </form></main>`;
}

function vStudent(id) {
  const s = student(id);
  if (!s) return notFound();
  const n = Logic.juzCount(s);
  const cur = currentJuz(s);
  const test = Logic.nextTest(S.data, s.id);
  const all = Logic.studentEntries(S.data, s.id);
  const [ps, pa] = nextPosition(s);
  const last = lastPosition(s);
  const tab = S.ui.tab;
  const juz = s.juz || {};
  const info = (label, val, ltr) => `<div style="display:flex;flex-direction:column;min-width:0"><span class="tiny muted">${label}</span><span class="small${val ? '' : ' tone-muted'}${ltr && val ? ' ltr' : ''}" style="font-weight:${val ? 600 : 400};text-align:right">${esc(val || 'غير مُدخل')}</span></div>`;

  let body = '';
  if (tab === 'log') {
    const list = all.slice(0, S.ui.logLimit);
    body = list.length ? `<div class="card flush">${list.map(entryRow).join('')}</div>${all.length > list.length ? `<button class="btn block mt-s" data-act="more">عرض المزيد (${all.length - list.length})</button>` : ''}`
      : `<div class="empty">لم تُسجَّل أي جلسة بعد.<br>اضغطي «تسميع جديد» للبدء.</div>`;
  } else if (tab === 'tests') {
    const tests = all.filter((e) => e.type === 'test');
    const up = S.data.reminders.filter((r) => r.studentId === s.id && !r.done && r.kind === 'test');
    body = `${up.map((r) => `<div class="banner gold mt-s"><div class="ico">${icon('bell')}</div><div class="grow"><div class="label">${esc(D.relative(r.date))}</div><div class="small">${esc(r.title)} · ${esc(D.long(r.date))}</div></div></div>`).join('')}
      ${tests.length ? `<div class="card flush mt-s">${tests.map(entryRow).join('')}</div>` : '<div class="empty">لا توجد اختبارات مسجّلة.</div>'}
      <button class="btn block mt-s" data-act="addReminder" data-sid="${s.id}">${icon('bell', 18)} جدولة اختبار</button>`;
  } else {
    const notes = S.data.notes.filter((x) => x.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date));
    body = `<form data-form="note" data-sid="${s.id}" class="card stack" style="gap:8px">
        <label for="note-text" class="small" style="font-weight:600;color:var(--ink-2)">ملاحظة جديدة</label>
        <textarea id="note-text" name="text" class="input" rows="2" style="padding:10px 14px;min-height:70px" required placeholder="مثال: تحتاج تثبيت المتشابهات"></textarea>
        <button class="btn primary">حفظ الملاحظة</button></form>
      ${notes.map((x) => `<div class="note-card between mt-s" style="align-items:flex-start"><div><div class="label">${esc(D.long(x.date))}</div><div style="line-height:1.6;white-space:pre-line">${esc(x.text)}</div></div><button class="icon-btn plain" data-act="deleteNote" data-id="${x.id}" aria-label="حذف الملاحظة">${icon('trash', 18)}</button></div>`).join('')}`;
  }

  return `<main class="screen">
  <div class="top back"><a href="#/students" class="icon-btn plain" aria-label="رجوع">${icon('back', 22, 2.2)}</a><div class="grow"></div>
    <a class="btn soft" style="min-height:40px;padding:0 12px;font-size:14px" href="#/report/${s.id}/${D.thisMonth()}">${icon('chart', 16)} التقرير الشهري</a>
    <a class="btn ghost" style="font-size:14px" href="#/student/${s.id}/edit">تعديل</a></div>
  <div class="row-flex" style="gap:14px"><div class="avatar lg">${esc(initial(s.name))}</div><div class="stack" style="gap:4px;min-width:0"><h1 style="font-size:22px">${esc(s.name)}</h1>
    ${test ? `<span class="badge" style="align-self:flex-start">${esc(test.title)} · ${esc(D.long(test.date))}</span>` : `<span class="small muted">${s.direction === 'forward' ? 'تحفظ من البقرة إلى الناس' : 'تحفظ من الناس إلى البقرة'}</span>`}</div></div>

  <div class="card mt stack" style="gap:10px">
    <div class="between"><span class="small" style="font-weight:600;color:var(--ink-2)">خريطة الأجزاء</span><span class="small muted"><b class="num" style="font-size:22px;color:var(--primary)">${n}</b> من 30</span></div>
    <div class="juzmap">${Array.from({ length: 30 }, (_, i) => {
      const j = i + 1, done = !!juz[j];
      return `<button data-act="toggleJuz" data-j="${j}" class="${done ? 'done' : j === cur ? 'current' : ''}" aria-pressed="${done}" aria-label="الجزء ${j}${done ? ' مكتمل' : ''}" title="${done ? (juz[j] === BEFORE ? 'محفوظ قبل التسجيل' : 'أُتمّ ' + D.short(juz[j])) : 'اضغطي لتعليمه كمكتمل'}">${j}</button>`;
    }).join('')}</div>
    <span class="tiny muted">${last ? `آخر موضع: ${esc(Quran.label(last.toSurah, last.toAyah))} · ` : ''}التالي: ${esc(Quran.label(ps, pa))} (الجزء ${cur})</span>
  </div>

  <div class="card tight mt-s" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">
    ${info('رقم الهوية', s.nationalId)}${info(s.guardianPhone ? 'جوال ولي الأمر' : 'الجوال', s.guardianPhone || s.phone, true)}${info('تاريخ الميلاد', s.birthDate ? D.slash(s.birthDate) : '')}
  </div>

  <div class="seg mt" role="tablist">
    <button role="tab" data-act="tab" data-v="log" aria-selected="${tab === 'log'}">السجل</button>
    <button role="tab" data-act="tab" data-v="tests" aria-selected="${tab === 'tests'}">الاختبارات</button>
    <button role="tab" data-act="tab" data-v="notes" aria-selected="${tab === 'notes'}">الملاحظات</button>
  </div>
  <div class="mt-s">${body}</div>

  <div class="bottombar"><div class="inner">
    <a href="#/entry/${s.id}" class="btn primary lg">${icon('plus', 18, 2.4)} تسميع جديد</a>
    <button class="icon-btn" style="width:54px;height:54px;border-radius:16px" data-act="tab" data-v="notes" aria-label="إضافة ملاحظة">${icon('edit', 22)}</button>
    <button class="icon-btn" style="width:54px;height:54px;border-radius:16px" data-act="waLast" data-sid="${s.id}" aria-label="إرسال آخر تسميع لولي الأمر على واتساب">${icon('chat', 22)}</button>
  </div></div></main>`;
}

function entryRow(e) {
  const d = D.parse(e.date);
  const sub = e.type === 'test' ? (e.note || '') : [errWord(e.errors || 0), hintWord(e.hints || 0), e.note].filter(Boolean).join(' · ');
  return `<a class="entry" href="#/entry/${e.studentId}/${e.id}" style="color:inherit">
    <div class="date"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div>
    <div class="body"><div class="row-flex"><span class="tag ${e.type}">${TYPE_SHORT[e.type]}</span><span class="small" style="font-weight:500">${esc(Logic.entryRange(e))}</span></div>
    <span class="tiny muted">${esc(sub)}</span></div>
    <span class="grade">${esc(Logic.entryGrade(e))}</span></a>`;
}

// ===== التسميع =====
function newDraft(s, e) {
  if (e) {
    const base = freshDraft(s);
    const d = { ...base, ...e, key: e.id, sid: s.id, eid: e.id, auto: false, pagesManual: true };
    if (e.type === 'test') { d.testFrom = e.testFromJuz; d.testTo = e.testFromJuz + e.testJuz - 1; d.score = e.score; d.grade = base.grade; }
    return d;
  }
  return freshDraft(s);
}

function freshDraft(s) {
  const [fs, fa] = nextPosition(s);
  const ta = Math.min(fa + 9, Quran.surah(fs).ayahs);
  const n = Logic.juzCount(s);
  const back = s.direction !== 'forward';
  const tFrom = n ? (back ? 31 - n : 1) : (back ? 30 : 1);
  const tTo = n ? (back ? 30 : n) : (back ? 30 : 1);
  return {
    key: 'new:' + s.id, sid: s.id, eid: null, date: D.today(), type: 'new', auto: true,
    fromSurah: fs, fromAyah: fa, toSurah: fs, toAyah: ta, pages: Quran.pages(fs, fa, fs, ta), pagesManual: false,
    grade: 'ممتاز', errors: 0, hints: 0, note: '', testFrom: tFrom, testTo: tTo, score: '',
  };
}

function vEntry(sid, eid) {
  const s = student(sid);
  if (!s) return notFound();
  const e = eid ? S.data.entries.find((x) => x.id === eid) : null;
  if (eid && !e) return notFound();
  const key = eid || 'new:' + sid;
  if (!S.draft || S.draft.key !== key) S.draft = newDraft(s, e);
  const d = S.draft;
  const t = d.type;
  const segBtn = (k, label) => `<button type="button" data-act="draftType" data-v="${k}" aria-pressed="${t === k}">${label}</button>`;
  const gradeBtn = (g) => `<button type="button" class="${g === 'إعادة' ? 'redo' : ''}" data-act="draftGrade" data-v="${g}" aria-pressed="${d.grade === g}">${g}</button>`;
  const stepper = (k, label) => `<div class="card tight stack" style="gap:6px"><span class="tiny" style="font-weight:600;color:var(--ink-2)">${label}</span><div class="stepper">
    <button type="button" data-act="step" data-k="${k}" data-d="1" aria-label="زيادة ${label}">+</button><output id="out-${k}" class="num">${d[k] || 0}</output><button type="button" data-act="step" data-k="${k}" data-d="-1" aria-label="إنقاص ${label}">−</button></div></div>`;

  let main;
  if (t !== 'test') {
    main = `<div class="card stack">
      ${t === 'new' && d.auto && !eid ? `<div class="row-flex tiny" style="color:var(--primary);font-weight:600">${icon('check', 14, 2.4)} يبدأ تلقائياً من آخر موضع</div>` : ''}
      ${t === 'review' ? `<div class="field small-label"><label for="e-rj">مراجعة جزء كامل</label><select id="e-rj" class="small" data-bind="reviewJuz"><option value="">اختاري جزءاً (اختياري)</option>${juzOptions(d.reviewJuz)}</select></div>` : ''}
      <div class="two"><div class="field small-label"><label for="e-fs">من سورة</label><select id="e-fs" class="small" data-bind="fromSurah">${surahOptions(d.fromSurah)}</select></div>
        <div class="field small-label"><label for="e-fa">آية</label><input id="e-fa" class="small num" type="number" inputmode="numeric" min="1" max="${Quran.surah(d.fromSurah).ayahs}" value="${d.fromAyah}" data-bind="fromAyah"></div></div>
      <div class="two"><div class="field small-label"><label for="e-ts">إلى سورة</label><select id="e-ts" class="small" data-bind="toSurah">${surahOptions(d.toSurah)}</select></div>
        <div class="field small-label"><label for="e-ta">آية</label><input id="e-ta" class="small num" type="number" inputmode="numeric" min="1" max="${Quran.surah(d.toSurah).ayahs}" value="${d.toAyah}" data-bind="toAyah"></div></div>
      <div class="two" style="grid-template-columns:1fr 110px"><span class="tiny muted" id="pages-hint">${pagesHint(d)}</span>
        <div class="field small-label"><label for="e-pages">الأوجه</label><input id="e-pages" class="small num" type="number" inputmode="decimal" min="0" step="0.5" value="${d.pages}" data-bind="pages"></div></div>
    </div>
    <div class="field"><span class="label">التقدير</span><div class="grades">${GRADES.map(gradeBtn).join('')}</div></div>`;
  } else {
    main = `<div class="card stack">
      <div class="grid2"><div class="field small-label"><label for="e-tf">من</label><select id="e-tf" class="small" data-bind="testFrom">${juzOptions(d.testFrom)}</select></div>
        <div class="field small-label"><label for="e-tt">إلى</label><select id="e-tt" class="small" data-bind="testTo">${juzOptions(d.testTo)}</select></div></div>
      <span class="tiny muted">اختبار ${esc(juzWord(Math.abs(d.testTo - d.testFrom) + 1))}</span>
      <div class="two" style="grid-template-columns:1fr 1fr"><div class="field small-label"><label for="e-score">الدرجة من 100</label><input id="e-score" class="small num" type="number" inputmode="numeric" min="0" max="100" value="${esc(d.score)}" data-bind="score"></div>
        <div class="field small-label"><span class="label" style="font-size:12px;font-weight:500;color:var(--ink-2)">التقدير</span><div id="score-grade" style="min-height:46px;display:flex;align-items:center;font-weight:700;color:var(--primary)">${d.score !== '' ? gradeFromScore(Number(d.score)) : '—'}</div></div></div>
    </div>`;
  }

  return `<main class="screen no-nav">
  <div class="top back"><a href="#/student/${s.id}" class="icon-btn plain" aria-label="إغلاق">${icon('close', 22, 2.2)}</a>
    <div class="grow"><h1 style="font-size:19px">${eid ? 'تعديل تسميع' : 'تسميع'} ${esc(s.name)}</h1></div>
    <label for="e-date" class="sr">التاريخ</label><input id="e-date" class="input" type="date" style="width:auto;min-height:40px;font-size:14px;padding:0 10px" value="${d.date}" max="${D.today()}" data-bind="date"></div>
  <div class="stack" style="gap:14px;margin-top:8px">
    <div class="seg strong">${segBtn('new', 'حفظ جديد')}${segBtn('review', 'مراجعة')}${segBtn('test', 'اختبار')}</div>
    ${main}
    <div class="grid2">${stepper('errors', 'الأخطاء')}${stepper('hints', 'التنبيهات')}</div>
    <div class="field"><label for="e-note">ملاحظة <span style="font-weight:400">(اختياري)</span></label><textarea id="e-note" rows="2" data-bind="note" placeholder="مثال: انتبهي للمتشابهات">${esc(d.note)}</textarea></div>
    ${eid ? `<button type="button" class="btn danger block" data-act="deleteEntry" data-id="${eid}">${icon('trash', 18)} حذف هذا التسميع</button>` : ''}
  </div>
  <div class="bottombar"><div class="inner">
    <button class="btn primary lg" data-act="saveEntry" data-next="0">حفظ</button>
    ${!eid ? '<button class="btn lg" data-act="saveEntry" data-next="1">حفظ والتالية ←</button>' : ''}
  </div></div></main>`;
}

function pagesHint(d) {
  const p1 = Quran.pageOf(d.fromSurah, d.fromAyah), p2 = Quran.pageOf(d.toSurah, d.toAyah);
  return `≈ ${pageWord(Quran.pages(d.fromSurah, d.fromAyah, d.toSurah, d.toAyah))} · ${p1 === p2 ? `الصفحة ${p1}` : `الصفحات ${Math.min(p1, p2)}–${Math.max(p1, p2)}`} · الجزء ${Quran.juzOf(d.fromSurah, d.fromAyah)}`;
}

function recalcPages() {
  const d = S.draft;
  const auto = Quran.pages(d.fromSurah, d.fromAyah, d.toSurah, d.toAyah);
  if (!d.pagesManual) { d.pages = auto; const p = document.getElementById('e-pages'); if (p) p.value = auto; }
  const h = document.getElementById('pages-hint');
  if (h) h.textContent = pagesHint(d);
}

function onBind(ev) {
  const el = ev.target.closest('[data-bind]');
  if (!el || !S.draft) return;
  const d = S.draft, k = el.dataset.bind;
  const isSelect = el.tagName === 'SELECT';
  if (isSelect && ev.type === 'input') return; // نتعامل مع القوائم عند change فقط
  let v = el.value;
  if (['fromSurah', 'toSurah', 'fromAyah', 'toAyah', 'testFrom', 'testTo', 'reviewJuz'].includes(k)) v = v === '' ? '' : Number(v);
  if (k === 'pages') { d.pages = Number(v) || 0; d.pagesManual = true; return; }
  if (k === 'score') { d.score = v === '' ? '' : Math.max(0, Math.min(100, Number(v))); const g = document.getElementById('score-grade'); if (g) g.textContent = d.score === '' ? '—' : gradeFromScore(d.score); return; }
  if (k === 'reviewJuz') {
    d.reviewJuz = v;
    if (v) { [d.fromSurah, d.fromAyah] = Quran.juzStart(v); [d.toSurah, d.toAyah] = Quran.juzEnd(v); d.pagesManual = false; d.pages = Quran.pages(d.fromSurah, d.fromAyah, d.toSurah, d.toAyah); }
    render(); return;
  }
  if (k === 'fromAyah' || k === 'toAyah') {
    const sur = Quran.surah(k === 'fromAyah' ? d.fromSurah : d.toSurah);
    if (v === '' || isNaN(v)) return;
    d[k] = Math.max(1, Math.min(sur.ayahs, v));
    d.auto = false;
    recalcPages(); return;
  }
  d[k] = v;
  if (k === 'fromSurah') { d.fromAyah = Math.min(d.fromAyah, Quran.surah(v).ayahs); if (Quran.index(d.toSurah, d.toAyah) < Quran.index(d.fromSurah, d.fromAyah)) { d.toSurah = v; d.toAyah = Math.min(d.fromAyah + 9, Quran.surah(v).ayahs); } }
  if (k === 'toSurah') d.toAyah = Math.min(d.toAyah, Quran.surah(v).ayahs);
  if (k === 'fromSurah' || k === 'toSurah') { d.auto = false; d.pagesManual = false; d.pages = Quran.pages(d.fromSurah, d.fromAyah, d.toSurah, d.toAyah); render(); return; }
  if (k === 'testFrom' || k === 'testTo') render();
}

async function saveEntry(next) {
  const d = S.draft;
  const s = student(d.sid);
  if (!s) return;
  if (d.type === 'test' && (d.score === '' || isNaN(d.score))) { toast('أدخلي درجة الاختبار'); document.getElementById('e-score')?.focus(); return; }
  const now = new Date().toISOString();
  const e = {
    id: d.eid || uid(), studentId: s.id, date: d.date || D.today(), type: d.type,
    errors: d.errors || 0, hints: d.hints || 0, note: (d.note || '').trim(),
    created: d.created || now, updated: now,
  };
  if (d.type === 'test') {
    const a = Math.min(d.testFrom, d.testTo), b = Math.max(d.testFrom, d.testTo);
    Object.assign(e, { testFromJuz: a, testJuz: b - a + 1, score: Number(d.score), grade: gradeFromScore(Number(d.score)) });
  } else {
    let f = [d.fromSurah, d.fromAyah], t = [d.toSurah, d.toAyah];
    if (Quran.index(...t) < Quran.index(...f)) [f, t] = [t, f];
    Object.assign(e, { fromSurah: f[0], fromAyah: f[1], toSurah: t[0], toAyah: t[1], pages: Number(d.pages) || 0, grade: d.grade });
  }
  const i = S.data.entries.findIndex((x) => x.id === e.id);
  if (i >= 0) S.data.entries[i] = e; else S.data.entries.push(e);

  // إتمام جزء؟
  for (const j of Logic.completedJuz(s, e)) {
    if (await confirmBox(`أتمّت الجزء ${j}؟`, `وصلت ${s.name} إلى ${s.direction === 'forward' ? 'نهاية' : 'بداية'} الجزء ${j}. هل نعلّمه كمكتمل على خريطة الأجزاء؟`, 'نعم، أتمّته')) {
      s.juz = s.juz || {};
      s.juz[j] = e.date;
    }
  }
  // اختبار: إغلاق تذكير الاختبار المفتوح
  if (e.type === 'test' && !d.eid) {
    const r = Logic.nextTest(S.data, s.id);
    if (r) { r.done = true; r.doneAt = now; }
  }
  await save();
  S.draft = null;
  toast(d.eid ? 'تم حفظ التعديل' : `تم تسجيل تسميع ${s.name}`);
  if (next) {
    const list = activeStudents();
    const idx = list.findIndex((x) => x.id === s.id);
    const rest = [...list.slice(idx + 1), ...list.slice(0, idx)];
    const nx = rest.find((x) => !Logic.status(S.data, x).today);
    if (nx) go(`#/entry/${nx.id}`); else { toast('ما شاء الله، سمّعت كل الطالبات اليوم'); go('#/students'); }
  } else go(`#/student/${s.id}`);
}

// ===== التذكيرات =====
function vReminders() {
  const today = D.today();
  const open = S.data.reminders.filter((r) => !r.done && student(r.studentId)).sort((a, b) => a.date.localeCompare(b.date));
  const done = S.data.reminders.filter((r) => r.done && student(r.studentId)).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 50);
  const sug = Logic.suggestions(S.data);
  const late = activeStudents().filter((s) => Logic.status(S.data, s).tone === 'late');
  const card = (r) => {
    const s = student(r.studentId);
    const diff = D.daysBetween(today, r.date);
    const tone = r.done ? '' : diff < 0 ? 'red' : r.kind === 'test' ? 'gold' : 'blue';
    const d = D.parse(r.date);
    return `<div class="card tight row-flex" style="gap:12px">
      <div class="date-box ${tone}"><span>${diff === 0 ? 'اليوم' : D.dow(r.date)}</span><b>${d.getDate()}</b></div>
      <div class="grow" style="flex:1;min-width:0;display:flex;flex-direction:column"><a href="#/student/${s.id}" style="color:var(--ink);font-weight:600">${esc(s.name)}</a><span class="small muted">${esc(r.title)}</span>
        <span class="tiny" style="font-weight:700;color:${tone === 'red' ? 'var(--red)' : tone === 'gold' ? 'var(--gold)' : 'var(--ink-2)'}">${r.done ? 'تم' : diff < 0 ? `متأخر ${-diff} ${-diff <= 10 ? 'أيام' : 'يوماً'}` : esc(D.relative(r.date))}</span></div>
      ${r.done ? `<button class="icon-btn" data-act="undoReminder" data-id="${r.id}" aria-label="إرجاع التذكير">${icon('undo', 18)}</button>`
        : `<button class="icon-btn" data-act="doneReminder" data-id="${r.id}" aria-label="تم">${icon('check', 20, 2.2)}</button>`}
      <button class="icon-btn plain" data-act="deleteReminder" data-id="${r.id}" aria-label="حذف التذكير">${icon('trash', 18)}</button></div>`;
  };
  const groups = [
    ['متأخرة واليوم', open.filter((r) => r.date <= today)],
    ['هذا الأسبوع', open.filter((r) => r.date > today && D.daysBetween(today, r.date) <= 7)],
    ['لاحقاً', open.filter((r) => D.daysBetween(today, r.date) > 7)],
  ];
  const up = S.ui.remTab === 'up';
  return `<main class="screen">
  <div class="top"><h1>التذكيرات</h1></div>
  <div class="seg" role="tablist"><button role="tab" data-act="remTab" data-v="up" aria-selected="${up}">القادمة · ${open.length}</button><button role="tab" data-act="remTab" data-v="done" aria-selected="${!up}">المنجزة</button></div>
  ${up ? `
    ${groups.map(([t, l]) => (l.length ? `<h2 class="section-title">${t}</h2><div class="stack" style="gap:8px">${l.map(card).join('')}</div>` : '')).join('')}
    ${sug.length ? `<h2 class="section-title">اقتراح من التطبيق</h2>${sug.map((x) => `<div class="banner green mt-s" style="flex-direction:column;align-items:stretch"><span style="line-height:1.6"><b>${esc(x.student.name)}</b> أتمّت ${esc(juzWord(x.juz))}. هل تريدين جدولة اختبار ${esc(juzWord(x.juz))}؟</span>
      <div class="btn-row"><button class="btn primary" data-act="addReminder" data-sid="${x.student.id}" data-juz="${x.juz}">جدولة اختبار</button><button class="btn" style="background:rgba(255,255,255,.7);border-color:transparent" data-act="dismissSug" data-key="${x.key}">لاحقاً</button></div></div>`).join('')}` : ''}
    ${late.length ? `<h2 class="section-title">تحتاج متابعة</h2><div class="card flush">${late.map((s) => `<a class="entry" href="#/student/${s.id}" style="color:inherit"><div class="avatar" style="width:36px;height:36px;font-size:14px">${esc(initial(s.name))}</div><div class="body"><span style="font-weight:600">${esc(s.name)}</span><span class="tiny tone-late">${esc(Logic.status(S.data, s).text)}</span></div></a>`).join('')}</div>` : ''}
    ${!open.length && !sug.length && !late.length ? `<div class="empty">${icon('bell', 40, 1.6)}<p>لا توجد تذكيرات قادمة.</p></div>` : ''}
  ` : `<div class="stack mt" style="gap:8px">${done.map(card).join('') || '<div class="empty">لا توجد تذكيرات منجزة بعد.</div>'}</div>`}
  ${S.data.students.length ? `<button class="fab" data-act="addReminder">${icon('plus', 18, 2.4)} تذكير جديد</button>` : ''}
  ${nav('reminders')}</main>`;
}

function reminderDialog(sid, juz) {
  const list = activeStudents();
  if (!list.length) return;
  const s = sid ? student(sid) : list[0];
  const j = juz || Math.max(5, Math.ceil((Logic.juzCount(s) || 1) / 5) * 5);
  const date = D.iso(new Date(Date.now() + 7 * 86400000));
  $dlg.innerHTML = `<form data-form="reminder" class="stack">
    <h2>تذكير جديد</h2>
    <div class="field"><label for="r-st">الطالبة</label><select id="r-st" name="studentId">${list.map((x) => `<option value="${x.id}"${x.id === s.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="r-kind">النوع</label><select id="r-kind" name="kind" data-act-change="remKind"><option value="test">اختبار أجزاء</option><option value="other">تذكير آخر</option></select></div>
    <div class="field" data-for="test"><label for="r-juz">عدد الأجزاء في الاختبار</label><input id="r-juz" name="juz" type="number" min="1" max="30" value="${j}" inputmode="numeric"></div>
    <div class="field" data-for="other" hidden><label for="r-title">نص التذكير</label><input id="r-title" name="title" placeholder="مثال: مراجعة جزء عمّ كاملاً"></div>
    <div class="field"><label for="r-date">التاريخ</label><input id="r-date" name="date" type="date" value="${date}" required></div>
    <div class="btn-row"><button class="btn primary">حفظ</button><button type="button" class="btn" data-act="closeDialog">إلغاء</button></div>
  </form>`;
  $dlg.onclose = null;
  $dlg.showModal();
}

// ===== التقارير =====
function monthSwitch(ym, act, extra = '') {
  const isNow = ym >= D.thisMonth();
  return `<div class="card tight between" style="padding:6px">
    <button class="icon-btn soft" style="background:var(--surface-2);color:var(--ink)" data-act="${act}" data-d="-1" ${extra} aria-label="الشهر السابق">${icon('back', 20, 2.2)}</button>
    <div style="text-align:center"><div class="num" style="font-size:17px;font-weight:600">${D.monthName(ym)}</div><div class="tiny muted">من 1 إلى ${D.monthDays(ym)} ${MONTHS[Number(ym.slice(5)) - 1]}</div></div>
    <button class="icon-btn soft" style="background:var(--surface-2);color:var(--ink)" data-act="${act}" data-d="1" ${extra} aria-label="الشهر التالي" ${isNow ? 'disabled' : ''}>${icon('fwd', 20, 2.2)}</button></div>`;
}

function vReports() {
  const ym = S.ui.repMonth;
  const list = activeStudents();
  const sums = list.map((s) => ({ s, m: Logic.monthSummary(S.data, s, ym) }));
  const tot = sums.reduce((t, { m }) => ({ news: t.news + m.newPages, tests: t.tests + m.tests.length, scores: t.scores.concat(m.testScores), sessions: t.sessions + m.list.length }), { news: 0, tests: 0, scores: [], sessions: 0 });
  const avg = tot.scores.length ? Math.round(tot.scores.reduce((a, b) => a + b, 0) / tot.scores.length) : '—';
  const one = S.ui.repScope === 'one';
  if (one && !student(S.ui.repStudent) && list[0]) S.ui.repStudent = list[0].id;
  const target = one ? S.ui.repStudent : 'all';
  return `<main class="screen">
  <div class="top"><h1>التقارير</h1></div>
  <div class="stack">
    ${monthSwitch(ym, 'repMonth')}
    <div class="card primary stack" style="gap:10px"><span class="small muted">${D.monthName(ym)} · الحلقة كاملة</span>
      <div class="stats" style="gap:8px"><div class="stat-inv"><b>${fmtNum(tot.news)}</b><span>وجهاً جديداً</span></div><div class="stat-inv"><b>${tot.sessions}</b><span>جلسة تسميع</span></div><div class="stat-inv"><b>${tot.tests}</b><span>اختبار · متوسط ${avg}</span></div></div></div>
    <div class="card stack">
      <span class="small" style="font-weight:600;color:var(--ink-2)">التقرير يشمل</span>
      <div class="seg"><button data-act="repScope" data-v="all" aria-pressed="${!one}">كل الحلقة (${list.length})</button><button data-act="repScope" data-v="one" aria-pressed="${one}">طالبة واحدة</button></div>
      ${one ? `<div class="field"><label for="rep-st" class="sr">الطالبة</label><select id="rep-st" data-act-change="repStudent">${list.map((s) => `<option value="${s.id}"${s.id === S.ui.repStudent ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>` : ''}
      <label class="check"><input type="checkbox" data-act-change="incNotes" ${S.ui.incNotes ? 'checked' : ''}> ملاحظات المحفّظة</label>
      <label class="check"><input type="checkbox" data-act-change="incPersonal" ${S.ui.incPersonal ? 'checked' : ''}> البيانات الشخصية (هوية، جوال، ميلاد)</label>
    </div>
    <div class="btn-row">
      <button class="btn dark lg" data-act="exportExcel" data-target="${target}" ${list.length ? '' : 'disabled'}>${icon('download', 18)} Excel</button>
      <a class="btn lg" href="#/print/${target}/${ym}">${icon('print', 18)} PDF</a>
      ${one ? `<button class="btn lg" data-act="waReport" data-sid="${target}">${icon('chat', 18)} واتساب</button>` : ''}
    </div>
    <h2 class="section-title" style="margin-bottom:0">تقرير كل طالبة</h2>
    <div class="card flush">${sums.map(({ s, m }) => `<a class="entry" href="#/report/${s.id}/${ym}" style="color:inherit"><div class="avatar" style="width:38px;height:38px;font-size:15px">${esc(initial(s.name))}</div>
      <div class="body"><span style="font-weight:600">${esc(s.name)}</span><span class="tiny muted">${esc(pageWord(m.newPages))} جديد · ${esc(dayWord(m.sessions))} ·${m.tests.length ? `اختبار ${m.testScores.join('، ')}` : 'بدون اختبار'}</span></div>${icon('fwd', 18)}</a>`).join('') || '<div class="empty">أضيفي طالبات أولاً</div>'}</div>
  </div>
  ${nav('reports')}</main>`;
}

function distBar(m) {
  const g = m.grades, total = Object.values(g).reduce((a, b) => a + b, 0) + m.tests.length;
  if (!total) return '';
  const parts = [['ممتاز', g['ممتاز'], 'var(--primary)'], ['جيد جداً', g['جيد جداً'], '#7FB3A4'], ['جيد', g['جيد'], '#C99A3E'], ['إعادة', g['إعادة'], 'var(--red)'], ['اختبار', m.tests.length, 'var(--gold)']].filter((x) => x[1]);
  return `<div class="card tight stack mt-s" style="gap:8px"><span class="small" style="font-weight:600;color:var(--ink-2)">توزيع التقديرات</span>
    <div class="dist">${parts.map(([, n, c]) => `<span style="width:${(n / total) * 100}%;background:${c}"></span>`).join('')}</div>
    <div class="legend">${parts.map(([l, n, c]) => `<span><i style="background:${c}"></i>${l} ${n}</span>`).join('')}</div></div>`;
}

function vStudentReport(sid, ym) {
  const s = student(sid);
  if (!s) return notFound();
  const m = Logic.monthSummary(S.data, s, ym);
  const stat = (v, l, cls = '') => `<div class="stat ${cls}"><b>${esc(v)}</b><span>${esc(l)}</span></div>`;
  return `<main class="screen no-nav">
  <div class="top back"><a href="#/student/${s.id}" class="icon-btn plain" aria-label="رجوع">${icon('back', 22, 2.2)}</a><h1 class="grow" style="font-size:19px">تقرير ${esc(s.name)}</h1></div>
  <div class="stack">
    ${monthSwitch(ym, 'stMonth', `data-sid="${s.id}" data-ym="${ym}"`)}
    <div class="card primary stack" style="gap:10px">
      <div class="between"><div><div class="tiny muted">أول الشهر</div><div class="num" style="font-size:18px;font-weight:600">${esc(juzWord(m.juzStart))}</div></div>
        <svg aria-hidden="true" width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M26 10H3"/><path d="m9 4-6 6 6 6"/></svg>
        <div style="text-align:left"><div class="tiny muted">آخر الشهر</div><div class="num" style="font-size:18px;font-weight:600">${esc(juzWord(m.juzEnd))}</div></div></div>
      <span class="small" style="border-top:1px solid rgba(255,255,255,.2);padding-top:8px;color:rgba(255,255,255,.95)">حفظ جديد: <b>${esc(pageWord(m.newPages))}</b>${m.firstNew ? ` · من ${esc(Quran.label(m.firstNew.fromSurah, m.firstNew.fromAyah))} إلى ${esc(Quran.label(m.lastNew.toSurah, m.lastNew.toAyah))}` : ''}</span>
    </div>
    <div class="stats">
      ${stat(m.sessions, 'أيام تسميع')}${stat(m.reviews.length, `مراجعات · ${fmtNum(m.reviewPages)} وجه`)}${stat(m.tests.length ? m.testScores.join('، ') : '—', m.tests.length > 1 ? 'درجات الاختبارات' : 'درجة الاختبار', 'gold')}
      ${stat(m.errors, 'أخطاء', 'ink')}${stat(m.hints, 'تنبيهات', 'ink')}${stat(m.topGrade, 'التقدير الغالب')}
    </div>
  </div>
  ${distBar(m)}
  <div class="between" style="margin:16px 0 6px"><h2 style="font-size:15px">بالتواريخ</h2><span class="tiny muted">${sessWord(m.list.length)}</span></div>
  ${m.list.length ? `<div class="card flush">${[...m.list].reverse().map((e) => {
    const sub = e.type === 'test' ? '' : [errWord(e.errors || 0), hintWord(e.hints || 0)].filter(Boolean).join(' · ');
    return `<a class="entry" href="#/entry/${s.id}/${e.id}" style="color:inherit"><div class="date"><b class="num" style="font-size:15px">${D.parse(e.date).getDate()}/${Number(ym.slice(5))}</b><span>${D.dow(e.date)}</span></div>
      <span class="tag ${e.type}">${TYPE_SHORT[e.type]}</span><div class="body"><span class="small" style="font-weight:500">${esc(Logic.entryRange(e))}</span>${e.note ? `<span class="tiny muted">${esc(e.note)}</span>` : ''}</div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0"><span class="grade">${esc(Logic.entryGrade(e))}</span><span class="tiny muted">${esc(sub)}</span></div></a>`;
  }).join('')}</div>` : '<div class="empty card">لا توجد جلسات مسجّلة في هذا الشهر.</div>'}
  ${m.notes.length ? `<h2 class="section-title">ملاحظات الشهر</h2><div class="stack" style="gap:8px">${m.notes.map((n) => `<div class="note-card"><div class="label">${esc(D.long(n.date))}</div><div style="line-height:1.6">${esc(n.text)}</div></div>`).join('')}</div>` : ''}
  <div class="bottombar"><div class="inner">
    <a href="#/print/${s.id}/${ym}" class="btn primary lg">${icon('print', 18)} PDF</a>
    <button class="btn lg" data-act="exportExcel" data-target="${s.id}" data-ym="${ym}">Excel</button>
    <button class="btn lg" data-act="waReport" data-sid="${s.id}" data-ym="${ym}">واتساب</button>
  </div></div></main>`;
}

function sheetHTML(s, ym, opts) {
  const m = Logic.monthSummary(S.data, s, ym);
  const box = (v, l, color) => `<div class="sbox"><b${color ? ` style="color:${color}"` : ''}>${esc(v)}</b><span>${esc(l)}</span></div>`;
  return `<section class="sheet" dir="rtl">
    <header><div><div class="brand">الإحسان</div><div class="muted">${esc(S.data.halaqaName)} · المحفّظة ${esc(S.account.name)}</div></div>
      <div style="text-align:left"><div style="font-family:var(--display);font-size:17px;font-weight:600">التقرير الشهري</div><div class="muted">${D.monthName(ym)} · من 1 إلى ${D.monthDays(ym)} ${MONTHS[Number(ym.slice(5)) - 1]}</div></div></header>
    <div class="between" style="align-items:baseline;flex-wrap:wrap"><h1>${esc(s.name)}</h1>
      <span class="muted">الأجزاء المكتملة: من <b style="color:#17201D">${m.juzStart}</b> إلى <b style="color:#17201D">${m.juzEnd}</b>${m.firstNew ? ` · الحفظ: من ${esc(Quran.label(m.firstNew.fromSurah, m.firstNew.fromAyah))} إلى ${esc(Quran.label(m.lastNew.toSurah, m.lastNew.toAyah))}` : ''}</span></div>
    <div class="sgrid">
      ${box(fmtNum(m.newPages), 'وجهاً حفظ جديد')}${box(m.sessions, 'أيام تسميع')}${box(m.reviews.length, `مراجعات (${fmtNum(m.reviewPages)} وجهاً)`)}${box(m.tests.length, 'اختبارات', '#85520B')}
      ${box(m.tests.length ? m.testScores.join('، ') : '—', 'درجات الاختبار', '#85520B')}${box(m.errors, 'أخطاء', '#17201D')}${box(m.hints, 'تنبيهات', '#17201D')}${box(m.topGrade, 'التقدير الغالب')}
    </div>
    ${opts.personal ? `<div class="muted" style="display:flex;gap:18px;flex-wrap:wrap"><span>رقم الهوية: ${esc(s.nationalId || '—')}</span><span>جوال ولي الأمر: <span class="ltr">${esc(s.guardianPhone || s.phone || '—')}</span></span><span>تاريخ الميلاد: ${esc(s.birthDate ? D.slash(s.birthDate) : '—')}</span></div>` : ''}
    <div><h2 style="font-size:15px;margin-bottom:6px">سجل الشهر بالتواريخ</h2>
    <table><thead><tr><th>التاريخ</th><th>اليوم</th><th>النوع</th><th>المقطع</th><th class="n">الأوجه</th><th>التقدير</th><th class="n">أخطاء</th><th class="n">تنبيهات</th></tr></thead><tbody>
      ${m.list.map((e) => `<tr><td class="num">${D.slash(e.date)}</td><td>${D.dow(e.date)}</td><td style="font-weight:600;color:${e.type === 'new' ? 'var(--primary)' : e.type === 'review' ? '#24477F' : '#85520B'}">${TYPE_SHORT[e.type]}</td><td>${esc(Logic.entryRange(e))}</td><td class="n">${e.type === 'test' ? '—' : fmtNum(e.pages || 0)}</td><td style="font-weight:600">${esc(Logic.entryGrade(e))}</td><td class="n">${e.errors || 0}</td><td class="n">${e.hints || 0}</td></tr>`).join('')
        || '<tr><td colspan="8" style="text-align:center;color:#45514C">لا توجد جلسات مسجّلة في هذا الشهر</td></tr>'}
      <tr class="total"><td colspan="4">المجموع: ${esc(dayWord(m.sessions))} تسميع</td><td class="n">${fmtNum(m.newPages + m.reviewPages)}</td><td>${esc(m.topGrade)}</td><td class="n">${m.errors}</td><td class="n">${m.hints}</td></tr>
    </tbody></table></div>
    ${opts.notes && m.notes.length ? `<div class="notes"><h2>ملاحظات المحفّظة</h2>${m.notes.map((n) => `<p>• ${esc(D.short(n.date))}: ${esc(n.text)}</p>`).join('')}</div>` : ''}
    <div class="sign"><div>توقيع المحفّظة</div><div>توقيع ولي الأمر</div></div>
    <footer><span>صدر من تطبيق الإحسان</span><span>${D.slash(D.today())}</span></footer>
  </section>`;
}

function vPrint(target, ym) {
  const list = target === 'all' ? activeStudents() : [student(target)].filter(Boolean);
  if (!list.length) return notFound();
  const opts = { notes: S.ui.incNotes, personal: S.ui.incPersonal };
  return `<div class="print-toolbar">
    <a class="btn" href="${target === 'all' ? '#/reports' : `#/report/${target}/${ym}`}">${icon('back', 18)} رجوع</a>
    <span class="grow small muted">${list.length > 1 ? `${list.length} صفحات · ` : ''}${Native.isNative ? 'يُحفظ ملف PDF وتظهر قائمة المشاركة' : 'اختاري «حفظ بتنسيق PDF» من نافذة الطباعة'}</span>
    ${Native.isNative
      ? `<button class="btn primary" data-act="pdfShare" data-name="${esc(list.length > 1 ? `تقرير ${S.data.halaqaName} ${D.monthName(ym)}` : `تقرير ${list[0].name} ${D.monthName(ym)}`)}">${icon('download', 18)} حفظ PDF ومشاركته</button>`
      : `<button class="btn primary" data-act="print">${icon('print', 18)} طباعة / حفظ PDF</button>`}</div>
    <div class="sheets">${list.map((s) => sheetHTML(s, ym, opts)).join('')}</div>`;
}

// ===== الإعدادات =====
function vSettings() {
  const st = S.data.settings;
  const age = backupAge();
  const colors = [['#0E5E4E', 'أخضر'], ['#24477F', 'كحلي'], ['#5E3A78', 'بنفسجي'], ['#7A4A16', 'بني']];
  const notifOn = st.notify && (Native.isNative || ('Notification' in window && Notification.permission === 'granted'));
  return `<main class="screen">
  <div class="top"><h1>الإعدادات</h1></div>
  <div class="card stack" style="gap:14px">
    <div class="row-flex" style="gap:12px"><div class="avatar" style="border-radius:14px;width:48px;height:48px">${icon('cloud', 26)}</div>
      <div><h2 style="font-size:16px">بياناتك بأمان</h2><span class="small muted">محفوظة على هذا الجهاز وتعمل بدون إنترنت</span></div></div>
    <div class="between" style="background:var(--bg);border-radius:14px;padding:10px 12px">
      <div><div class="tiny muted">آخر نسخة احتياطية</div><div class="small" style="font-weight:600">${st.lastBackup ? `${esc(D.long(st.lastBackup.slice(0, 10)))}${age ? ` (${esc(D.relative(st.lastBackup.slice(0, 10)))})` : ''}` : 'لم تُؤخذ نسخة بعد'}</div></div>
      ${S.data.changes ? `<span class="badge">${S.data.changes} ${S.data.changes <= 10 ? 'تعديلات' : 'تعديلاً'} جديدة</span>` : ''}</div>
    <button class="btn primary lg block" data-act="backup">${icon('cloud', 18)} نسخ احتياطي الآن</button>
    <span class="tiny muted" style="margin-top:-6px">على الجوال سيظهر لكِ خيار «Drive» لحفظ النسخة في Google Drive. على الحاسوب يُنزَّل الملف، ارفعيه على Drive يدوياً.</span>
  </div>

  <h2 class="section-title">النسخ الاحتياطي</h2>
  <div class="card flush">
    <label class="menu-row" for="restore-file" style="cursor:pointer"><span>${icon('upload', 18)} استعادة من نسخة سابقة</span>${icon('fwd', 18)}</label>
    <input id="restore-file" type="file" accept="application/json,.json" hidden data-act-change="restore">
    <button class="menu-row" data-act="backupDownload"><span>${icon('download', 18)} تنزيل نسخة كملف على الجهاز</span>${icon('fwd', 18)}</button>
    <label class="switch"><span class="grow"><span>تذكيري بأخذ نسخة كل أسبوع</span><span class="tiny muted">يظهر تنبيه في الصفحة الرئيسية</span></span><input type="checkbox" data-act-change="backupRemind" ${st.backupEvery < 999 ? 'checked' : ''}><span class="track"></span></label>
  </div>

  <h2 class="section-title">الحلقة</h2>
  <div class="card stack">
    <button class="btn block" data-act="pickImport">${icon('upload', 18)} استيراد الطالبات من Excel</button>
    <div class="field"><label for="set-halaqa">اسم الحلقة</label><input id="set-halaqa" value="${esc(S.data.halaqaName)}" data-act-change="halaqaName"></div>
    <div class="field"><span class="label">لون التطبيق</span><div class="row-flex" style="gap:10px">${colors.map(([c, n]) => `<button class="icon-btn" style="width:48px;height:48px;border-radius:50%;background:${c};border:3px solid ${st.primary === c ? 'var(--ink)' : 'transparent'}" data-act="color" data-v="${c}" aria-label="${n}" aria-pressed="${st.primary === c}">${st.primary === c ? `<span style="color:#fff">${icon('check', 20, 2.6)}</span>` : ''}</button>`).join('')}</div></div>
    <div class="field"><label for="set-cc">مفتاح الدولة لأرقام واتساب</label><input id="set-cc" class="ltr" style="text-align:right" inputmode="numeric" value="${esc(st.countryCode)}" data-act-change="countryCode"><span class="hint">مثال: 970 فلسطين، 972، 962 الأردن، 966 السعودية</span></div>
  </div>

  <h2 class="section-title">الأمان والتنبيهات</h2>
  <div class="card flush">
    <button class="menu-row" data-act="pinSetup"><span>${icon('lock', 18)} قفل التطبيق برمز PIN</span><span class="small" style="font-weight:600;color:var(--primary)">${S.account.pinHash ? 'مفعّل · تغيير' : 'غير مفعّل'}</span></button>
    ${S.account.pinHash ? `<button class="menu-row" data-act="pinRemove" style="color:var(--red)"><span>إلغاء رمز PIN</span></button>` : ''}
    <label class="switch"><span class="grow"><span>تنبيهات الاختبارات</span><span class="tiny muted">${Native.isNative ? "إشعار الساعة 7 صباحاً في يوم كل اختبار أو تذكير" : "إشعار عند فتح التطبيق إذا كان هناك اختبار اليوم أو غداً"}</span></span><input type="checkbox" data-act-change="notify" ${notifOn ? 'checked' : ''}><span class="track"></span></label>
    <button class="menu-row" data-act="archived"><span>الطالبات في الأرشيف</span><span class="small muted">${S.data.students.filter((s) => s.archived).length}</span></button>
    <button class="menu-row" data-act="logout" style="color:var(--red)"><span>تسجيل الخروج</span></button>
  </div>
  <p class="tiny muted" style="text-align:center;margin:18px 0 0">الإحسان · الإصدار 1.0 · الحساب: ${esc(S.account.name)}</p>
  ${nav('settings')}</main>`;
}

function notFound() {
  return `<main class="screen"><div class="empty"><h2 style="font-size:18px">الصفحة غير موجودة</h2><p><a href="#/students">العودة للطالبات</a></p></div>${S.data ? nav('') : ''}</main>`;
}

// ===== التوجيه =====
const ROUTES = [
  [/^#\/welcome$/, vWelcome, true],
  [/^#\/setup$/, vSetup, true],
  [/^#\/login$/, vLogin, true],
  [/^#\/pin$/, vPin, true],
  [/^#\/students$/, vStudents],
  [/^#\/students\/new$/, () => vStudentForm(null)],
  [/^#\/student\/(\w+)$/, vStudent],
  [/^#\/student\/(\w+)\/edit$/, vStudentForm],
  [/^#\/entry\/(\w+)(?:\/(\w+))?$/, vEntry],
  [/^#\/reminders$/, vReminders],
  [/^#\/reports$/, vReports],
  [/^#\/report\/(\w+)\/(\d{4}-\d{2})$/, vStudentReport],
  [/^#\/print\/(\w+)\/(\d{4}-\d{2})$/, vPrint],
  [/^#\/settings$/, vSettings],
];

function render() {
  const h = location.hash || '#/students';
  if (!S.data) {
    const pub = ROUTES.find(([re, , p]) => p && re.test(h));
    if (!pub) { location.replace(store.get('halaqa.session') && S.accounts.some((a) => a.id === store.get('halaqa.session') && a.pinHash) ? '#/pin' : '#/welcome'); return; }
  }
  if (S.data && /^#\/(login|setup|pin)$/.test(h) && !(h === '#/setup' && S.ui.addingAccount)) { location.replace('#/students'); return; }
  const r = ROUTES.find(([re]) => re.test(h));
  if (!r) { location.replace('#/students'); return; }
  const args = h.match(r[0]).slice(1);
  const changed = S.lastHash !== h;
  if (changed && !/^#\/entry\//.test(h)) S.draft = null;
  if (changed && /^#\/student\/\w+$/.test(h) && !/^#\/(entry|student|report)\//.test(S.lastHash || '')) { S.ui.tab = 'log'; S.ui.logLimit = 20; }
  const y = window.scrollY;
  $app.innerHTML = r[1](...args);
  // أرقام إنجليزية في حقول الأرقام والتواريخ مثل باقي التطبيق
  $app.querySelectorAll('input[type=number], input[type=date]').forEach((i) => { i.lang = 'en-GB'; });
  fitSheets();
  if ($dlg.open && changed) $dlg.close();
  S.lastHash = h;
  if (changed) window.scrollTo(0, 0); else window.scrollTo(0, y);
}

// ===== الأحداث =====
const ACT = {
  filter: (el) => { S.ui.filter = el.dataset.v; render(); },
  tab: (el) => { S.ui.tab = el.dataset.v; render(); if (el.dataset.v === 'notes') setTimeout(() => document.getElementById('note-text')?.focus(), 50); },
  more: () => { S.ui.logLimit += 30; render(); },
  remTab: (el) => { S.ui.remTab = el.dataset.v; render(); },
  repScope: (el) => { S.ui.repScope = el.dataset.v; render(); },
  repMonth: (el) => { const n = D.shiftMonth(S.ui.repMonth, Number(el.dataset.d)); if (n <= D.thisMonth()) { S.ui.repMonth = n; render(); } },
  stMonth: (el) => { const n = D.shiftMonth(el.dataset.ym, Number(el.dataset.d)); if (n <= D.thisMonth()) go(`#/report/${el.dataset.sid}/${n}`); },
  closeDialog: () => $dlg.close(),
  print: () => window.print(),
  pdfShare: async (el) => {
    const box = document.querySelector('.sheets');
    el.disabled = true;
    toast('جاري تجهيز ملف PDF…');
    box.style.zoom = 1;
    try {
      const blob = await Export.sheetsToPdf([...box.querySelectorAll('.sheet')]);
      await Export.saveFile(blob, `${el.dataset.name}.pdf`, { title: el.dataset.name });
    } catch (e) { console.error(e); toast('تعذّر إنشاء ملف PDF'); }
    fitSheets();
    el.disabled = false;
  },
  forget: () => { store.set('halaqa.session', null); go('#/login'); },

  draftType: (el) => {
    const d = S.draft, v = el.dataset.v;
    d.type = v;
    if (v === 'review' && d.auto) { const s = student(d.sid); const j = Math.max(1, currentJuz(s) + (s.direction === 'forward' ? -1 : 1)); d.reviewJuz = Logic.juzCount(s) ? Math.min(30, j) : ''; if (d.reviewJuz) { [d.fromSurah, d.fromAyah] = Quran.juzStart(d.reviewJuz); [d.toSurah, d.toAyah] = Quran.juzEnd(d.reviewJuz); d.pages = Quran.pages(d.fromSurah, d.fromAyah, d.toSurah, d.toAyah); } }
    if (v === 'new' && d.auto) { const fresh = newDraft(student(d.sid)); Object.assign(d, { fromSurah: fresh.fromSurah, fromAyah: fresh.fromAyah, toSurah: fresh.toSurah, toAyah: fresh.toAyah, pages: fresh.pages, reviewJuz: '' }); }
    render();
  },
  draftGrade: (el) => { S.draft.grade = el.dataset.v; document.querySelectorAll('[data-act="draftGrade"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === el.dataset.v)); },
  step: (el) => { const k = el.dataset.k; S.draft[k] = Math.max(0, (S.draft[k] || 0) + Number(el.dataset.d)); document.getElementById('out-' + k).textContent = S.draft[k]; },
  saveEntry: (el) => saveEntry(el.dataset.next === '1'),
  deleteEntry: async (el) => {
    if (!(await confirmBox('حذف التسميع؟', 'سيُحذف هذا التسميع من سجل الطالبة وتقاريرها.', 'حذف', true))) return;
    const sid = S.draft.sid;
    S.data.entries = S.data.entries.filter((e) => e.id !== el.dataset.id);
    await save(); S.draft = null; toast('تم الحذف'); go(`#/student/${sid}`);
  },

  toggleJuz: async (el) => {
    const s = student(location.hash.split('/')[2]);
    const j = Number(el.dataset.j);
    s.juz = s.juz || {};
    if (s.juz[j]) {
      if (!(await confirmBox(`إلغاء الجزء ${j}؟`, `سيُزال تعليم الجزء ${j} كمكتمل لـ ${s.name}.`, 'إلغاء التعليم', true))) return;
      delete s.juz[j];
    } else {
      s.juz[j] = D.today();
      toast(`تم تعليم الجزء ${j} كمكتمل`);
    }
    await save(); render();
  },
  archiveStudent: async (el) => {
    const s = student(el.dataset.id);
    s.archived = !s.archived;
    await save(); toast(s.archived ? 'نُقلت الطالبة للأرشيف' : 'أُرجعت الطالبة للحلقة'); go('#/students');
  },
  deleteStudent: async (el) => {
    const s = student(el.dataset.id);
    const n = S.data.entries.filter((e) => e.studentId === s.id).length;
    if (!(await confirmBox(`حذف ${s.name} نهائياً؟`, `سيُحذف ملفها و${n} تسميعاً وكل ملاحظاتها وتذكيراتها، ولا يمكن التراجع إلا من نسخة احتياطية. إذا تركت الحلقة يمكنك نقلها للأرشيف بدلاً من الحذف.`, 'حذف نهائي', true))) return;
    S.data.students = S.data.students.filter((x) => x.id !== s.id);
    S.data.entries = S.data.entries.filter((x) => x.studentId !== s.id);
    S.data.notes = S.data.notes.filter((x) => x.studentId !== s.id);
    S.data.reminders = S.data.reminders.filter((x) => x.studentId !== s.id);
    await save(); toast('تم حذف الطالبة'); go('#/students');
  },
  deleteNote: async (el) => {
    if (!(await confirmBox('حذف الملاحظة؟', 'ستُحذف هذه الملاحظة.', 'حذف', true))) return;
    S.data.notes = S.data.notes.filter((n) => n.id !== el.dataset.id);
    await save(); render();
  },
  waLast: (el) => {
    const s = student(el.dataset.sid);
    const e = Logic.studentEntries(S.data, s.id)[0];
    if (!e) { toast('لا يوجد تسميع لإرساله بعد'); return; }
    if (!s.guardianPhone && !s.phone) toast('لا يوجد رقم جوال، اختاري جهة الاتصال من واتساب');
    Export.openWhatsApp(Export.entryText(S.data, s, e), s.guardianPhone || s.phone, S.data.settings.countryCode);
  },
  waReport: (el) => {
    const s = student(el.dataset.sid);
    if (!s) return;
    Export.openWhatsApp(Export.whatsappText(S.data, s, el.dataset.ym || S.ui.repMonth), s.guardianPhone || s.phone, S.data.settings.countryCode);
  },
  exportExcel: async (el) => {
    const ym = el.dataset.ym || S.ui.repMonth;
    const list = el.dataset.target === 'all' ? activeStudents() : [student(el.dataset.target)].filter(Boolean);
    if (!list.length) return;
    el.disabled = true;
    try {
      const blob = await Export.monthWorkbook(S.data, list, ym, { notes: S.ui.incNotes, personal: S.ui.incPersonal });
      const name = list.length > 1 ? `تقرير ${S.data.halaqaName} ${D.monthName(ym)}.xlsx` : `تقرير ${list[0].name} ${D.monthName(ym)}.xlsx`;
      const r = await Export.saveFile(blob, name, { preferShare: matchMedia('(pointer: coarse)').matches });
      if (r !== 'cancelled') toast('تم تجهيز ملف Excel');
    } catch (e) { console.error(e); toast('تعذّر إنشاء ملف Excel'); }
    el.disabled = false;
  },

  addReminder: (el) => reminderDialog(el.dataset.sid, Number(el.dataset.juz) || 0),
  doneReminder: async (el) => { const r = S.data.reminders.find((x) => x.id === el.dataset.id); r.done = true; r.doneAt = new Date().toISOString(); await save(); toast('أحسنتِ، تم'); render(); },
  undoReminder: async (el) => { const r = S.data.reminders.find((x) => x.id === el.dataset.id); r.done = false; await save(); render(); },
  deleteReminder: async (el) => {
    if (!(await confirmBox('حذف التذكير؟', 'سيُحذف هذا التذكير.', 'حذف', true))) return;
    S.data.reminders = S.data.reminders.filter((x) => x.id !== el.dataset.id); await save(); render();
  },
  dismissSug: async (el) => { S.data.dismissed.push(el.dataset.key); await save(); render(); },

  pickImport: () => document.getElementById('import-file').click(),
  backup: () => doBackup(true),
  backupDownload: () => doBackup(false),
  color: async (el) => { S.data.settings.primary = el.dataset.v; applyTheme(); await save(); render(); },
  pinSetup: () => {
    $dlg.innerHTML = `<form data-form="pinSet" class="stack"><h2>رمز PIN</h2><p>رمز من 4 إلى 6 أرقام يُطلب عند فتح التطبيق على هذا الجهاز.</p>
      <div class="field"><label for="pin1">الرمز</label><input id="pin1" name="pin1" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6" required></div>
      <div class="field"><label for="pin2">تأكيد الرمز</label><input id="pin2" name="pin2" class="pin-input" type="password" inputmode="numeric" maxlength="6" required></div>
      <p class="tone-late small" data-error style="margin:0"></p>
      <div class="btn-row"><button class="btn primary">حفظ</button><button type="button" class="btn" data-act="closeDialog">إلغاء</button></div></form>`;
    $dlg.onclose = null; $dlg.showModal();
  },
  pinRemove: async () => {
    if (!(await confirmBox('إلغاء رمز PIN؟', 'سيُفتح التطبيق مباشرة على هذا الجهاز بدون رمز.', 'إلغاء الرمز', true))) return;
    S.account.pinHash = null; await DB.set('accounts', S.accounts); render();
  },
  archived: () => {
    const arch = S.data.students.filter((s) => s.archived);
    $dlg.innerHTML = `<form method="dialog" class="stack"><h2>الأرشيف</h2>${arch.length ? `<div class="card flush">${arch.map((s) => `<a class="entry" href="#/student/${s.id}/edit" style="color:inherit" data-act="closeDialog"><span class="body" style="font-weight:600">${esc(s.name)}</span>${icon('fwd', 18)}</a>`).join('')}</div>` : '<p>لا توجد طالبات في الأرشيف.</p>'}<button class="btn">إغلاق</button></form>`;
    $dlg.onclose = null; $dlg.showModal();
  },
  logout: async () => {
    if (!(await confirmBox('تسجيل الخروج؟', 'بياناتك تبقى محفوظة على الجهاز، وستحتاجين كلمة المرور للدخول مرة أخرى.', 'خروج'))) return;
    store.set('halaqa.session', null); store.sset('halaqa.unlocked', null);
    S.account = null; S.data = null; go('#/login');
  },
};

const CHANGE = {
  importFile: (el) => { const f = el.files && el.files[0]; el.value = ''; if (f) doImport(f); },
  repStudent: (el) => { S.ui.repStudent = el.value; render(); },
  incNotes: (el) => { S.ui.incNotes = el.checked; },
  incPersonal: (el) => { S.ui.incPersonal = el.checked; },
  halaqaName: async (el) => { S.data.halaqaName = el.value.trim() || 'حلقتي'; await save(); toast('تم الحفظ'); },
  countryCode: async (el) => { S.data.settings.countryCode = el.value.replace(/\D/g, '') || '970'; await save(); toast('تم الحفظ'); },
  backupRemind: async (el) => { S.data.settings.backupEvery = el.checked ? 7 : 999; await save(); },
  remKind: (el) => {
    const f = el.form;
    f.querySelector('[data-for="test"]').hidden = el.value !== 'test';
    f.querySelector('[data-for="other"]').hidden = el.value === 'test';
  },
  notify: async (el) => {
    if (el.checked) {
      if (Native.isNative) {
        if (!(await Native.notifyPermission())) { toast('لم يُسمح بالإشعارات من إعدادات الجوال'); el.checked = false; return; }
      } else {
        if (!('Notification' in window)) { toast('المتصفح لا يدعم الإشعارات'); el.checked = false; return; }
        const p = await Notification.requestPermission();
        if (p !== 'granted') { toast('لم يُسمح بالإشعارات'); el.checked = false; return; }
      }
    }
    S.data.settings.notify = el.checked; await save();
    if (el.checked) toast(Native.isNative ? 'سيصلك إشعار الساعة 7 صباحاً في يوم كل اختبار' : 'تم تفعيل التنبيهات');
  },
  restore: async (el) => {
    const file = el.files && el.files[0];
    el.value = '';
    if (!file) return;
    try {
      const p = JSON.parse(await file.text());
      if (p.app !== 'halaqa' || !p.data || !Array.isArray(p.data.students)) throw new Error('bad');
      const ok = await confirmBox('استعادة النسخة؟', `نسخة بتاريخ ${D.long(p.exportedAt.slice(0, 10))} فيها ${p.data.students.length} طالبة و${p.data.entries.length} تسميعاً. ستحلّ محل البيانات الحالية على هذا الجهاز (${S.data.students.length} طالبة).`, 'استعادة');
      if (!ok) return;
      S.data = Object.assign(emptyData(), p.data);
      S.data.settings = Object.assign(emptyData().settings, p.data.settings || {});
      S.data.changes = 0;
      await DB.set('data:' + S.account.id, S.data);
      applyTheme(); toast('تمت استعادة البيانات'); render();
    } catch (e) { toast('الملف ليس نسخة صالحة من الإحسان'); }
  },
};

const FORMS = {
  async setup(f) {
    const v = Object.fromEntries(new FormData(f));
    const err = f.querySelector('[data-error]');
    const name = v.name.trim();
    if (!name) { err.textContent = 'اكتبي اسم المحفّظة'; return; }
    if ((v.pass || '').length < 4) { err.textContent = 'كلمة المرور قصيرة، 4 أحرف على الأقل'; return; }
    if (v.pass !== v.pass2) { err.textContent = 'كلمتا المرور غير متطابقتين'; return; }
    if (S.accounts.some((a) => a.name.trim() === name)) { err.textContent = 'يوجد حساب بهذا الاسم على هذا الجهاز'; return; }
    const salt = uid();
    const acc = { id: uid(), name, salt, passHash: await hashSecret(v.pass, salt), pinHash: null, created: new Date().toISOString() };
    S.accounts.push(acc);
    await DB.set('accounts', S.accounts);
    await DB.set('data:' + acc.id, emptyData(v.halaqa.trim() || 'حلقتي'));
    S.ui.addingAccount = false;
    await enter(acc, true);
    toast(`أهلاً أ. ${firstName(name)}، ابدئي بإضافة الطالبات`);
  },
  async login(f) {
    const v = Object.fromEntries(new FormData(f));
    const err = f.querySelector('[data-error]');
    // «احسان» و«إحسان» نفس الاسم: نتجاهل الهمزات والمسافات
    const acc = S.accounts.find((a) => Import.norm(a.name) === Import.norm(v.name));
    if (!acc || (await hashSecret(v.pass || '', acc.salt)) !== acc.passHash) { err.textContent = 'الاسم أو كلمة المرور غير صحيحة'; return; }
    await enter(acc, !!v.remember);
  },
  async pin(f) {
    const acc = S.accounts.find((a) => a.id === store.get('halaqa.session'));
    const v = new FormData(f).get('pin') || '';
    if (!acc || (await hashSecret(v, acc.salt + ':pin')) !== acc.pinHash) { f.querySelector('[data-error]').textContent = 'الرمز غير صحيح'; f.pin.value = ''; return; }
    await enter(acc);
  },
  async pinSet(f) {
    const v = Object.fromEntries(new FormData(f));
    const err = f.querySelector('[data-error]');
    if (!/^\d{4,6}$/.test(v.pin1)) { err.textContent = 'الرمز من 4 إلى 6 أرقام'; return; }
    if (v.pin1 !== v.pin2) { err.textContent = 'الرمزان غير متطابقين'; return; }
    S.account.pinHash = await hashSecret(v.pin1, S.account.salt + ':pin');
    await DB.set('accounts', S.accounts);
    store.set('halaqa.session', S.account.id);
    $dlg.close(); toast('تم تفعيل رمز PIN'); render();
  },
  async student(f) {
    const v = Object.fromEntries(new FormData(f));
    const name = (v.name || '').trim();
    if (!name) { f.querySelector('[data-error]').textContent = 'اكتبي اسم الطالبة'; f.name.focus(); return; }
    const fields = { name, direction: v.direction, nationalId: v.nationalId.trim(), phone: v.phone.trim(), guardianPhone: v.guardianPhone.trim(), birthDate: v.birthDate };
    let s = f.dataset.id ? student(f.dataset.id) : null;
    if (s) Object.assign(s, fields);
    else {
      s = { id: uid(), ...fields, juz: {}, created: new Date().toISOString(), archived: false };
      const n = Math.max(0, Math.min(30, Number(v.juz) || 0));
      for (let k = 0; k < n; k++) s.juz[v.direction === 'forward' ? k + 1 : 30 - k] = BEFORE;
      S.data.students.push(s);
    }
    await save();
    toast(f.dataset.id ? 'تم حفظ البيانات' : `أُضيفت ${name}`);
    go(`#/student/${s.id}`);
  },
  async importConfirm(f) {
    const dir = new FormData(f).get('direction') || 'backward';
    const rows = S.importRows || [];
    const now = new Date().toISOString();
    for (const r of rows) {
      const s = { id: uid(), name: r.name, direction: dir, nationalId: r.nationalId, phone: r.phone, guardianPhone: r.guardianPhone, birthDate: r.birthDate, juz: {}, created: now, archived: false };
      for (let k = 0; k < r.juz; k++) s.juz[dir === 'forward' ? k + 1 : 30 - k] = BEFORE;
      S.data.students.push(s);
    }
    S.importRows = null;
    await save();
    $dlg.close();
    toast(`تم استيراد ${studentWord(rows.length)}`);
    go('#/students');
  },
  async note(f) {
    const text = new FormData(f).get('text').trim();
    if (!text) return;
    S.data.notes.push({ id: uid(), studentId: f.dataset.sid, date: D.today(), text });
    await save(); toast('تم حفظ الملاحظة'); render();
  },
  async reminder(f) {
    const v = Object.fromEntries(new FormData(f));
    const r = { id: uid(), studentId: v.studentId, kind: v.kind, date: v.date || D.today(), done: false, created: new Date().toISOString() };
    if (v.kind === 'test') { r.juz = Math.max(1, Math.min(30, Number(v.juz) || 5)); r.title = `اختبار ${juzWord(r.juz)}`; }
    else { r.title = (v.title || '').trim() || 'تذكير'; }
    S.data.reminders.push(r);
    await save(); $dlg.close(); toast('تم حفظ التذكير'); render();
  },
};

// ===== استيراد الطالبات =====
const FIELD_ORDER = ['name', 'nationalId', 'phone', 'guardianPhone', 'birthDate', 'juz'];

async function doImport(file) {
  toast('جاري قراءة الملف…');
  let res;
  try {
    res = await Import.parseFile(file);
  } catch (e) {
    const msg = e.message === 'xls' ? 'صيغة xls القديمة غير مدعومة، احفظي الملف من Excel بصيغة xlsx'
      : e.message === 'noname' ? 'ما لقينا عمود الأسماء، تأكدي إن أول صف فيه عنوان مثل «الاسم»'
      : 'تعذّرت قراءة الملف، تأكدي إنه ملف Excel (xlsx) أو CSV';
    toast(msg);
    return;
  }
  const key = (s) => Import.norm(s.name);
  const names = new Set(S.data.students.map(key));
  const ids = new Set(S.data.students.map((s) => s.nationalId).filter(Boolean));
  const seen = new Set();
  const fresh = [], dupes = [];
  for (const r of res.rows) {
    const k = key(r);
    if (names.has(k) || (r.nationalId && ids.has(r.nationalId)) || seen.has(k)) dupes.push(r); else { fresh.push(r); seen.add(k); }
  }
  S.importRows = fresh;
  const found = new Map(res.mapping.map((m) => [m.field, m.header]));
  const preview = fresh.slice(0, 5);
  const detail = (r) => [r.nationalId && `هوية ${r.nationalId}`, (r.guardianPhone || r.phone) && `<span class="ltr">${esc(r.guardianPhone || r.phone)}</span>`, r.birthDate && D.slash(r.birthDate), r.juz && juzWord(r.juz)].filter(Boolean).map((x) => (x.startsWith('<') ? x : esc(x))).join(' · ');
  $dlg.innerHTML = `<form data-form="importConfirm" class="stack">
    <h2>استيراد الطالبات</h2>
    <p style="margin:0">${fresh.length ? `وجدنا <b>${esc(studentWord(fresh.length))}</b> في ورقة «${esc(res.sheet)}».` : 'لا توجد طالبات جديدات في هذا الملف.'}${dupes.length ? ` ${dupes.length === 1 ? 'وطالبة واحدة موجودة مسبقاً وسيتم تجاوزها' : `و${esc(studentWord(dupes.length))} موجودات مسبقاً وسيتم تجاوزهن`}: ${esc(dupes.slice(0, 3).map((d) => d.name).join('، '))}${dupes.length > 3 ? '…' : ''}.` : ''}</p>
    <div class="card flush">${FIELD_ORDER.map((f) => `<div class="between" style="padding:8px 12px;border-bottom:1px solid var(--surface-2)"><span class="small" style="font-weight:600">${Import.FIELDS[f]}</span>
      ${found.has(f) ? `<span class="small" style="color:var(--primary)">${icon('check', 14, 2.6)} «${esc(found.get(f))}»</span>` : '<span class="small tone-muted">غير موجود في الملف</span>'}</div>`).join('')}</div>
    ${preview.length ? `<div><div class="tiny muted" style="margin-bottom:4px">أول ${preview.length} أسماء:</div><div class="card flush">${preview.map((r) => `<div style="padding:8px 12px;border-bottom:1px solid var(--surface-2)"><div style="font-weight:600">${esc(r.name)}</div>${detail(r) ? `<div class="tiny muted">${detail(r)}</div>` : ''}</div>`).join('')}</div></div>` : ''}
    ${fresh.length ? `<div class="field"><label for="imp-dir">طريقة الحفظ لهن</label><select id="imp-dir" name="direction"><option value="backward">من الناس إلى البقرة</option><option value="forward">من البقرة إلى الناس</option></select></div>` : ''}
    <div class="btn-row">${fresh.length ? `<button class="btn primary">استيراد ${fresh.length}</button>` : ''}<button type="button" class="btn" data-act="closeDialog">${fresh.length ? 'إلغاء' : 'إغلاق'}</button></div>
  </form>`;
  $dlg.onclose = null;
  $dlg.showModal();
}

async function doBackup(share) {
  const blob = Export.backupBlob(S.account, S.data);
  const name = `نسخة الإحسان ${D.today()}.json`;
  const r = await Export.saveFile(blob, name, { preferShare: share, title: 'نسخة احتياطية - الإحسان' });
  if (r === 'cancelled') return;
  S.data.settings.lastBackup = new Date().toISOString();
  S.data.changes = 0;
  await DB.set('data:' + S.account.id, S.data);
  toast(r === 'shared' ? 'تمت مشاركة النسخة' : 'تم تنزيل النسخة، احفظيها على Drive');
  render();
}

async function notifyDue() {
  try {
    if (Native.isNative) { Native.scheduleReminders(S.data, (id) => (student(id) || {}).name || ''); return; }
    if (!S.data.settings.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
    const key = 'halaqa.notified.' + S.account.id;
    if (store.get(key) === D.today()) return;
    const due = S.data.reminders.filter((r) => !r.done && D.daysBetween(D.today(), r.date) >= 0 && D.daysBetween(D.today(), r.date) <= 1);
    if (!due.length) return;
    const body = due.map((r) => `${(student(r.studentId) || {}).name || ''}: ${r.title} ${D.relative(r.date)}`).join('\n');
    const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
    if (reg) reg.showNotification('تذكير الاختبارات', { body, icon: 'icons/icon-192.png', dir: 'rtl', lang: 'ar' });
    else new Notification('تذكير الاختبارات', { body, dir: 'rtl', lang: 'ar' });
    store.set(key, D.today());
  } catch (e) {}
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || !ACT[el.dataset.act]) return;
  if (el.tagName === 'BUTTON' || el.tagName === 'A' && el.dataset.act !== 'closeDialog') ev.preventDefault();
  ACT[el.dataset.act](el, ev);
});
document.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-act-change]');
  if (el && CHANGE[el.dataset.actChange]) CHANGE[el.dataset.actChange](el, ev);
  onBind(ev);
});
document.addEventListener('input', (ev) => {
  if (ev.target.id === 'q') {
    S.ui.q = ev.target.value.trim();
    document.querySelectorAll('#st-list .st-row').forEach((r) => { r.hidden = !!S.ui.q && !r.dataset.name.includes(S.ui.q); });
    return;
  }
  onBind(ev);
});
document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('[data-form]');
  if (!f) return;
  ev.preventDefault();
  FORMS[f.dataset.form](f);
});
$dlg.addEventListener('click', (ev) => { if (ev.target === $dlg) $dlg.close(); });
window.addEventListener('hashchange', render);
window.addEventListener('resize', fitSheets);
window.addEventListener('online', () => S.data && render());
window.addEventListener('offline', () => S.data && render());

// حساب جاهز مسبقاً (seed.json): موجود فقط في نسخة APK الخاصة، وليس في الموقع العام.
// يُضاف مرة واحدة إذا لم يكن الحساب موجوداً على الجهاز.
async function applySeed() {
  let seed;
  try {
    const r = await fetch('seed.json', { cache: 'no-store' });
    if (!r.ok) return;
    seed = await r.json();
  } catch (e) { return; }
  if (!seed || !seed.account || !seed.data) return;
  const acc = seed.account;
  if (await DB.get('seeded:' + acc.id)) return;
  if (!S.accounts.some((a) => a.id === acc.id || Import.norm(a.name) === Import.norm(acc.name))) {
    S.accounts.push(acc);
    await DB.set('accounts', S.accounts);
    await DB.set('data:' + acc.id, Object.assign(emptyData(), seed.data));
  }
  await DB.set('seeded:' + acc.id, true);
}

// ===== التشغيل =====
(async function boot() {
  try {
    S.accounts = (await DB.get('accounts')) || [];
    await applySeed();
  } catch (e) {
    $app.innerHTML = '<main class="screen"><div class="empty"><h2>تعذّر فتح التخزين على هذا المتصفح</h2><p>جرّبي فتح التطبيق في Chrome أو Safari بدون وضع التصفح الخفي.</p></div></main>';
    return;
  }
  const unlocked = store.sget('halaqa.unlocked');
  const remembered = store.get('halaqa.session');
  const acc = S.accounts.find((a) => a.id === (unlocked || remembered));
  if (acc && (unlocked === acc.id || !acc.pinHash)) await enter(acc);
  else render();
  // في تطبيق أندرويد الملفات موجودة داخل التطبيق أصلاً، فلا نحتاج service worker
  if (!Native.isNative && 'serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
