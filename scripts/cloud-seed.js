// ينشئ حساب محفّظة على Firebase ويرفع له بيانات seed.json (طالبات، ملاحظات...) مرة واحدة.
// الاستخدام: node scripts/cloud-seed.js --username "إحسان" --name "..." --center "..." --halaqa "..." --pass "..." [--seed app/seed.json]
// يستخدم نفس طريقة التطبيق في تحويل اسم المستخدم إلى بريد داخلي، فتدخل المحفّظة بنفس الاسم وكلمة المرور.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, writeBatch, setDoc } = require('firebase/firestore');

const arg = (k, d = '') => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const USERNAME = arg('username'), PASS = arg('pass'), NAME = arg('name', USERNAME), CENTER = arg('center'), HALAQA = arg('halaqa', 'حلقتي');
const SEED = arg('seed', path.join(__dirname, '..', 'app', 'seed.json'));
if (!USERNAME || !PASS) { console.error('--username and --pass are required'); process.exit(1); }

const Import = new Function(fs.readFileSync(path.join(__dirname, '..', 'app', 'js', 'import.js'), 'utf8') + ';return Import;')();
const emailFor = (u) => `u${crypto.createHash('sha256').update('alihsan:' + Import.norm(u)).digest('hex').slice(0, 28)}@alihsan.app`;

const app = initializeApp({
  apiKey: 'AIzaSyB5yuU58F0HGdhe6SvVAbIlJtpGPkZGBqw',
  authDomain: 'al-ihsan-quran.firebaseapp.com',
  projectId: 'al-ihsan-quran',
  appId: '1:622707989773:web:7317fc52b8bb8f964d2444',
});

(async () => {
  const auth = getAuth(app);
  let user;
  try { user = (await createUserWithEmailAndPassword(auth, emailFor(USERNAME), PASS)).user; console.log('created account'); }
  catch (e) {
    if (!String(e.code).includes('email-already-in-use')) throw e;
    user = (await signInWithEmailAndPassword(auth, emailFor(USERNAME), PASS)).user; console.log('account exists, signed in');
  }
  const db = getFirestore(app);
  const seed = fs.existsSync(SEED) ? JSON.parse(fs.readFileSync(SEED, 'utf8')).data : { students: [], notes: [], entries: [], reminders: [] };
  const now = new Date().toISOString();
  const halaqa = { id: 'h' + crypto.randomBytes(5).toString('hex'), name: HALAQA, created: now };
  await setDoc(doc(db, 'users', user.uid), { name: NAME, username: USERNAME, centerName: CENTER, settings: seed.settings || { primary: '#0E5E4E', countryCode: '970' }, dismissed: [], created: now }, { merge: true });
  const items = [['halaqat', halaqa]];
  for (const s of seed.students || []) items.push(['students', { ...s, halaqaId: halaqa.id }]);
  for (const c of ['entries', 'notes', 'reminders']) for (const x of seed[c] || []) items.push([c, x]);
  for (let i = 0; i < items.length; i += 400) {
    const b = writeBatch(db);
    for (const [c, x] of items.slice(i, i + 400)) b.set(doc(db, 'users', user.uid, c, x.id), JSON.parse(JSON.stringify(x)));
    await b.commit();
  }
  console.log(`uploaded: ${(seed.students || []).length} students, ${(seed.notes || []).length} notes, halaqa "${HALAQA}"`);
  process.exit(0);
})().catch((e) => { console.error('ERR', e.code || '', e.message); process.exit(1); });
