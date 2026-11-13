/**
 * The per-item palette is opt-in per diagram: shapes and containers stamp a
 * `data-color-id` slot via `stampColorSlot`, and a diagram renders colour only if its
 * stylesheet emits the matching rules.
 *
 * These assertions are about the gate, not the colours: a stylesheet must stay silent for
 * every theme outside the colour pair, must emit one rule per palette slot inside it, and
 * must never outrank a user's own styling.
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as configApi from '@mermaid-js/core/config.js';
import themes from '@mermaid-js/core/themes/index.js';
import './mermaid.js';
import { stylesOf } from './tests/stylesOf.js';
import {
  COLOR_THEMES,
  MAX_COLOR_SLOTS,
  colorSlotCount,
  paletteSlotCount,
} from '@mermaid-js/core/diagrams/common/colorThemeGate.js';

/** `swimlanes` appends its own lane rules to flowchart's, so it is listed separately. */
const STYLESHEETS = {
  class: await stylesOf('classDiagram'),
  er: await stylesOf('er'),
  flowchart: await stylesOf('flowchart-v2'),
  requirement: await stylesOf('requirement'),
  state: await stylesOf('stateDiagram'),
  swimlanes: await stylesOf('swimlane'),
  timeline: await stylesOf('timeline'),
} as const;

/**
 * Which stylesheets emit `[data-color-id]` slot rules. `timeline` is palette-aware but
 * colours `.section-N` classes directly rather than stamping slots, so the slot-shaped
 * assertions do not apply to it — only the crash-safety pass at the bottom does.
 */
const SLOT_STYLESHEETS = (
  ['class', 'er', 'flowchart', 'requirement', 'state', 'swimlanes'] as const
).filter((name) => name in STYLESHEETS);

const COLOUR_THEMES = [...COLOR_THEMES];

/**
 * Derived rather than listed. A hardcoded list stops being exhaustive the moment someone
 * registers a new theme — the same "widened without anyone noticing" failure this file
 * exists to catch, one level up.
 */
const PLAIN_THEMES = Object.keys(themes).filter((name) => !COLOR_THEMES.has(name));

/**
 * Drives both channels. Most stylesheets read `theme`, `look` and the palette off the
 * options they are handed; the requirement stylesheet reads all three from `getConfig()`
 * instead. Setting site config as well as passing options means one helper covers both,
 * and the assertions do not have to know which stylesheet reads from where.
 */
const render = (
  name: keyof typeof STYLESHEETS,
  themeName: string,
  look = 'classic',
  overrides: Record<string, unknown> = {}
) => {
  const themeVariables = themes[themeName as keyof typeof themes].getThemeVariables({});
  const options = {
    ...(themeVariables as unknown as Record<string, unknown>),
    theme: themeName,
    look,
    ...overrides,
  };
  configApi.reset();
  // The resolved options go into site config too, not just the theme name. Without that,
  // the requirement stylesheet -- which reads the palette from `getConfig()` -- never sees an
  // `overrides` palette, so every slot-count assertion against it would quietly run
  // against the shipped twelve-entry palette instead of the one under test and pass for
  // the wrong reason.
  configApi.setSiteConfig({
    theme: themeName as 'redux-color',
    look: look as 'classic',
    themeVariables: options,
  });
  return STYLESHEETS[name](options as never);
};

/** The distinct `color-N` slots a stylesheet emits rules for. */
const emittedSlots = (css: string): Set<number> =>
  new Set([...css.matchAll(/data-color-id="color-(\d+)"/g)].map((m) => Number(m[1])));

it('covers every registered theme between the two lists', () => {
  expect([...PLAIN_THEMES, ...COLOUR_THEMES].sort()).toEqual(Object.keys(themes).sort());
});

describe.each(SLOT_STYLESHEETS)('%s stylesheet', (name) => {
  it.each(PLAIN_THEMES)('emits no per-item colour rules for %s', (themeName) => {
    // The slot marker, not the bare attribute: `swimlanes` keys a rule off its absence.
    expect(render(name, themeName)).not.toContain('data-color-id="color-');
  });

  it.each(COLOUR_THEMES)('emits one rule per palette slot for %s', (themeName) => {
    const css = render(name, themeName);
    const slots = new Set([...css.matchAll(/data-color-id="(color-\d+)"/g)].map((m) => m[1]));
    expect(slots.size).toBe(12);
  });

  it.each(COLOUR_THEMES)('never marks palette rules !important for %s', (themeName) => {
    // User `classDef` / `style` declarations land in an inline `style` attribute. If the
    // palette rules were !important they would silently outrank explicit user intent.
    // Match only the declaration body of each palette rule -- the rest of the stylesheet
    // uses !important legitimately.
    const css = render(name, themeName);
    const bodies = [...css.matchAll(/\[data-color-id="color-\d+"][^{]*{([^}]*)}/g)].map(
      (m) => m[1]
    );
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.filter((body) => body.includes('!important'))).toEqual([]);
  });

  it.each(COLOUR_THEMES)('keeps a hostile look out of the selector for %s', (themeName) => {
    const css = render(name, themeName, 'classic"]{a');
    expect(css).not.toContain('classic"]{a');
    expect(css).toContain('[data-look="classic"]');
  });
});

