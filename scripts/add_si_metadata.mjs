import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');

const SI_DISCLOSURE = {
  assisted: true,
  tools: 'Gemini-family AI coding assistant',
  scope: 'AI-assisted data-generation script; NASA source data',
  details: 'docs/SI_USAGE.md'
};

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (!entry.isFile() || !entry.name.endsWith('.json')) return [];
    return entry.name === 'manifest.json' ? [] : [full];
  });
}

let updated = 0;
const files = walk(DATA);
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const payload = JSON.parse(original);
  payload.si = SI_DISCLOSURE;
  const compact = !original.trim().includes('\n');
  const text = compact
    ? `${JSON.stringify(payload)}${original.endsWith('\n') ? '\n' : ''}`
    : `${JSON.stringify(payload, null, 2)}\n`;
  if (text !== original) {
    fs.writeFileSync(file, text);
    updated += 1;
  }
}

console.log(
  JSON.stringify({ files: files.length, updated, disclosure: SI_DISCLOSURE }, null, 2)
);
