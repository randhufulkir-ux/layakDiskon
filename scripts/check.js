const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const checks = [];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Required files
const jsFiles = ['js/core.js', 'js/calculation.js', 'js/actions.js', 'js/preferences.js'];
for (const f of ['index.html', ...jsFiles, 'css/tailwind.css', 'css/custom.css']) {
  const full = path.join(root, f);
  assert(fs.existsSync(full), `Missing file: ${f}`);
  assert(fs.statSync(full).size > 0, `Empty file: ${f}`);
}

// JS syntax check
for (const f of jsFiles) {
  execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'inherit' });
}

// HTML references script & css
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const f of jsFiles) {
  assert(html.includes(f), `index.html does not reference ${f}`);
}
assert(html.includes('css/tailwind.css'), 'index.html does not reference css/tailwind.css');

// All onclick handlers resolve to functions defined in JS modules
const js = jsFiles.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const defined = new Set();
const fnRegex = /function\s+([a-zA-Z0-9_]+)/g;
let fm;
while ((fm = fnRegex.exec(js)) !== null) defined.add(fm[1]);

const handlers = new Set();
const onClickRegex = /onclick="([a-zA-Z0-9_]+)\(/g;
let om;
while ((om = onClickRegex.exec(html)) !== null) handlers.add(om[1]);
for (const h of handlers) {
  assert(defined.has(h), `Undefined onclick handler: ${h}`);
}

// Hanya tiga fitur inti yang boleh ada di navigasi
for (const removed of ['panduan', 'pengaturan']) {
  assert(!html.includes(`tab-${removed}`), `Fitur "${removed}" seharusnya sudah dihapus`);
}

console.log(`Checks passed (${handlers.size} handlers, ${defined.size} functions).`);
