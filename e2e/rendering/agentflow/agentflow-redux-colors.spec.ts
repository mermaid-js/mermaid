import { test, expect } from '@playwright/test';
/**
 * Colour is asserted from COMPUTED STYLE, not from the stylesheet text.
 *
 * Checking that the emitted CSS contains a selector passes even when the selector matches
 * nothing — which is exactly how three separate bugs survived here: a hook wired to a
 * function the renderer never calls, a descendant combinator where the attribute and the
 * class sit on the same element, and a kind read off the shape when two kinds share one
 * shape. Only reading back the painted stroke catches those.
 */
import { readFileSync } from 'node:fs';
import { renderGraph } from '../../helpers/util.ts';
const src = readFileSync(
  'e2e/platform/dev-diagrams/diagrams/agentflow/15-support-triage.mmd',
  'utf8'
);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const probe = (page: any) =>
  page.evaluate(() => {
    const svg = document.querySelector('svg[aria-roledescription]')!;
    const rows: any[] = [];
    for (const el of svg.querySelectorAll('[class*="af-kind-"],[data-color-id]')) {
      const tag = el.querySelector('rect,path,polygon');
      if (!tag) continue;
      const kind = [...el.classList].find((c) => c.startsWith('af-kind-'));
      rows.push({
        marker: kind ?? `slot:${el.getAttribute('data-color-id')}`,
        stroke: getComputedStyle(tag).stroke,
      });
    }
    return rows;
  });

test('redux-color paints every kind and every container distinctly', async ({ page }, testInfo) => {
  await renderGraph(page, testInfo, esc(src), { theme: 'redux-color', look: 'neo' });
  const by = new Map<string, string>();
  for (const r of await probe(page)) by.set(r.marker, r.stroke);
  // Seven kinds and four containers, each its own colour: a single shared colour would
  // look exactly like the bug this fixes.
  expect(by.size, 'markers found').toBeGreaterThan(6);
  expect(new Set(by.values()).size, 'every marker its own colour').toBe(by.size);
});

test('default theme leaves the markers inert', async ({ page }, testInfo) => {
  await renderGraph(page, testInfo, esc(src), { theme: 'default', look: 'neo' });
  const n = await page.evaluate(() => {
    const svg = document.querySelector('svg[aria-roledescription]')!;
    const el = svg.querySelector('[class*="af-kind-"]');
    const tag = el?.querySelector('rect,path,polygon');
    return {
      count: svg.querySelectorAll('[class*="af-kind-"]').length,
      stroke: tag ? getComputedStyle(tag).stroke : 'n/a',
      slots: svg.querySelectorAll('[data-color-id]').length,
    } as any;
  });
  // The markers are inert rather than absent: `getData()` runs before the diagram's theme
  // is settled, so the class cannot be gated there. `genColor` emits no rules off-palette,
  // which is the gate that matters.
  expect(n.slots, 'no container slots stamped off-palette').toBe(0);
  expect(n.stroke, 'nodes keep the theme colour').not.toBe('rgb(232, 121, 249)');
});
