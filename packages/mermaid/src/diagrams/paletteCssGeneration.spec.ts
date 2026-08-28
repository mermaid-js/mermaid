/**
 * The ER and requirement stylesheets generate one CSS rule per palette slot, looping to
 * `THEME_COLOR_LIMIT` and indexing the palette by the loop counter. Three things went
 * wrong with that, and none produces an error anywhere — they emit CSS the browser quietly
 * discards, so the only symptom is a shape rendering unstyled. No screenshot test can
 * catch it: a diagram renders identically with or without a discarded declaration.
 *
 *   1. Indexing raw while looping to `THEME_COLOR_LIMIT` means a palette shorter than the
 *      limit yields `stroke: undefined` for the overflow slots. Both files now take the
 *      loop bound from the palette itself, which also fixes the reverse — a palette longer
 *      than the limit left stamped boxes with no rule emitted.
 *   2. Wrapping with `i % length` fixes the first half but reintroduces it for an *empty*
 *      palette: `i % 0` is `NaN` and `[][NaN]` is `undefined`. Both files bail early
 *      instead. The background palette is a separate array and may still be shorter than
 *      the border one, so that one is still wrapped.
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
import timelineStyles from './timeline/styles.js';

const STYLESHEETS = {
  er: erStyles,
  requirement: requirementStyles,
  timeline: timelineStyles,
} as const;

type Stylesheet = keyof typeof STYLESHEETS;

const ALL_STYLESHEETS = Object.keys(STYLESHEETS) as Stylesheet[];

/**
 * Which of them emit `[data-color-id]` slot rules. `timeline` is palette-aware but
 * colours `.section-N` classes directly, so the slot-shaped assertions do not apply to
 * it — only the invalid-CSS ones do.
 */
const SLOT_STYLESHEETS = ['er', 'requirement'] as const satisfies readonly Stylesheet[];

/** Matches `theme-base.js`; the palette rules are emitted one per slot up to this. */
const THEME_COLOR_LIMIT = 12;

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
    THEME_COLOR_LIMIT,
    ...overrides,
  };
  configApi.reset();
  configApi.setSiteConfig({ theme, look: 'classic', themeVariables: options });
  return STYLESHEETS[name](options);
};

/** The declaration bodies of the palette rules, ignoring the rest of the stylesheet. */
const paletteBlocks = (css: string): string[] =>
  [...css.matchAll(/\[data-color-id="color-\d+"][^{]*{([^}]*)}/g)].map((m) => m[1]);

/**
 * The declaration bodies of timeline's `.section-N` rules. Anchored on the ` rect,` that
 * opens each selector list, so it skips `.section-root` and the `[data-look="neo"]`
 * gradient variants.
 */
const sectionBlocks = (css: string): string[] =>
  [...css.matchAll(/\.section--?\d+ rect,[^{]*{([^}]*)}/g)].map((m) => m[1]);

const strokesIn = (blocks: string[]): string[] =>
  blocks.flatMap((block) => [...block.matchAll(/stroke:\s*([^;]+);/g)].map((m) => m[1].trim()));

afterEach(() => {
  configApi.reset();
});

describe.each(ALL_STYLESHEETS)('%s stylesheet', (name) => {
  it.each(COLOUR_THEMES)('emits no undefined values for %s', (theme) => {
    expect(render(name, theme)).not.toContain('undefined');
  });

  it.each(COLOUR_THEMES)('emits no empty declarations for %s', (theme) => {
    // `fill: ;` and friends — a property with no value at all.
    expect(render(name, theme)).not.toMatch(/[\w-]+:\s*;/);
  });

  it('emits no undefined values for a palette shorter than THEME_COLOR_LIMIT', () => {
    const css = render(name, 'redux-color', {
      borderColorArray: ['#ff0000', '#00ff00'],
      bkgColorArray: ['#ffeeee', '#eeffee'],
    });
    expect(css).not.toContain('undefined');
  });

  it('emits no undefined values for an empty border palette', () => {
    // `i % 0` is NaN, so wrapping the index is not enough on its own — the guard has to
    // bail before the loop.
    expect(render(name, 'redux-color', { borderColorArray: [] })).not.toContain('undefined');
  });
});

