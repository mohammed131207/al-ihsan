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
      styleBody(row, { fill: i % 2 ? '#FAF8F3' : null });
    });
    if (!m.list.length) {
      ws.mergeCells(r, 1, r, 9);
      ws.getCell(r, 1).value = 'لا توجد جلسات مسجّلة في هذا الشهر';
      styleBody(ws.getRow(r));
      r++;
    }
    const tot = ws.getRow(r++);
    tot.values = ['المجموع', dayWord(m.sessions),'', '', m.newPages + m.reviewPages, '', m.errors, m.hints, ''];
    styleBody(tot, { bold: true, fill: '#E2EFEA' });

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

  async function monthWorkbook(data, students, ym, opts = {}) {
    await loadExcel();
    const color = data.settings.primary || '#0E5E4E';
    const wb = new ExcelJS.Workbook();
    wb.creator = 'الإحسان';
    wb.created = new Date();
    const used = new Set();

    if (students.length > 1) {
      const ws = wb.addWorksheet(sheetName('ملخص الحلقة', used), { views: [{ rightToLeft: true }] });
      ws.columns = [{ width: 20 }, { width: 12 }, { width: 12 }, { width: 11 }, { width: 11 }, { width: 10 }, { width: 10 }, { width: 14 }, { width: 13 }, { width: 13 }, { width: 40 }];
      title(ws, `ملخص ${data.halaqaName} — ${D.monthName(ym)}`, `عدد الطالبات: ${students.length}`, 11);
      const head = ws.getRow(4);
      head.values = ['الطالبة', 'أجزاء أول الشهر', 'أجزاء آخر الشهر', 'أوجه جديدة', 'أوجه مراجعة', 'أيام التسميع', 'اختبارات', 'الدرجات', 'أخطاء / تنبيهات', 'التقدير الغالب', 'آخر ملاحظة'];
      styleHeader(head, color);
      let r = 5;
      students.forEach((s, i) => {
        const m = Logic.monthSummary(data, s, ym);
        const last = m.notes[m.notes.length - 1];
        const row = ws.getRow(r++);
        row.values = [s.name, m.juzStart, m.juzEnd, m.newPages, m.reviewPages, m.sessions, m.tests.length, m.testScores.join(' ، ') || '—', `${m.errors} / ${m.hints}`, m.topGrade, opts.notes && last ? last.text : ''];
        styleBody(row, { fill: i % 2 ? '#FAF8F3' : null });
        row.getCell(1).font = { name: 'Arial', size: 11, bold: true };
      });
    }
    for (const s of students) studentSheet(wb, used, data, s, ym, color, opts);
    const buf = await wb.xlsx.writeBuffer();
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  async function saveFile(blob, filename, { preferShare = false, title = '' } = {}) {
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
    window.open(url, '_blank', 'noopener');
  }

  function backupBlob(account, data) {
    const payload = { app: 'halaqa', version: 1, exportedAt: new Date().toISOString(), teacher: account.name, data };
    return new Blob([JSON.stringify(payload)], { type: 'application/json' });
  }

  return { monthWorkbook, saveFile, whatsappText, entryText, openWhatsApp, backupBlob, phoneIntl, loadExcel };
})();
