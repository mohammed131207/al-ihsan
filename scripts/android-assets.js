// يولّد أيقونات أندرويد وشاشة البداية وأيقونة الإشعار من icon.svg
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');
const BG = '#B8336A';
const PAPER = '#FFF6F8';

// الرمز بدون الخلفية: النجمة والمصحف فقط (للأيقونة المتكيفة)
const EMBLEM = `
  <polygon points="256,72 309.8,126 386,126 386,202.2 440,256 386,309.8 386,386 309.8,386 256,440 202.2,386 126,386 126,309.8 72,256 126,202.2 126,126 202.2,126"
    fill="#C4407A" stroke="#F7D58E" stroke-width="12" stroke-linejoin="round"/>
  <g transform="translate(256 266) scale(0.6) translate(-256 -271)" fill="none" stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <path d="M256 168c-36-27-90-36-144-27v234c54-9 108 0 144 27 36-27 90-36 144-27V141c-54-9-108 0-144 27z"/><path d="M256 168v234"/>
  </g>`;
const svg = (body, vb = '0 0 512 512') => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`);

// الأيقونة المتكيفة: 108dp والمساحة الآمنة 66dp في الوسط، فنصغّر الرمز
const foreground = svg(`<g transform="translate(256 256) scale(0.6) translate(-256 -256)">${EMBLEM}</g>`);
const legacy = fs.readFileSync(path.join(root, 'app', 'icons', 'icon.svg'));
const round = svg(`<circle cx="256" cy="256" r="256" fill="${BG}"/><g transform="translate(256 256) scale(0.82) translate(-256 -256)">${EMBLEM}</g>`);
// أيقونة الإشعار: أبيض على شفاف (المصحف فقط)
const notify = svg(`<g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5z"/><path d="M12 6v13"/></g>`, '0 0 24 24');

const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

(async () => {
  for (const [d, k] of Object.entries(dens)) {
    const dir = path.join(res, `mipmap-${d}`);
    fs.mkdirSync(dir, { recursive: true });
    await sharp(legacy).resize(Math.round(48 * k), Math.round(48 * k)).png().toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(round).resize(Math.round(48 * k), Math.round(48 * k)).png().toFile(path.join(dir, 'ic_launcher_round.png'));
    await sharp(foreground).resize(Math.round(108 * k), Math.round(108 * k)).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
    const nd = path.join(res, `drawable-${d}`);
    fs.mkdirSync(nd, { recursive: true });
    await sharp(notify).resize(Math.round(24 * k), Math.round(24 * k)).png().toFile(path.join(nd, 'ic_stat_notify.png'));
  }
  fs.writeFileSync(path.join(res, 'values', 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`);

  // شاشة البداية: الأيقونة في الوسط على خلفية بلون الورق
  const splashFiles = [];
  for (const dir of fs.readdirSync(res)) {
    const f = path.join(res, dir, 'splash.png');
    if (fs.existsSync(f)) splashFiles.push(f);
  }
  for (const f of splashFiles) {
    const { width, height } = await sharp(f).metadata();
    const size = Math.round(Math.min(width, height) * 0.28);
    const icon = await sharp(legacy).resize(size, size).png().toBuffer();
    await sharp({ create: { width, height, channels: 4, background: PAPER } })
      .composite([{ input: icon, gravity: 'center' }]).png().toFile(f + '.tmp');
    fs.renameSync(f + '.tmp', f);
  }
  console.log('android assets ok:', splashFiles.length, 'splash files');
})();
