import test from 'node:test';
import assert from 'node:assert/strict';

import { MESSAGES, getLanguage, setLanguage, t } from '../src/i18n.js';

test('English and Spanish dictionaries expose the same keys', () => {
  assert.deepEqual(Object.keys(MESSAGES.es).sort(), Object.keys(MESSAGES.en).sort());
});

test('t interpolates placeholders and follows the active language', () => {
  const original = getLanguage();
  setLanguage('en');
  assert.equal(
    t('verdict.window', { days: 28, start: 'A', now: 'B' }),
    'Window: 28 d from A · instant B'
  );
  setLanguage('es');
  assert.equal(
    t('verdict.window', { days: 28, start: 'A', now: 'B' }),
    'Ventana: 28 d desde A · instante B'
  );
  setLanguage(original);
});
