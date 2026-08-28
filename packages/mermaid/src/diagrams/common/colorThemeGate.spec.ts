/**
 * The per-item palette is opt-in per diagram: shapes and containers stamp a
 * `data-color-id` slot via `stampColorSlot`, and a diagram renders colour only if its
 * stylesheet emits the matching rules.
 *
 * These assertions are about the gate, not the colours: a stylesheet must stay silent for
 * every theme outside the colour pair, must emit one rule per palette slot inside it, and
 * must never outrank a user's own styling.
 */
import { describe, expect, it } from 'vitest';
import themes from '../../themes/index.js';
import classStyles from '../class/styles.js';
import flowchartStyles from '../flowchart/styles.js';
import { COLOR_THEMES, colorSlotCount, safeLook } from './colorThemeGate.js';

const STYLESHEETS = {
  class: classStyles,
  flowchart: flowchartStyles,
} as const;

const COLOUR_THEMES = [...COLOR_THEMES];

/**
 * Derived rather than listed. A hardcoded list stops being exhaustive the moment someone
 * registers a new theme — the same "widened without anyone noticing" failure this file
 * exists to catch, one level up.
 */
const PLAIN_THEMES = Object.keys(themes).filter((name) => !COLOR_THEMES.has(name));

const render = (
  name: keyof typeof STYLESHEETS,
  themeName: string,
  look = 'classic',
  overrides: Record<string, unknown> = {}
) => {
  const themeVariables = themes[themeName as keyof typeof themes].getThemeVariables({});
  return STYLESHEETS[name]({
    ...(themeVariables as unknown as Record<string, unknown>),
    theme: themeName,
    look,
    ...overrides,
  } as never);
};

/** The distinct `color-N` slots a stylesheet emits rules for. */
const emittedSlots = (css: string): Set<number> =>
  new Set([...css.matchAll(/data-color-id="color-(\d+)"/g)].map((m) => Number(m[1])));

it('covers every registered theme between the two lists', () => {
  expect([...PLAIN_THEMES, ...COLOUR_THEMES].sort()).toEqual(Object.keys(themes).sort());
});

describe.each(Object.keys(STYLESHEETS) as (keyof typeof STYLESHEETS)[])('%s stylesheet', (name) => {
  it.each(PLAIN_THEMES)('emits no per-item colour rules for %s', (themeName) => {
    expect(render(name, themeName)).not.toContain('data-color-id');
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

  it('keeps the limit when the palette is shorter, so the cycle still repeats', () => {
    expect(colorSlotCount(12, ['#a', '#b'])).toBe(12);
  });

  it('keeps the plain limit when given no palette', () => {
    expect(colorSlotCount(7)).toBe(7);
  });
});

describe.each(Object.keys(STYLESHEETS) as (keyof typeof STYLESHEETS)[])(
  '%s stylesheet slot coverage',
  (name) => {
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

    it('still emits the full limit for a palette shorter than it', () => {
      const slots = emittedSlots(
        render(name, 'redux-color', 'classic', {
          THEME_COLOR_LIMIT: 12,
          borderColorArray: ['#ff0000', '#00ff00'],
          bkgColorArray: ['#ffeeee', '#eeffee'],
        })
      );
      expect(slots.size).toBe(12);
    });
  }
);
