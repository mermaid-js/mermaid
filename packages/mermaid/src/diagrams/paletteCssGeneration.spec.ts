/**
 * The ER and requirement stylesheets generate one CSS rule per palette slot, looping to
 * `THEME_COLOR_LIMIT` and indexing the palette by the loop counter. Three things went
 * wrong with that, and none produces an error anywhere — they emit CSS the browser quietly
 * discards, so the only symptom is a shape rendering unstyled. No screenshot test can
 * catch it: a diagram renders identically with or without a discarded declaration.
 *
 *   1. Indexing raw means a palette shorter than `THEME_COLOR_LIMIT` yields
 *      `stroke: undefined` for the overflow slots.
 *   2. Wrapping with `i % length` fixes that but reintroduces it for an *empty* palette:
 *      `i % 0` is `NaN` and `[][NaN]` is `undefined`. Both files bail early instead.
 *   3. `requirement` emitted `fill: ;` — an empty value, invalid CSS — whenever there was
 *      no background palette. `redux-dark-color` is the live case: it ships a border
 *      palette and no background palette, colouring outlines only.
 *
 * These assertions are about the shape of the generated CSS rather than the colours, so
 * they keep holding when the palettes are retuned.
 *
 * Deliberately a sibling of the diagram folders rather than inside `common/`: it imports
 * two diagram stylesheets, and `common/` is imported by every diagram type, so a
 * cross-diagram spec in there would imply a dependency that does not exist.
 */
import { describe, expect, it, afterEach } from 'vitest';
import * as configApi from '../config.js';
import type { MermaidConfig } from '../config.type.js';
import themes from '../themes/index.js';
import erStyles from './er/styles.js';
import requirementStyles from './requirement/styles.js';

const STYLESHEETS = {
  er: erStyles,
  requirement: requirementStyles,
} as const;

const COLOUR_THEMES = [
  'redux-color',
  'redux-dark-color',
] as const satisfies MermaidConfig['theme'][];

/** The subset of theme variables these stylesheets read. */
interface PaletteOptions {
  theme: MermaidConfig['theme'];
  look: MermaidConfig['look'];
  THEME_COLOR_LIMIT: number;
  borderColorArray?: string[];
  bkgColorArray?: string[];
  [key: string]: unknown;
}

/**
 * Drives both channels: `er/styles.ts` reads the theme and palette off its options
 * argument, while `requirement/styles.js` reads them from `getConfig()`.
 */
const render = (
  name: keyof typeof STYLESHEETS,
  theme: MermaidConfig['theme'],
  overrides: Partial<PaletteOptions> = {}
): string => {
  const themeVariables = themes[theme as keyof typeof themes].getThemeVariables({});
  const options: PaletteOptions = {
    ...(themeVariables as unknown as Record<string, unknown>),
    theme,
    look: 'classic',
    THEME_COLOR_LIMIT: 12,
    ...overrides,
  };
  configApi.reset();
  configApi.setSiteConfig({ theme, look: 'classic', themeVariables: options });
  return STYLESHEETS[name](options);
};

/** The declaration bodies of the palette rules, ignoring the rest of the stylesheet. */
const paletteBlocks = (css: string): string[] =>
  [...css.matchAll(/\[data-color-id="color-\d+"][^{]*{([^}]*)}/g)].map((m) => m[1]);

afterEach(() => {
  configApi.reset();
});

describe.each(Object.keys(STYLESHEETS) as (keyof typeof STYLESHEETS)[])('%s stylesheet', (name) => {
  it.each(COLOUR_THEMES)('emits no undefined values for %s', (theme) => {
    expect(render(name, theme)).not.toContain('undefined');
  });

  it.each(COLOUR_THEMES)('emits no empty declarations for %s', (theme) => {
    // `fill: ;` and friends — a property with no value at all.
    expect(render(name, theme)).not.toMatch(/[\w-]+:\s*;/);
  });

  it('survives a palette shorter than THEME_COLOR_LIMIT', () => {
    const css = render(name, 'redux-color', {
      borderColorArray: ['#ff0000', '#00ff00'],
      bkgColorArray: ['#ffeeee', '#eeffee'],
    });
    expect(css).not.toContain('undefined');
    // Every slot still gets a rule, and every rule names one of the two colours. Scoped to
    // the palette blocks — the rest of the stylesheet has its own `stroke:` declarations.
    const strokes = paletteBlocks(css).flatMap((block) =>
      [...block.matchAll(/stroke:\s*([^;]+);/g)].map((m) => m[1].trim())
    );
    expect(strokes.length).toBeGreaterThan(2);
    expect(new Set(strokes)).toEqual(new Set(['#ff0000', '#00ff00']));
  });

  it('emits nothing at all for an empty border palette', () => {
    // `i % 0` is NaN, so wrapping the index is not enough on its own — the guard has to
    // bail before the loop. Emitting no palette rules is the correct outcome: there is no
    // palette to render.
    const css = render(name, 'redux-color', { borderColorArray: [] });
    expect(css).not.toContain('undefined');
    expect(paletteBlocks(css)).toEqual([]);
  });

  it('omits the fill declaration when there is no background palette', () => {
    const css = render(name, 'redux-color', { bkgColorArray: [] });
    expect(css).not.toMatch(/fill:\s*;/);
    // Scoped to a palette rule: the base stylesheet carries its own `stroke:` declarations,
    // so an unscoped check would pass even if genColor returned nothing.
    expect(paletteBlocks(css).length).toBeGreaterThan(0);
    expect(paletteBlocks(css).every((block) => block.includes('stroke:'))).toBe(true);
  });
});
