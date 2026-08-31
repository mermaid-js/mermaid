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
import * as configApi from '../../config.js';
import themes from '../../themes/index.js';
import classStyles from '../class/styles.js';
import erStyles from '../er/styles.js';
import flowchartStyles from '../flowchart/styles.js';
import requirementStyles from '../requirement/styles.js';
import swimlanesStyles from '../swimlanes/styles.js';
import timelineStyles from '../timeline/styles.js';
import {
  COLOR_THEMES,
  DEFAULT_COLOR_SLOTS,
  MAX_COLOR_SLOTS,
  colorSlotCount,
  paletteSlotCount,
  safeLook,
} from './colorThemeGate.js';

/**
 * Every stylesheet that answers the palette questions. `swimlanes` wraps flowchart's and
 * appends its own lane rules, so it is a separate answer to the same questions -- and the
 * one carrying an `!important` rule of its own next to the palette. Listed here so the
 * gate is checked on what swimlanes ships rather than on the half it inherits.
 */
const STYLESHEETS = {
  class: classStyles,
  er: erStyles,
  flowchart: flowchartStyles,
  requirement: requirementStyles,
  swimlanes: swimlanesStyles,
  timeline: timelineStyles,
} as const;

/**
 * Which stylesheets emit `[data-color-id]` slot rules. `timeline` is palette-aware but
 * colours `.section-N` classes directly rather than stamping slots, so the slot-shaped
 * assertions do not apply to it — only the crash-safety pass at the bottom does.
 */
const SLOT_STYLESHEETS = (['class', 'er', 'flowchart', 'requirement', 'swimlanes'] as const).filter(
  (name) => name in STYLESHEETS
);

const COLOUR_THEMES = [...COLOR_THEMES];

/**
 * Derived rather than listed. A hardcoded list stops being exhaustive the moment someone
 * registers a new theme — the same "widened without anyone noticing" failure this file
 * exists to catch, one level up.
 */
const PLAIN_THEMES = Object.keys(themes).filter((name) => !COLOR_THEMES.has(name));

/**
 * Drives both channels. Most stylesheets read `theme`, `look` and the palette off the
 * options they are handed; `requirement/styles.js` reads all three from `getConfig()`
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
  // `requirement/styles.js` -- which reads the palette from `getConfig()` -- never sees an
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
    // The slot marker, not the bare attribute name: `swimlanes` keys its unconditional
    // lane-border rule off `:not([data-color-id])`, which is the absence of a slot rather
    // than a rule for one.
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
 * `look` is interpolated straight into the palette rules' selector, and it is a top-level
 * config key — so it is reachable from diagram text through frontmatter or an init
 * directive, and `config.sanitize` only drops values containing `<`, `>` or `url(data:`.
 * Braces and quotes survive, which is enough to close the attribute selector early and
 * open a rule block of the author's choosing, escaping the `#svgId` scoping that stylis
 * applies. Every real look is a bare word, so anything else is rejected outright rather
 * than escaped.
 */
describe('safeLook', () => {
  it.each(['classic', 'handDrawn', 'neo', 'some-look', 'A_1'])(
    'passes the bare word %s',
    (look) => {
      expect(safeLook(look)).toBe(look);
    }
  );

  it.each(['classic"]{a{b', 'classic"] *', 'classic}', 'classic ', '', 'a"]{}'])(
    'falls back to classic for %j',
    (look) => {
      expect(safeLook(look)).toBe('classic');
    }
  );

  it('falls back to classic when look is absent', () => {
    expect(safeLook(undefined)).toBe('classic');
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

/**
 * `stampColorSlot` wraps at `palette.length`; the stylesheets emit one rule per slot up to
 * `colorSlotCount`. Those two counts have to agree, or an item gets stamped `color-N` with
 * no rule emitted for it and renders uncoloured beside its neighbours.
 *
 * Both shipped colour themes carry exactly `THEME_COLOR_LIMIT` entries, so they agree by
 * coincidence -- which is what hid this. A `themeVariables` override with a longer palette
 * is where they come apart.
 */
describe('colorSlotCount', () => {
  it('floors a missing or non-numeric limit to the default', () => {
    expect(colorSlotCount(undefined)).toBe(12);
    expect(colorSlotCount('12')).toBe(12);
    expect(colorSlotCount(0)).toBe(12);
  });

  it('covers the palette when it is longer than the limit', () => {
    expect(
      colorSlotCount(
        3,
        Array.from({ length: 20 }, () => '#000')
      )
    ).toBe(20);
  });

  it('matches the palette when it is shorter than the limit', () => {
    // Changed from expecting the limit. `stampColorSlot` assigns
    // `colorIndex % palette.length`, so a two-entry palette can only ever produce color-0
    // and color-1 -- enumerated over 500 indices to check. Emitting twelve rules would
    // leave ten that nothing can match.
    expect(colorSlotCount(12, ['#a', '#b'])).toBe(2);
  });

  it('keeps the plain limit when given no palette', () => {
    expect(colorSlotCount(7)).toBe(7);
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
 * Whatever the limit, the result is used directly as a `for` bound, so it has to be a value
 * a loop can finish on. `Infinity` is reachable from diagram text:
 * `THEME_COLOR_LIMIT: .inf` in front matter parses to it under the `JSON_SCHEMA` mermaid
 * loads YAML with, and a large finite value such as `1e9` wedges generation just as
 * effectively.
 */
describe('colorSlotCount stays a usable loop bound', () => {
  it.each([
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
    ['NaN', Number.NaN],
    ['a huge integer', 1e9],
    ['a fraction', 12.5],
    ['a negative', -1],
  ])('falls back to the default for %s', (_label, value) => {
    expect(colorSlotCount(value)).toBe(DEFAULT_COLOR_SLOTS);
  });

  it('does not cap the palette path, because the palette is the bound', () => {
    // This assertion previously expected MAX_COLOR_SLOTS, which was the bug: capping here
    // let a palette longer than the cap stamp `color-64` and above with no rule emitted.
    // A palette is inherently finite, so its own length is the bound.
    const huge = Array.from({ length: MAX_COLOR_SLOTS + 50 }, () => '#000');
    expect(colorSlotCount(12, huge)).toBe(huge.length);
  });

  it('always yields a finite positive integer within the cap', () => {
    for (const value of [Number.POSITIVE_INFINITY, 1e9, Number.NaN, -1, 12.5, 'x', {}]) {
      const bound = colorSlotCount(value);
      expect(Number.isInteger(bound)).toBe(true);
      expect(bound).toBeGreaterThan(0);
      expect(bound).toBeLessThanOrEqual(MAX_COLOR_SLOTS);
    }
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
