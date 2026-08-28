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
import { COLOR_THEMES, safeLook } from './colorThemeGate.js';

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

const render = (name: keyof typeof STYLESHEETS, themeName: string, look = 'classic') => {
  const themeVariables = themes[themeName as keyof typeof themes].getThemeVariables({});
  return STYLESHEETS[name]({
    ...(themeVariables as unknown as Record<string, unknown>),
    theme: themeName,
    look,
  } as never);
};

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
