import { expect, test } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

/**
 * Blocks take a per-block colour under the redux colour themes, the same way flowchart
 * subgraphs do. `redux-color` is the default theme, so a block diagram drawn with no
 * theme set at all goes through this path.
 *
 * The unit tests pin the two halves separately — that `blockDB` hands out slots, and that
 * the stylesheet emits rules — but only a render proves the stamped `data-color-id`
 * actually meets the emitted selector on the element. That is exactly where this was
 * broken: both halves can be right while nothing on screen changes colour.
 */
const reduxThemes = ['redux', 'redux-color', 'redux-dark', 'redux-dark-color'] as const;

/** Five blocks, so the ordering is unambiguous and a reversed cycle would be obvious. */
const simple = `
  block-beta
    columns 3
    a["Fetch"] b["Validate"] c["Normalise"]
    d["Enrich"] e["Store"]
`;

/**
 * Every shape a block diagram can draw. A block diagram routes through far more shapes
 * than a flowchart subgraph does, and a shape the stylesheet forgets renders uncoloured
 * beside its tinted neighbours rather than failing in any visible way — so each one is
 * on screen here.
 */
const shapes = `
  block-beta
    columns 4
    sq["Square"] rn(("Circle")) di{"Diamond"} hx{{"Hexagon"}}
    st(["Stadium"]) sr[["Subroutine"]] lr[/"Lean"/] tr[/"Trapezoid"\\]
`;

/** A composite is a container and takes its own slot, before the blocks it holds. */
const composite = `
  block-beta
    columns 1
    outer["Before"]
    block:group
      columns 2
      inner1["One"] inner2["Two"]
    end
    tail["After"]
`;

/**
 * A space paints nothing and must not consume a slot — if it did, the colours after it
 * would shift for no visible reason.
 */
const spaced = `
  block-beta
    columns 3
    a["One"] space b["Two"]
    c["Three"] d["Four"] e["Five"]
`;

/**
 * Explicit user styling keeps winning over the palette: `style` becomes an inline
 * `style` attribute and none of the palette rules are `!important`. `b` stays green.
 */
const userStyled = `
  block-beta
    columns 2
    a["Palette"] b["Mine"]
    style b fill:#00ff00,stroke:#0000ff
`;

const diagrams = { simple, shapes, composite, spaced, 'user-styled': userStyled } as const;

test.describe('Block - Redux colour themes', () => {
  for (const theme of reduxThemes) {
    test.describe(`Theme: ${theme}`, () => {
      for (const [name, diagram] of Object.entries(diagrams)) {
        test(`should render ${name} blocks`, async ({ page }, testInfo) => {
          await imgSnapshotTest(page, testInfo, diagram, { theme, look: 'neo' });
        });
      }
    });
  }

  test('stamps a palette slot that the stylesheet actually matches', async ({ page }, testInfo) => {
    await renderGraph(page, testInfo, shapes, { theme: 'redux-color', look: 'neo' });

    const { stamped, matched } = await page.evaluate(() => {
      const svg = document.querySelector('svg[aria-roledescription]')!;
      const slots = [...svg.querySelectorAll('[data-color-id]')].map(
        (el) => el.getAttribute('data-color-id')!
      );
      const css = [...svg.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
      return {
        stamped: [...new Set(slots)],
        // A slot with no rule renders uncoloured — the failure this whole test exists for.
        matched: [...new Set(slots)].filter((slot) => css.includes(`[data-color-id="${slot}"]`)),
      };
    });

    expect(stamped.length).toBeGreaterThan(0);
    expect(matched).toEqual(stamped);
  });

  test('gives adjacent blocks different colours', async ({ page }, testInfo) => {
    // The point of the palette. One slot for everything would satisfy the test above
    // while looking exactly like the bug being fixed.
    await renderGraph(page, testInfo, simple, { theme: 'redux-color', look: 'neo' });

    const distinct = await page.evaluate(() => {
      const svg = document.querySelector('svg[aria-roledescription]')!;
      return new Set(
        [...svg.querySelectorAll('[data-color-id]')].map((el) => el.getAttribute('data-color-id'))
      ).size;
    });

    expect(distinct).toBeGreaterThan(1);
  });
});
