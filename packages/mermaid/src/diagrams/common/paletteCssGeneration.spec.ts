/**
 * The ER and requirement stylesheets generate one CSS rule per palette slot, looping to
 * `THEME_COLOR_LIMIT` and indexing the palette by the loop counter. Two things went wrong
 * with that, and neither produces an error anywhere — they emit CSS the browser quietly
 * discards, so the only symptom is a shape rendering unstyled:
 *
 *   1. Indexing raw means a palette shorter than `THEME_COLOR_LIMIT` yields
 *      `stroke: undefined` for the overflow slots.
 *   2. `requirement` emitted `fill: ;` — an empty value, invalid CSS — whenever there was
 *      no background palette. `redux-dark-color` is the live case: it ships a border
 *      palette and no background palette, colouring outlines only.
 *
 * These assertions are about the shape of the generated CSS rather than the colours, so
 * they hold for any palette.
 */
import { describe, expect, it, afterEach } from 'vitest';
import * as configApi from '../../config.js';
import themes from '../../themes/index.js';
import erStyles from '../er/styles.js';
import requirementStyles from '../requirement/styles.js';

const STYLESHEETS = {
  er: erStyles,
  requirement: requirementStyles,
} as const;

const COLOUR_THEMES = ['redux-color', 'redux-dark-color'] as const;

/**
 * `requirement/styles.js` reads the theme and palette from `getConfig()` while
 * `er/styles.ts` reads them off its options argument, so drive both.
 */
const render = (
  name: keyof typeof STYLESHEETS,
  themeName: string,
  overrides: Record<string, unknown> = {}
) => {
  const themeVariables = themes[themeName as keyof typeof themes].getThemeVariables({});
  const merged = { ...(themeVariables as unknown as Record<string, unknown>), ...overrides };
  configApi.reset();
  configApi.setSiteConfig({ theme: themeName as 'redux-color', themeVariables: merged });
  return STYLESHEETS[name]({ ...merged, theme: themeName, look: 'classic' } as never);
};

afterEach(() => {
  configApi.reset();
});

describe.each(Object.keys(STYLESHEETS) as (keyof typeof STYLESHEETS)[])('%s stylesheet', (name) => {
  it.each(COLOUR_THEMES)('emits no undefined values for %s', (themeName) => {
    expect(render(name, themeName)).not.toContain('undefined');
  });

  it.each(COLOUR_THEMES)('emits no empty declarations for %s', (themeName) => {
    // `fill: ;` and friends — a property with no value at all.
    expect(render(name, themeName)).not.toMatch(/[\w-]+:\s*;/);
  });

  it('survives a palette shorter than THEME_COLOR_LIMIT', () => {
    const css = render(name, 'redux-color', {
      borderColorArray: ['#ff0000', '#00ff00'],
      bkgColorArray: ['#ffeeee', '#eeffee'],
    });
    expect(css).not.toContain('undefined');
    // Every slot still gets a rule, and every rule names one of the two colours. Scoped to
    // the palette blocks -- the rest of the stylesheet has its own `stroke:` declarations.
    const paletteBlocks = [...css.matchAll(/\[data-color-id="color-\d+"][^{]*{([^}]*)}/g)].map(
      (m) => m[1]
    );
    const strokes = paletteBlocks.flatMap((block) =>
      [...block.matchAll(/stroke:\s*([^;]+);/g)].map((m) => m[1].trim())
    );
    expect(strokes.length).toBeGreaterThan(2);
    expect(new Set(strokes)).toEqual(new Set(['#ff0000', '#00ff00']));
  });

  it('omits the fill declaration when there is no background palette', () => {
    const css = render(name, 'redux-color', { bkgColorArray: [] });
    expect(css).not.toMatch(/fill:\s*;/);
    expect(css).toContain('stroke:');
  });
});
