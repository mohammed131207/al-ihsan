// ينسخ المكتبات والخطوط من node_modules إلى app/vendor حتى يعمل التطبيق بدون إنترنت
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nm = path.join(root, 'node_modules');
const out = path.join(root, 'app', 'vendor');
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });

fs.copyFileSync(path.join(nm, 'exceljs/dist/exceljs.min.js'), path.join(out, 'exceljs.min.js'));

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
