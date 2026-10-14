/**
 * scripts/preCommitCheck.js
 * Scans tracked files for likely secrets. Run manually or wire into a git hook.
 * Usage: node scripts/preCommitCheck.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const PATTERNS = [
  { name: 'MongoDB Atlas URI', regex: /mongodb\+srv:\/\/[^:]+:[^@]+@/ },
  { name: 'OpenAI key',        regex: /sk-[A-Za-z0-9]{20,}/ },
  { name: 'AWS access key',    regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private key block', regex: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: 'Generic JWT secret assignment', regex: /JWT_SECRET\s*=\s*['"]?[A-Za-z0-9_\-]{20,}/ },
];

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode']);
const IGNORE_FILES = new Set(['.env.example']);

const walk = (dir, acc = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
};

let files;
try {
  // Prefer git-tracked files (falls back to a full walk)
  const out = execSync('git ls-files', { cwd: ROOT }).toString();
  files = out.split('\n').filter(Boolean).map((f) => path.join(ROOT, f));
} catch {
  files = walk(ROOT);
}

let hits = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (IGNORE_FILES.has(path.basename(file))) continue;
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const { name, regex } of PATTERNS) {
    if (regex.test(content)) {
      console.error(`❌ ${name} pattern found in: ${rel}`);
      hits++;
    }
  }
}

if (hits === 0) {
  console.log('✅ No obvious secrets found.');
  process.exit(0);
} else {
  console.error(`\n🚨 ${hits} potential secret(s) detected. Do NOT commit until resolved.`);
  process.exit(1);
}