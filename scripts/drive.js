// يجهّز مجلد «ملفات-الدرايف»: دليل PDF، بطاقة QR، نموذج الاستيراد، ونسخة مضغوطة من التطبيق
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const QRCode = require('qrcode');

const URL = 'https://mohammed131207.github.io/al-ihsan/';
const root = path.join(__dirname, '..');
const tpl = path.join(__dirname, 'drive');
const out = path.join(root, 'ملفات-الدرايف');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const qr = await QRCode.toDataURL(URL, { margin: 1, width: 600, color: { dark: '#0E5E4E', light: '#FFFFFF' }, errorCorrectionLevel: 'M' });
  await QRCode.toFile(path.join(out, 'رمز-QR-للتطبيق.png'), URL, { margin: 2, width: 800, color: { dark: '#0E5E4E', light: '#FFFFFF' } });

  const fill = (name) => {
    const html = fs.readFileSync(path.join(tpl, name), 'utf8').replaceAll('{{QR}}', qr).replaceAll('{{URL}}', URL);
    const p = path.join(tpl, '_' + name);
    fs.writeFileSync(p, html);
    return 'file:///' + p.replace(/\\/g, '/');
  };

  const run = (args) => execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=4000', ...args], { stdio: 'pipe' });
  run([`--print-to-pdf=${path.join(out, 'دليل-استخدام-الإحسان.pdf')}`, '--no-pdf-header-footer', fill('guide.html')]);
  run([`--screenshot=${path.join(out, 'بطاقة-مشاركة-التطبيق.png')}`, '--window-size=1080,1350', '--hide-scrollbars', fill('card.html')]);
  fs.rmSync(path.join(tpl, '_guide.html'));
  fs.rmSync(path.join(tpl, '_card.html'));

  fs.copyFileSync(path.join(root, 'samples', 'نموذج-استيراد-الطالبات.xlsx'), path.join(out, 'نموذج-استيراد-الطالبات.xlsx'));
  fs.writeFileSync(path.join(out, 'رابط التطبيق.txt'), `الإحسان — لتحفيظ القرآن الكريم\r\n\r\nرابط التطبيق:\r\n${URL}\r\n\r\nافتحيه مرة واحدة بالإنترنت ثم ثبّتيه على الشاشة الرئيسية، وبعدها يعمل بدون إنترنت.\r\n`);

  const zip = path.join(out, 'نسخة-التطبيق-الإحسان.zip');
  if (fs.existsSync(zip)) fs.rmSync(zip);
  execFileSync('powershell.exe', ['-NoProfile', '-Command', `Compress-Archive -Path '${path.join(root, 'app')}\\*' -DestinationPath '${zip}' -Force`], { stdio: 'pipe' });

  for (const f of fs.readdirSync(out)) console.log(f.padEnd(40), (fs.statSync(path.join(out, f)).size / 1024).toFixed(0) + ' KB');
})();
