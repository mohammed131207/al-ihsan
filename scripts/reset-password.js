// للمسؤول: تغيير كلمة مرور محفّظة نسيتها وليس لها بريد استعادة.
// يحتاج أن يكون firebase-tools مسجّل الدخول بحساب مالك المشروع (dosegaza2@gmail.com).
// الاستخدام: npm run reset-password -- --username "إحسان" --pass "كلمة-جديدة"
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : ''; };
const USERNAME = arg('username'), PASS = arg('pass'), OWNER = arg('owner') || 'dosegaza2@gmail.com';
if (!USERNAME || PASS.length < 6) { console.error('usage: --username "..." --pass "at least 6 chars"'); process.exit(1); }

const PROJECT = 'al-ihsan-quran';
const Import = new Function(fs.readFileSync(path.join(__dirname, '..', 'app', 'js', 'import.js'), 'utf8') + ';return Import;')();
const key = crypto.createHash('sha256').update('alihsan:' + Import.norm(USERNAME)).digest('hex');
const internalEmail = `u${key.slice(0, 28)}@alihsan.app`;

(async () => {
  const auth = require(path.join(execSync('npm root -g').toString().trim(), 'firebase-tools', 'lib', 'auth.js'));
  const acct = auth.findAccountByEmail(OWNER);
  if (!acct) throw new Error(`firebase-tools is not logged in as ${OWNER}`);
  const { access_token } = await auth.getAccessToken(acct.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  const call = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json', 'x-goog-user-project': PROJECT }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j.error || j));
    return j;
  };
  // بريد الحساب: من دليل الأسماء إن وُجد، وإلا البريد الداخلي
  const dir = await (await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/usernames/${key}`)).json();
  const emails = [...new Set([dir.fields && dir.fields.email && dir.fields.email.stringValue, internalEmail].filter(Boolean))];
  const found = await call(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:lookup`, { email: emails });
  const user = (found.users || [])[0];
  if (!user) throw new Error('no account with this username');
  await call(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, { localId: user.localId, password: PASS });
  console.log(`password changed for "${USERNAME}"`);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