/**
 * A palette-aware stylesheet must survive being handed theme variables that did not come
 * from the configured theme.
 *
 * `timeline` is the one that reads the configured theme *name* from `getConfig()` while
 * receiving its variables as a parameter, so it is the one where the two can disagree. It
 * used to gate on the name alone and then index the palette regardless, which threw
 * `Cannot read properties of undefined` for all eight themes that carry no palette.
 *
 * In production `mermaidAPI` passes the name and the variables from the same config
 * object, so they always agree and no user hit this. It is still worth pinning: the
 * failure mode is a crash rather than a cosmetic drift, and nothing else stops a caller
 * from passing them separately.
 */
describe('mismatched theme name and theme variables', () => {
  afterEach(() => {
    configApi.reset();
  });

  const paletteless = Object.keys(themes).filter((name) => !COLOR_THEMES.has(name));

  describe.each(Object.keys(STYLESHEETS) as (keyof typeof STYLESHEETS)[])('%s', (name) => {
    it.each(paletteless)(
      'does not throw for %s variables under a colour theme name',
      (variablesFrom) => {
        for (const configuredTheme of COLOUR_THEMES) {
          // The configured theme claims a palette; the variables handed in have none.
          configApi.setSiteConfig({ theme: configuredTheme as 'redux-color' });
          const themeVariables = themes[variablesFrom as keyof typeof themes].getThemeVariables(
            {}
          ) as unknown as Record<string, unknown>;
          expect(() =>
            STYLESHEETS[name]({
              ...themeVariables,
              theme: configuredTheme,
              look: 'classic',
            } as never)
          ).not.toThrow();
        }
      }
    );
  });
});

describe.each(SLOT_STYLESHEETS)('%s stylesheet slot coverage', (name) => {
  it('emits a rule for every slot a palette longer than THEME_COLOR_LIMIT can stamp', () => {
    const palette = Array.from({ length: 20 }, (_, i) => `#${(i + 16).toString(16)}0000`);
    const slots = emittedSlots(
      render(name, 'redux-color', 'classic', {
        THEME_COLOR_LIMIT: 3,
        borderColorArray: palette,
        bkgColorArray: palette,
      })
    );
    // Named rather than counted, so a failure says which slots lost their rule.
    const missing = [...palette.keys()].filter((i) => !slots.has(i));
    expect(missing).toEqual([]);
  });

  it('emits exactly the slots a shorter palette can stamp, and no dead rules', () => {
    const slots = emittedSlots(
      render(name, 'redux-color', 'classic', {
        THEME_COLOR_LIMIT: 12,
        borderColorArray: ['#ff0000', '#00ff00'],
        bkgColorArray: ['#ffeeee', '#eeffee'],
      })
    );
    // Changed from expecting the full limit: slots 2..11 could never be stamped, so
    // they were rules nothing could match.
    expect([...slots].sort((a, b) => a - b)).toEqual([0, 1]);
  });
});

/**
 * The invariant every previous round was missing.
 *
 * Three bugs came out of the emitted slot count and the stamped slot disagreeing: a limit
 * longer than the palette (tail stamped, no rule), a palette longer than the limit (same,
 * other direction), and a palette longer than the cap added to bound the limit. Each was
 * found by review and fixed one at a time, because nothing asserted the two sides agree --
 * only that each behaved as its author expected.
 *
 * This ties them together. `stampColorSlot` produces `colorIndex % paletteSlotCount`, and
 * a stylesheet emits `0 .. colorSlotCount - 1`; those two sets have to be equal for any
 * palette and any limit. Both now derive from the palette, so this holds by construction --
 * and if anyone reintroduces a separate bound, it fails here rather than in review.
 */
describe('emitted slots and stampable slots agree', () => {
  const paletteOf = (n: number) => Array.from({ length: n }, (_, i) => `#${i}`);

  it.each([
    [1, 12],
    [2, 12],
    [11, 12],
    [12, 12],
    [13, 12],
    [MAX_COLOR_SLOTS, 12],
    [MAX_COLOR_SLOTS + 50, 12],
    [12, 3],
    [12, Number.POSITIVE_INFINITY],
    [12, undefined],
  ])('palette of %s with limit %s', (paletteLength, limit) => {
    const palette = paletteOf(paletteLength);

    const emitted = new Set(Array.from({ length: colorSlotCount(limit, palette) }, (_, i) => i));
    // Replicates stampColorSlot's arithmetic across far more items than slots.
    const stampable = new Set(
      Array.from({ length: paletteLength + 200 }, (_, i) => i % paletteSlotCount(palette))
    );

    expect([...emitted].sort((a, b) => a - b)).toEqual([...stampable].sort((a, b) => a - b));
  });

  it.each(SLOT_STYLESHEETS)('holds end to end for the %s stylesheet', (name) => {
    for (const paletteLength of [2, 12, MAX_COLOR_SLOTS + 50]) {
      const palette = paletteOf(paletteLength);
      const emitted = emittedSlots(
        render(name, 'redux-color', 'classic', {
          THEME_COLOR_LIMIT: 12,
          borderColorArray: palette,
          bkgColorArray: palette,
        })
      );
      const stampable = new Set(
        Array.from({ length: paletteLength + 200 }, (_, i) => i % paletteSlotCount(palette))
      );
      expect([...emitted].sort((a, b) => a - b)).toEqual([...stampable].sort((a, b) => a - b));
    }
  });
});
