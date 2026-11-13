// ينسخ المكتبات والخطوط من node_modules إلى app/vendor حتى يعمل التطبيق بدون إنترنت
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nm = path.join(root, 'node_modules');
const out = path.join(root, 'app', 'vendor');
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });

fs.copyFileSync(path.join(nm, 'exceljs/dist/exceljs.min.js'), path.join(out, 'exceljs.min.js'));
fs.copyFileSync(path.join(nm, 'html2canvas/dist/html2canvas.min.js'), path.join(out, 'html2canvas.min.js'));
fs.copyFileSync(path.join(nm, 'jspdf/dist/jspdf.umd.min.js'), path.join(out, 'jspdf.umd.min.js'));

// نسخة Firebase الحديثة (ESM) مع تحويل روابط gstatic إلى ملفات محلية حتى يعمل بدون نت
fs.mkdirSync(path.join(out, 'fb'), { recursive: true });
const fbVersion = require(path.join(nm, 'firebase', 'package.json')).version;
const gstatic = `https://www.gstatic.com/firebasejs/${fbVersion}/firebase-app.js`;
for (const f of ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js']) {
  fs.writeFileSync(path.join(out, 'fb', f), fs.readFileSync(path.join(nm, 'firebase', f), 'utf8').split(gstatic).join('./firebase-app.js'));
}

const fonts = [
  ['ibm-plex-sans-arabic', ['arabic', 'latin'], [400, 500, 600]],
  ['readex-pro', ['arabic', 'latin'], [500, 600, 700]],
  ['amiri', ['arabic'], [700]],
];
for (const [pkg, subsets, weights] of fonts) {
  for (const s of subsets) for (const w of weights) {
    const f = `${pkg}-${s}-${w}-normal.woff2`;
    fs.copyFileSync(path.join(nm, '@fontsource', pkg, 'files', f), path.join(out, 'fonts', f));
  }
}
console.log('vendor files copied to', out);
