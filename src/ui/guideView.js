import { t } from '../i18n.js';

const SECTIONS = [
  ['guide.quickStart.title', 'guide.quickStart.body', true],
  ['guide.metrics.title', 'guide.metrics.body', false],
  ['guide.pole.title', 'guide.pole.body', false],
  ['guide.glossary.title', 'guide.glossary.body', false],
  ['guide.try.title', 'guide.try.body', false],
  ['guide.limits.title', 'guide.limits.body', false]
];

export function renderGuide(container) {
  if (!container) return;
  container.innerHTML = `
    <p class="guide-intro">${t('guide.intro')}</p>
    ${SECTIONS.map(
      ([titleKey, bodyKey, open]) => `
        <details class="guide-section"${open ? ' open' : ''}>
          <summary>${t(titleKey)}</summary>
          <div class="guide-body">${t(bodyKey)}</div>
        </details>
      `
    ).join('')}
  `;
}
