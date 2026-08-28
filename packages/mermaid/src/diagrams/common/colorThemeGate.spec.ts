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
import timelineStyles from '../timeline/styles.js';
import { COLOR_THEMES, safeLook } from './colorThemeGate.js';

const STYLESHEETS = {
  class: classStyles,
  er: erStyles,
  flowchart: flowchartStyles,
  requirement: requirementStyles,
  timeline: timelineStyles,
} as const;

/**
 * Which stylesheets emit `[data-color-id]` slot rules. `timeline` is palette-aware but
 * colours `.section-N` classes directly rather than stamping slots, so the slot-shaped
 * assertions do not apply to it — only the crash-safety pass at the bottom does.
 */
const SLOT_STYLESHEETS = (['class', 'er', 'flowchart', 'requirement'] as const).filter(
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
const render = (name: keyof typeof STYLESHEETS, themeName: string, look = 'classic') => {
  const themeVariables = themes[themeName as keyof typeof themes].getThemeVariables({});
  configApi.reset();
  configApi.setSiteConfig({ theme: themeName as 'redux-color', look: look as 'classic' });
  return STYLESHEETS[name]({
    ...(themeVariables as unknown as Record<string, unknown>),
    theme: themeName,
    look,
  } as never);
};

it('covers every registered theme between the two lists', () => {
  expect([...PLAIN_THEMES, ...COLOUR_THEMES].sort()).toEqual(Object.keys(themes).sort());
});

describe.each(SLOT_STYLESHEETS)('%s stylesheet', (name) => {
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
