import { expect, test, type Page } from '@playwright/test';
import { renderGraph } from '../helpers/util.ts';

/**
 * Two diagrams on one page must resolve their appearance independently: `er` opts in to
 * `redux-color`/`neo`, `block` does not. The unit tests assert the resolved config object,
 * which cannot see whether the resolved theme actually reached the stylesheet — that is
 * `createUserStyles`, and it runs per render, from the config in scope at the time.
 *
 * `data-look` and `data-color-id` are the two markers the renderers stamp, the second only
 * under a colour theme, so between them they pin both halves without hardcoding a palette.
 */
const listed = `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
`;

const unlisted = `block-beta
  columns 1
  block:group
    A["one"]
    B["two"]
  end
`;

/** Per-SVG appearance markers, in the order the diagrams appear on the page. */
const appearanceOf = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('svg[aria-roledescription]')].map((svg) => ({
      role: svg.getAttribute('aria-roledescription'),
      looks: [
        ...new Set(
          [...svg.querySelectorAll('[data-look]')].map((el) => el.getAttribute('data-look'))
        ),
      ],
      colorSlots: svg.querySelectorAll('[data-color-id]').length,
    }))
  );

test.describe('Per-diagram appearance defaults', () => {
  test('gives each diagram on the page its own default theme and look', async ({
    page,
  }, testInfo) => {
    await renderGraph(page, testInfo, [listed, unlisted], {
      screenshot: false,
      logLevel: 0,
      name: 'per-diagram-appearance-defaults',
    });

    const [er, block] = await appearanceOf(page);

    // `er` opted in: neo look, and a palette slot on every entity box.
    expect(er.looks).toEqual(['neo']);
    expect(er.colorSlots).toBeGreaterThan(0);

    // `block` did not: classic look, and no palette at all under the `default` theme.
    expect(block.looks).toEqual(['classic']);
    expect(block.colorSlots).toBe(0);
  });

  test('lets a global look from initialize() override the diagram default', async ({
    page,
  }, testInfo) => {
    await renderGraph(page, testInfo, [listed, unlisted], {
      screenshot: false,
      logLevel: 0,
      name: 'per-diagram-appearance-global-look',
      look: 'classic',
    });

    const [er, block] = await appearanceOf(page);
    expect(er.looks).toEqual(['classic']);
    expect(block.looks).toEqual(['classic']);
  });

  test('scopes a look from initialize() to one diagram type', async ({ page }, testInfo) => {
    await renderGraph(page, testInfo, [listed, unlisted], {
      screenshot: false,
      logLevel: 0,
      name: 'per-diagram-appearance-scoped-look',
      look: 'classic',
      er: { look: 'handDrawn' },
    });

    const [er, block] = await appearanceOf(page);
    // The more specific of the two things the user said wins, for that diagram only.
    expect(er.looks).toEqual(['handDrawn']);
    expect(block.looks).toEqual(['classic']);
  });

  test('lets one diagram set its own theme in frontmatter without moving the other', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      [`---\nconfig:\n  theme: default\n---\n${listed}`, unlisted],
      { screenshot: false, logLevel: 0, name: 'per-diagram-appearance-frontmatter' }
    );

    const [er, block] = await appearanceOf(page);
    // Frontmatter outranks the diagram default, so the palette goes away for `er` alone.
    expect(er.colorSlots).toBe(0);
    expect(block.colorSlots).toBe(0);
    expect(block.looks).toEqual(['classic']);
  });
});
