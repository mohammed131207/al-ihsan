// استيراد الطالبات من ملف Excel أو CSV: يتعرّف على الأعمدة من عناوينها
const Import = (() => {
  const FIELDS = {
    name: 'الاسم',
    nationalId: 'رقم الهوية',
    phone: 'الجوال',
    guardianPhone: 'جوال ولي الأمر',
    birthDate: 'تاريخ الميلاد',
    juz: 'الأجزاء المحفوظة',
  };

  const toWestern = (s) => String(s).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

  // توحيد كتابة العنوان: بدون مسافات وتشكيل، والهمزات والتاء المربوطة موحّدة
  function norm(s) {
    return toWestern(String(s || ''))
      .toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/[^a-z0-9ء-ي]/g, '');
  }

  const has = (h, list) => list.some((w) => h.includes(w));
  const GUARD = ['ولي', 'الام', 'الاب', 'الاهل', 'والد', 'parent', 'guardian'];
  const PHONE = ['جوال', 'هاتف', 'موبايل', 'تلفون', 'تليفون', 'واتس', 'تواصل', 'phone', 'mobile', 'tel'];

  function classify(header) {
    const h = norm(header);
    if (!h) return null;
    if (has(h, ['ميلاد', 'مواليد', 'ولاده', 'birth', 'dob'])) return 'birthDate';
    if (has(h, ['هويه', 'وطني', 'nationalid', 'idnumber']) || h === 'id' || h === 'رقمالهويه') return 'nationalId';
    if (has(h, PHONE)) return has(h, GUARD) ? 'guardianPhone' : 'phone';
    if (has(h, ['اجزاء', 'جزء', 'juz'])) return 'juz';
    if (has(h, GUARD)) return null; // اسم ولي الأمر ليس اسم الطالبة
    if (has(h, ['محفظ', 'معلم', 'حلقه', 'مستوي', 'صف', 'ملاحظ', 'عنوان', 'مدرسه'])) return null;
    if (has(h, ['اسم', 'name', 'طالبه', 'طالب'])) return 'name';
    return null;
  }

  function cellText(v) {
    if (v == null) return '';
    if (v instanceof Date) return v;
    if (typeof v === 'object') {
      if (v.richText) return v.richText.map((t) => t.text).join('');
      if (v.text != null) return cellText(v.text);
      if (v.result != null) return cellText(v.result);
      if (v.error) return '';
      return '';
    }
    return v;
  }

  function cleanDigits(v) {
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v));
    return toWestern(String(v)).replace(/[^\d+]/g, '');
  }

  function cleanPhone(v) {
    let p = cleanDigits(v);
    if (!p) return '';
    // الأرقام المحفوظة كرقم في Excel تفقد الصفر الأول (599123456 ← 0599123456)
    if (/^5\d{8}$/.test(p)) p = '0' + p;
    return p;
  }

  const pad = (n) => String(n).padStart(2, '0');

  function cleanDate(v) {
    if (!v) return '';
    if (v instanceof Date && !isNaN(v)) return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
    if (typeof v === 'number') {
      if (v > 1900 && v < 2100) return ''; // سنة فقط بدون يوم وشهر: نتركه فارغاً بدل تاريخ غير صحيح
      const d = new Date(Math.round((v - 25569) * 86400000)); // رقم تسلسلي من Excel
      return isNaN(d) ? '' : cleanDate(d);
    }
    const s = toWestern(String(v)).trim();
    let m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (m) return valid(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (m) {
      let [, a, b, y] = m.map(Number);
      if (y < 100) y += y > 40 ? 1900 : 2000;
      // الافتراضي: يوم/شهر/سنة، إلا إذا كان الرقم الثاني أكبر من 12
      return b > 12 ? valid(y, a, b) : valid(y, b, a);
    }
    return '';
  }

  function valid(y, m, d) {
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1950 || y > 2100) return '';
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  function parseCSV(text) {
    const delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const rows = [];
    let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === delim || c === '\t') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c !== '\r') cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  async function readGrid(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv') || name.endsWith('.txt')) {
      return [{ name: file.name, grid: parseCSV((await file.text()).replace(/^﻿/, '')) }];
    }
    if (name.endsWith('.xls')) throw new Error('xls');
    await Export.loadExcel();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    return wb.worksheets.map((ws) => {
      const grid = [];
      ws.eachRow({ includeEmpty: false }, (r, i) => {
        const vals = [];
        r.eachCell({ includeEmpty: true }, (c, col) => { vals[col - 1] = cellText(c.value); });
        grid[i - 1] = vals;
      });
      return { name: ws.name, grid: grid.filter(Boolean) };
    });
  }

  // نبحث في أول 10 صفوف عن صف العناوين
  function findHeader(grid) {
    let best = { idx: -1, map: {}, score: 0 };
    for (let i = 0; i < Math.min(10, grid.length); i++) {
      const map = {};
      (grid[i] || []).forEach((h, col) => {
        if (h instanceof Date) return;
        const f = classify(h);
        if (f && map[f] === undefined) map[f] = col;
      });
      const score = Object.keys(map).length + (map.name !== undefined ? 2 : 0);
      if (score > best.score) best = { idx: i, map, score };
    }
    return best;
  }

  async function parseFile(file) {
    const sheets = await readGrid(file);
    let pick = null;
    for (const sh of sheets) {
      const h = findHeader(sh.grid);
      if (h.map.name !== undefined && (!pick || h.score > pick.h.score)) pick = { sh, h };
    }
    if (!pick) {
      // بدون عناوين: أول عمود فيه نص عربي يُعتبر الاسم
      const sh = sheets.find((s) => s.grid.length);
      if (!sh) throw new Error('empty');
      const col = (sh.grid[0] || []).findIndex((v) => /[ء-ي]/.test(String(v)));
      if (col < 0) throw new Error('noname');
      pick = { sh, h: { idx: -1, map: { name: col } } };
    }
    const { sh, h } = pick;
    const headers = sh.grid[h.idx] || [];
    const rows = [];
    for (const r of sh.grid.slice(h.idx + 1)) {
      if (!r) continue;
      const get = (f) => (h.map[f] === undefined ? '' : r[h.map[f]]);
      const name = String(get('name') || '').replace(/\s+/g, ' ').trim();
      if (!name || /^\d+$/.test(toWestern(name))) continue;
      const juz = parseInt(cleanDigits(get('juz')), 10);
      rows.push({
        name,
        nationalId: cleanDigits(get('nationalId')),
        phone: cleanPhone(get('phone')),
        guardianPhone: cleanPhone(get('guardianPhone')),
        birthDate: cleanDate(get('birthDate')),
        juz: isNaN(juz) ? 0 : Math.max(0, Math.min(30, juz)),
      });
    }
    const mapping = Object.entries(h.map).map(([f, col]) => ({ field: f, label: FIELDS[f], header: headers[col] != null ? String(headers[col]) : `العمود ${col + 1}` }));
    return { rows, mapping, sheet: sh.name, sheets: sheets.length };
  }

  return { parseFile, FIELDS, norm, cleanDate, cleanPhone };
})();
