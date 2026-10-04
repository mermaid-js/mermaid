import { expect, test } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

/**
 * Composite blocks take a per-container colour under the redux colour themes, the same
 * way flowchart subgraphs do — one counter over containers, nothing on the plain shapes.
 * Block is not one of the diagram types that default to a colour theme, so every test here
 * names one explicitly.
 *
 * The unit tests pin the two halves separately — that `blockDB` hands out slots, and that
 * the stylesheet emits rules — but only a render proves the stamped `data-color-id`
 * actually meets the emitted selector on the element. That is exactly where this was
 * broken: both halves can be right while nothing on screen changes colour.
 */
const reduxThemes = ['redux', 'redux-color', 'redux-dark', 'redux-dark-color'] as const;

/** Three containers, so the ordering is unambiguous and a reversed cycle would show. */
const composites = `
  block-beta
    columns 1
    block:ingest
      columns 2
      a["Fetch"] b["Validate"]
    end
    block:transform
      columns 2
      c["Normalise"] d["Enrich"]
    end
    block:store
      e["Warehouse"]
    end
`;

/** Nesting, to show the palette applying at more than one depth. */
const nested = `
  block-beta
    columns 1
    block:outer
      columns 1
      block:inner1
        a["one"] b["two"]
      end
      block:inner2
        c["three"]
      end
    end
    block:sibling
      d["four"]
    end
`;

/**
 * The plain shapes are deliberately left alone, exactly as a flowchart leaves its nodes
 * alone. Every shape a block diagram can draw is here, and none of them should pick up a
 * palette colour — only the container around them.
 */
const shapesInsideAContainer = `
  block-beta
    columns 1
    block:shapes
      columns 4
      sq["Square"] rn(("Circle")) di{"Diamond"} hx{{"Hexagon"}}
      st(["Stadium"]) sr[["Subroutine"]] lr[/"Lean"/] tr[/"Trapezoid"\\]
    end
`;

/** A flat diagram has no containers, so nothing takes a palette colour. */
const flat = `
  block-beta
    columns 3
    a["One"] b["Two"] c["Three"]
`;

/**
 * Explicit user styling keeps winning over the palette: `style` becomes an inline
 * `style` attribute and none of the palette rules are `!important`.
 */
const userStyled = `
  block-beta
    columns 1
    block:palette
      a["Palette"]
    end
    block:mine
      b["Mine"]
    end
    style mine fill:#00ff00,stroke:#0000ff
`;

const diagrams = {
  composites,
  nested,
  'shapes-inside-a-container': shapesInsideAContainer,
  flat,
  'user-styled': userStyled,
} as const;

test.describe('Block - Redux colour themes', () => {
  for (const theme of reduxThemes) {
    test.describe(`Theme: ${theme}`, () => {
      for (const [name, diagram] of Object.entries(diagrams)) {
        test(`should render ${name}`, async ({ page }, testInfo) => {
          await imgSnapshotTest(page, testInfo, diagram, { theme, look: 'neo' });
        });
      }
    });
  }

  test('stamps a palette slot that the stylesheet actually matches', async ({ page }, testInfo) => {
    await renderGraph(page, testInfo, composites, { theme: 'redux-color', look: 'neo' });

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

  test('gives adjacent containers different colours', async ({ page }, testInfo) => {
    // The point of the palette. One slot for everything would satisfy the test above
    // while looking exactly like the bug being fixed.
    await renderGraph(page, testInfo, composites, { theme: 'redux-color', look: 'neo' });

    const distinct = await page.evaluate(() => {
      const svg = document.querySelector('svg[aria-roledescription]')!;
      return new Set(
        [...svg.querySelectorAll('[data-color-id]')].map((el) => el.getAttribute('data-color-id'))
      ).size;
    });

    expect(distinct).toBeGreaterThan(1);
  });

  test('leaves the plain shapes without a slot', async ({ page }, testInfo) => {
    // Parity with the flowchart, which colours its subgraphs and never its nodes. Without
    // this, widening the selectors later would go unnoticed.
    await renderGraph(page, testInfo, shapesInsideAContainer, {
      theme: 'redux-color',
      look: 'neo',
    });

    const stampedIds = await page.evaluate(() => {
      const svg = document.querySelector('svg[aria-roledescription]')!;
      return [...svg.querySelectorAll('[data-color-id]')].map((el) => el.id || '');
    });

    // One container, eight shapes inside it: exactly one element carries a slot.
    expect(stampedIds).toHaveLength(1);
  });
});
