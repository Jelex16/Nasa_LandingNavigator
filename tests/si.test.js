import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const DATA = new URL('../public/data/', import.meta.url);
const readJson = (relative) =>
  JSON.parse(readFileSync(new URL(relative, DATA), 'utf8'));

test('AI (SI) use is disclosed in package and data metadata', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  assert.equal(pkg.siDisclosure?.assisted, true);

  const manifest = readJson('manifest.json');
  assert.equal(manifest.siDisclosure?.assisted, true);
  const jsonFiles = manifest.files.filter((file) => file.path.endsWith('.json'));
  assert.ok(jsonFiles.length > 0);
  for (const file of jsonFiles) {
    assert.equal(readJson(file.path).si?.assisted, true, file.path);
  }
});
