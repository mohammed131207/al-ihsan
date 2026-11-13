// التصدير: Excel، رسالة واتساب، النسخة الاحتياطية
const Export = (() => {
  const ARGB = (hex) => 'FF' + hex.replace('#', '').toUpperCase();

  function sheetName(name, used) {
    let base = name.replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 28) || 'طالبة';
    let n = base, k = 2;
    while (used.has(n)) n = `${base} ${k++}`;
    used.add(n);
    return n;
  }

  function styleHeader(row, color) {
    row.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 11 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB(color) } };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c.border = border();
    });
    row.height = 30;
  }

  function border() {
    const s = { style: 'thin', color: { argb: 'FFCFC8B8' } };
    return { top: s, left: s, bottom: s, right: s };
  }

  function styleBody(row, opts = {}) {
    row.eachCell({ includeEmpty: true }, (c) => {
      c.font = { name: 'Arial', size: 11, bold: !!opts.bold };
      c.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      c.border = border();
      if (opts.fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB(opts.fill) } };
    });
  }

  function title(ws, text, sub, cols) {
    ws.mergeCells(1, 1, 1, cols);
    ws.getCell(1, 1).value = text;
    ws.getCell(1, 1).font = { name: 'Arial', size: 15, bold: true };
    ws.getCell(1, 1).alignment = { horizontal: 'right' };
    ws.getRow(1).height = 26;
    ws.mergeCells(2, 1, 2, cols);
    ws.getCell(2, 1).value = sub;
    ws.getCell(2, 1).font = { name: 'Arial', size: 11, color: { argb: 'FF45514C' } };
    ws.getCell(2, 1).alignment = { horizontal: 'right' };
  }

  function studentSheet(wb, used, data, s, ym, color, opts) {
    const m = Logic.monthSummary(data, s, ym);
    const ws = wb.addWorksheet(sheetName(s.name, used), { views: [{ rightToLeft: true, state: 'frozen', ySplit: 0 }] });
    ws.columns = [
      { width: 13 }, { width: 11 }, { width: 10 }, { width: 26 }, { width: 9 }, { width: 13 }, { width: 8 }, { width: 9 }, { width: 36 },
    ];
    title(ws, `تقرير ${s.name} — ${D.monthName(ym)}`, `${data.halaqaName} · من ${D.slash(m.start)} إلى ${D.slash(m.end)}`, 9);

    const sum = [
      ['الأجزاء المكتملة أول الشهر', m.juzStart], ['الأجزاء المكتملة آخر الشهر', m.juzEnd],
      ['أوجه الحفظ الجديد', m.newPages], ['أوجه المراجعة', m.reviewPages],
      ['أيام التسميع', m.sessions], ['عدد المراجعات', m.reviews.length],
      ['عدد الاختبارات', m.tests.length], ['درجات الاختبارات', m.testScores.join(' ، ') || '—'],
      ['مجموع الأخطاء', m.errors], ['مجموع التنبيهات', m.hints], ['التقدير الغالب', m.topGrade],
    ];
    if (m.firstNew) sum.splice(4, 0, ['مقطع الحفظ هذا الشهر', `من ${Quran.label(m.firstNew.fromSurah, m.firstNew.fromAyah)} إلى ${Quran.label(m.lastNew.toSurah, m.lastNew.toAyah)}`]);
    let r = 4;
    ws.getCell(r, 1).value = 'ملخص الشهر';
    ws.getCell(r, 1).font = { name: 'Arial', size: 12, bold: true };
    r++;
    for (const [k, v] of sum) {
      ws.mergeCells(r, 1, r, 3);
      ws.mergeCells(r, 4, r, 5);
      ws.getCell(r, 1).value = k;
      ws.getCell(r, 4).value = v;
      styleBody(ws.getRow(r));
      ws.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEBE3' } };
      ws.getCell(r, 1).font = { name: 'Arial', size: 11, bold: true };
      r++;
    }

    r += 1;
    ws.getCell(r, 1).value = 'السجل بالتواريخ';
    ws.getCell(r, 1).font = { name: 'Arial', size: 12, bold: true };
    r++;
    const head = ws.getRow(r);
    head.values = ['التاريخ', 'اليوم', 'النوع', 'المقطع', 'الأوجه', 'التقدير / الدرجة', 'أخطاء', 'تنبيهات', 'ملاحظة'];
    styleHeader(head, color);
    r++;
    m.list.forEach((e, i) => {
      const row = ws.getRow(r++);
      row.values = [D.slash(e.date), D.dow(e.date), TYPES[e.type], Logic.entryRange(e), e.type === 'test' ? '' : e.pages, Logic.entryGrade(e), e.errors || 0, e.hints || 0, e.note || ''];
      styleBody(row, { fill: i % 2 ? '#FFF7FA' : null });
    });
    if (!m.list.length) {
      ws.mergeCells(r, 1, r, 9);
      ws.getCell(r, 1).value = 'لا توجد جلسات مسجّلة في هذا الشهر';
      styleBody(ws.getRow(r));
      r++;
    }
    const tot = ws.getRow(r++);
    tot.values = ['المجموع', dayWord(m.sessions),'', '', m.newPages + m.reviewPages, '', m.errors, m.hints, ''];
    styleBody(tot, { bold: true, fill: '#FCE4EC' });

    if (opts.notes && m.notes.length) {
      r += 1;
      ws.getCell(r, 1).value = 'ملاحظات المحفّظة';
      ws.getCell(r, 1).font = { name: 'Arial', size: 12, bold: true };
      r++;
      for (const n of m.notes) {
        ws.getCell(r, 1).value = D.slash(n.date);
        ws.mergeCells(r, 2, r, 9);
        ws.getCell(r, 2).value = n.text;
        styleBody(ws.getRow(r));
        r++;
      }
    }
    if (opts.personal) {
      r += 1;
      ws.getCell(r, 1).value = 'البيانات الشخصية';
      ws.getCell(r, 1).font = { name: 'Arial', size: 12, bold: true };
      r++;
      for (const [k, v] of [['رقم الهوية', s.nationalId], ['الجوال', s.phone], ['جوال ولي الأمر', s.guardianPhone], ['تاريخ الميلاد', s.birthDate]]) {
        ws.mergeCells(r, 1, r, 2); ws.mergeCells(r, 3, r, 5);
        ws.getCell(r, 1).value = k; ws.getCell(r, 3).value = v || 'غير مُدخل';
        styleBody(ws.getRow(r));
        r++;
      }
    }
    return m;
  }

  // مكتبة Excel كبيرة، فنحمّلها فقط عند أول تصدير (وهي محفوظة على الجهاز للعمل بدون نت)
  let excelReady = null;
  function loadExcel() {
    if (window.ExcelJS) return Promise.resolve();
    if (!excelReady) excelReady = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'vendor/exceljs.min.js';
      s.onload = resolve;
      s.onerror = () => { excelReady = null; reject(new Error('excel lib failed')); };
      document.head.appendChild(s);
    });
    return excelReady;
  }

  function reportTitle(data, ym) {
    const [y, m] = ym.split('-').map(Number);
    return `تقرير متابعة حلقة المحفظة/ ${data.name || ''}${data.centerName ? `     ${data.centerName}` : ''} - شهر: ${MONTHS[m - 1]} /${y}م`;
  }

  // صف لكل طالبة بأعمدة الكشف المعتمد
  function templateRows(data, students, ym, opts = {}) {
    return students.map((s, i) => {
      const m = Logic.monthSummary(data, s, ym);
      // شهر مستورد من كشف المركز (قبل استعمال التطبيق) ولم تُسجَّل فيه جلسات: نعرض قيم الكشف كما هي
      const imp = s.imported && s.imported[ym];
      if (imp && !m.list.length && !m.absences.length) {
        return { n: i + 1, name: s.name, juz: imp.juz, startSurah: imp.startSurah, startAyah: imp.startAyah, endSurah: imp.endSurah, endAyah: imp.endAyah,
          newPages: imp.newPages === '' || isNaN(imp.newPages) ? imp.newPages : Number(imp.newPages), reviewPages: imp.reviewPages === '' || isNaN(imp.reviewPages) ? imp.reviewPages : Number(imp.reviewPages),
          single: imp.single, combined: imp.combined, absent: imp.absent, notes: opts.notes === false ? '' : imp.notes };
      }
      const notes = opts.notes === false ? '' : m.notes.map((n) => n.text).filter(Boolean).join('؛ ');
      return {
        n: i + 1, name: s.name, juz: m.juzEnd,
        startSurah: m.firstNew ? Quran.surah(m.firstNew.fromSurah).name : '', startAyah: m.firstNew ? m.firstNew.fromAyah : '',
        endSurah: m.lastNew ? Quran.surah(m.lastNew.toSurah).name : '', endAyah: m.lastNew ? m.lastNew.toAyah : '',
        newPages: m.newPages || '', reviewPages: m.reviewPages || '',
        single: Logic.testLabel(m.lastSingle), combined: Logic.testLabel(m.lastCombined),
        absent: m.absentDays, notes,
      };
    });
  }

  async function monthWorkbook(data, students, ym, opts = {}) {
    await loadExcel();
    const color = data.settings.primary || '#B8336A';
    const wb = new ExcelJS.Workbook();
    wb.creator = 'الإحسان';
    wb.created = new Date();
    const used = new Set();

    // الورقة الأولى: نفس كشف «تقرير متابعة حلقة» المعتمد في المراكز
    {
      const ws = wb.addWorksheet(sheetName('تقرير الحلقة', used), { views: [{ rightToLeft: true, state: 'frozen', ySplit: 3 }] });
      ws.columns = [{ width: 5 }, { width: 28 }, { width: 11 }, { width: 12 }, { width: 7 }, { width: 12 }, { width: 7 }, { width: 11 }, { width: 11 }, { width: 13 }, { width: 13 }, { width: 10 }, { width: 34 }];
      ws.mergeCells('A1:M1');
      const t = ws.getCell('A1');
      t.value = reportTitle(data, ym);
      t.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB(color) } };
      t.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 34;
      const h2 = ['م', 'اسم الطالب رباعي', 'الحفظ الكلي بالأجزاء', 'بداية الحفظ', '', 'نهاية الحفظ', '', 'عدد صفحات الحفظ', 'عدد صفحات المراجعة', 'آخر اختبار متفرق', 'آخر اختبار مجتمع', 'عدد أيام الغياب', 'ملحوظات'];
      const h3 = ['', '', '', 'السورة', 'الآية', 'السورة', 'الآية', '', '', '', '', '', ''];
      ws.getRow(2).values = h2; ws.getRow(3).values = h3;
      for (const c of ['A', 'B', 'C', 'H', 'I', 'J', 'K', 'L', 'M']) ws.mergeCells(`${c}2:${c}3`);
      ws.mergeCells('D2:E2'); ws.mergeCells('F2:G2');
      for (const r of [2, 3]) {
        const row = ws.getRow(r);
        row.height = 24;
        for (let c = 1; c <= 13; c++) {
          const cell = row.getCell(c);
          cell.font = { name: 'Arial', size: 11, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = border();
        }
      }
      templateRows(data, students, ym, opts).forEach((v, i) => {
        const row = ws.getRow(4 + i);
        row.values = [v.n, v.name, v.juz, v.startSurah, v.startAyah, v.endSurah, v.endAyah, v.newPages, v.reviewPages, v.single, v.combined, v.absent, v.notes];
        styleBody(row, { fill: i % 2 ? '#FFF7FA' : null });
        row.eachCell({ includeEmpty: true }, (c, col) => { if (col !== 2 && col !== 13) c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; });
      });
    }
    // بعدها ورقة تفصيلية لكل طالبة (يوماً بيوم)
    for (const s of students) studentSheet(wb, used, data, s, ym, color, opts);
    const buf = await wb.xlsx.writeBuffer();
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  async function saveFile(blob, filename, { preferShare = false, title = '' } = {}) {
    if (Native.isNative) return Native.shareFile(blob, filename, title);
    const file = new File([blob], filename, { type: blob.type });
    if (preferShare && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: title || filename });
        return 'shared';
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelled';
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  }

  function phoneIntl(phone, cc) {
    if (!phone) return '';
    let p = phone.replace(/[^\d+]/g, '');
    if (p.startsWith('+')) return p.slice(1);
    if (p.startsWith('00')) return p.slice(2);
    if (p.startsWith('0')) return (cc || '970') + p.slice(1);
    return p;
  }

  function whatsappText(data, s, ym) {
    const m = Logic.monthSummary(data, s, ym);
    const lines = [
      `السلام عليكم ورحمة الله،`,
      `تقرير ${s.name} لشهر ${D.monthName(ym)} من ${data.halaqaName}:`,
      ``,
      `• الأجزاء المكتملة: ${m.juzEnd}${m.juzEnd > m.juzStart ? ` (أتمّت ${juzWord(m.juzEnd - m.juzStart)} هذا الشهر)` : ''}`,
      `• الحفظ الجديد: ${pageWord(m.newPages)}${m.firstNew ? ` (من ${Quran.label(m.firstNew.fromSurah, m.firstNew.fromAyah)} إلى ${Quran.label(m.lastNew.toSurah, m.lastNew.toAyah)})` : ''}`,
      `• المراجعة: ${pageWord(m.reviewPages)}`,
      `• أيام التسميع: ${m.sessions}`,
    ];
    if (m.tests.length) lines.push(`• الاختبارات: ${m.tests.map((t) => `${Logic.entryRange(t)} (${t.score})`).join('، ')}`);
    lines.push(`• التقدير الغالب: ${m.topGrade}`);
    const lastNote = m.notes[m.notes.length - 1];
    if (lastNote) lines.push('', `ملاحظة المحفّظة: ${lastNote.text}`);
    lines.push('', 'بارك الله فيها ونفع بها.');
    return lines.join('\n');
  }

  function entryText(data, s, e) {
    const parts = [`السلام عليكم، تسميع ${s.name} اليوم (${D.long(e.date)}):`, `${TYPES[e.type]}: ${Logic.entryRange(e)}`, `التقدير: ${Logic.entryGrade(e)}`];
    if (e.type !== 'test') parts.push(`الأخطاء: ${e.errors || 0} · التنبيهات: ${e.hints || 0}`);
    if (e.note) parts.push(`ملاحظة: ${e.note}`);
    return parts.join('\n');
  }

  function openWhatsApp(text, phone, cc) {
    const p = phoneIntl(phone, cc);
    const url = `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
    if (Native.isNative) Native.openUrl(url); else window.open(url, '_blank', 'noopener');
  }

  // PDF كملف (للتطبيق على أندرويد حيث لا توجد نافذة طباعة): نصوّر كل ورقة A4 ونجمعها في ملف واحد
  let pdfReady = null;
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  // صفحة صفحة: نرسم ورقة واحدة فقط في كل مرة ثم نحذفها، حتى لا تمتلئ ذاكرة الجوال مع 25 طالبة أو أكثر
  async function pagesToPdf(htmlPages, onProgress, { landscape = false } = {}) {
    const PW = landscape ? 297 : 210, PH = landscape ? 210 : 297, PX = landscape ? 1123 : 794;
    if (!pdfReady) pdfReady = Promise.all([loadScript('vendor/html2canvas.min.js'), loadScript('vendor/jspdf.umd.min.js')]).catch((e) => { pdfReady = null; throw e; });
    await pdfReady;
    await document.fonts.ready;
    const holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = `position:absolute;top:0;left:0;width:${PX}px;z-index:-1;pointer-events:none;`;
    document.body.appendChild(holder);
    const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: landscape ? 'landscape' : 'portrait', compress: true });
    try {
      for (let i = 0; i < htmlPages.length; i++) {
        if (onProgress) onProgress(i + 1, htmlPages.length);
        holder.innerHTML = htmlPages[i];
        const el = holder.firstElementChild;
        el.style.margin = '0';
        el.style.boxShadow = 'none';
        await new Promise((r) => setTimeout(r, 30));
        const canvas = await window.html2canvas(el, { scale: 1.6, backgroundColor: '#FFFFFF', logging: false, windowWidth: PX, scrollX: 0, scrollY: -window.scrollY });
        if (i) pdf.addPage();
        const ratio = canvas.height / canvas.width;
        const w = ratio * PW > PH ? PH / ratio : PW;
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', (PW - w) / 2, 0, w, w * ratio);
        canvas.width = 0; canvas.height = 0;
      }
    } finally {
      holder.remove();
    }
    return pdf.output('blob');
  }

  function backupBlob(account, data) {
    const payload = { app: 'halaqa', version: 1, exportedAt: new Date().toISOString(), teacher: account.name, data };
    return new Blob([JSON.stringify(payload)], { type: 'application/json' });
  }

  return { monthWorkbook, saveFile, whatsappText, entryText, openWhatsApp, backupBlob, phoneIntl, loadExcel, pagesToPdf, templateRows, reportTitle };
})();