describe.each(SLOT_STYLESHEETS)('%s stylesheet slot rules', (name) => {
  it('resolves every slot from a palette shorter than THEME_COLOR_LIMIT', () => {
    const borderColorArray = ['#ff0000', '#00ff00'];
    const css = render(name, 'redux-color', {
      borderColorArray,
      bkgColorArray: ['#ffeeee', '#eeffee'],
    });
    // Every slot gets a rule, and every rule names one of the two colours. Scoped to the
    // palette blocks — the rest of the stylesheet has its own `stroke:` declarations.
    // Counted exactly: a `greaterThan` bound would still pass if only a couple of slots
    // were emitted, which is the regression this is here to catch. Each slot emits a
    // `path` rule and a `rect` rule, hence twice the count.
    //
    // The expected count is the palette length, changed from `THEME_COLOR_LIMIT`. Looping
    // to the limit and wrapping the index did keep every declaration valid — which is what
    // this file was written to check, and that half still holds — but `erBox` and
    // `requirementBox` stamp `colorIndex % borderColorArray.length`, so a two-entry palette
    // can only ever produce color-0 and color-1. Ten of the twelve rules matched nothing.
    // The same drift in the other direction is the actual defect: a palette *longer* than
    // the limit left stamped boxes with no rule at all. Both sides now derive from the
    // palette length, so they cannot disagree; `colorThemeGate.spec.ts` pins that.
    const blocks = paletteBlocks(css);
    const strokes = strokesIn(blocks);
    expect(blocks).toHaveLength(borderColorArray.length * 2);
    expect(strokes).toHaveLength(borderColorArray.length * 2);
    expect(new Set(strokes)).toEqual(new Set(borderColorArray));
  });

  it('resolves every slot from a palette longer than THEME_COLOR_LIMIT', () => {
    // The direction that actually broke: with the bound at THEME_COLOR_LIMIT, slots
    // 12..19 were stamped by `erBox`/`requirementBox` and had no rule emitted, so those
    // entities rendered unstyled next to coloured neighbours.
    const borderColorArray = Array.from({ length: 20 }, (_, i) => `#${(i + 16).toString(16)}0000`);
    const css = render(name, 'redux-color', { borderColorArray, bkgColorArray: [] });
    const strokes = strokesIn(paletteBlocks(css));
    expect(strokes).toHaveLength(borderColorArray.length * 2);
    expect(new Set(strokes)).toEqual(new Set(borderColorArray));
  });

  it('emits no slot rules at all for an empty border palette', () => {
    // Emitting nothing is the correct outcome: there is no palette to render.
    expect(paletteBlocks(render(name, 'redux-color', { borderColorArray: [] }))).toEqual([]);
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

describe('timeline section rules', () => {
  it('wraps the palette across every section rather than falling back', () => {
    const borderColorArray = ['#ff0000', '#00ff00'];
    const css = render('timeline', 'redux-color', { borderColorArray });
    const strokes = strokesIn(sectionBlocks(css));

    // The assertion has to be the wrapped *sequence*, not just the absence of `undefined`.
    // `slot ?? options.nodeBorder` means dropping the `% length` wrap sends the overflow
    // slots to the classic fallback colour instead of leaving them undefined, so a
    // `not.toContain('undefined')` check passes either way and catches nothing. What
    // actually regresses is sections 3..12 silently losing their palette colours.
    expect(strokes).toHaveLength(THEME_COLOR_LIMIT);
    expect(strokes).toEqual(
      Array.from(
        { length: THEME_COLOR_LIMIT },
        (_, i) => borderColorArray[i % borderColorArray.length]
      )
    );
  });

  it('falls back to the classic colours for an empty border palette', () => {
    const css = render('timeline', 'redux-color', { borderColorArray: [] });
    const strokes = strokesIn(sectionBlocks(css));
    expect(strokes).toHaveLength(THEME_COLOR_LIMIT);
    expect(new Set(strokes)).not.toContain(undefined);
    // No palette to cycle, so every section takes the classic border colour.
    expect(new Set(strokes).size).toBe(1);
  });
});
