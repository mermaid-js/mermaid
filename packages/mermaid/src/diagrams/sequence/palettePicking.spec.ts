/**
 * Sequence colours each actor from the theme palette. Every call site used to index
 * `bkgColorArray` by `borderColorArray.length` — one array by the other's length.
 *
 * That is invisible while both palettes ship twelve entries, which is why it survived: it
 * is wrong only when they differ. A background palette shorter than the border palette
 * leaves the overflow actors resolving to `undefined`, and because
 * `selection.style(name, undefined)` takes d3's *remove* path, the inline fill silently
 * disappears for some actors and not others.
 *
 * `redux-dark-color` depends on that remove path: it ships a border palette and an empty
 * background palette so actors are outlined but not filled. So the fix has to keep
 * returning `undefined` for an absent palette rather than substituting a colour — these
 * assertions pin both halves.
 */
import { describe, expect, it } from 'vitest';
import themes from '../../themes/index.js';
import { paletteColor } from './svgDraw.js';
// Vite's `?raw` gives the module's own source, so the guard below reads the real file
// without depending on the working directory.
// @ts-expect-error -- `?raw` is a Vite import suffix, not a declared module
import svgDrawSource from './svgDraw.js?raw';

describe('paletteColor', () => {
  const palette = ['#a', '#b', '#c'];

  it('cycles within the palette it was given', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => paletteColor(palette, i))).toEqual([
      '#a',
      '#b',
      '#c',
      '#a',
      '#b',
      '#c',
    ]);
  });

  it('returns undefined for an empty palette rather than a substitute colour', () => {
    // `undefined` is what makes d3 remove the inline style and defer to the stylesheet.
    expect(paletteColor([], 0)).toBeUndefined();
    expect(paletteColor(undefined, 3)).toBeUndefined();
  });

  it('never runs off the end of a short palette', () => {
    // The old code asked for index `i % 12` from a 3-entry array.
    const asked = Array.from({ length: 12 }, (_, i) => paletteColor(palette, i));
    expect(asked).not.toContain(undefined);
    expect(new Set(asked)).toEqual(new Set(palette));
  });

  it('is independent of any other palette length', () => {
    // The bug in one line: a 2-entry background palette indexed by a 12-entry border
    // palette's length loses every actor past the second.
    const short = ['#x', '#y'];
    const oldWay = Array.from({ length: 12 }, (_, i) => short[i % 12]);
    const newWay = Array.from({ length: 12 }, (_, i) => paletteColor(short, i));
    expect(oldWay.filter((c) => c === undefined)).toHaveLength(10);
    expect(newWay.filter((c) => c === undefined)).toHaveLength(0);
  });
});

/**
 * The shipped palettes must render exactly as before — this is a latent-bug fix, not a
 * visual change, and `patch` is only honest if that holds.
 */
describe('shipped colour themes are unaffected', () => {
  it.each(['redux-color', 'redux-dark-color'] as const)('%s', (name) => {
    const variables = themes[name].getThemeVariables({}) as unknown as {
      borderColorArray: string[];
      bkgColorArray: string[];
    };
    const { borderColorArray, bkgColorArray } = variables;

    for (let i = 0; i < 24; i++) {
      // What the old expression produced, verbatim.
      const oldStroke = borderColorArray[i % borderColorArray.length];
      const oldFill = bkgColorArray[i % borderColorArray.length];
      expect(paletteColor(borderColorArray, i)).toBe(oldStroke);
      expect(paletteColor(bkgColorArray, i)).toBe(oldFill);
    }
  });

  it('redux-dark-color still yields no fill, so the stylesheet keeps deciding', () => {
    const { bkgColorArray } = themes['redux-dark-color'].getThemeVariables({}) as unknown as {
      bkgColorArray: string[];
    };
    expect(bkgColorArray).toHaveLength(0);
    expect(paletteColor(bkgColorArray, 0)).toBeUndefined();
  });
});

/**
 * The helper assertions above cannot see a call site that goes back to indexing one
 * palette by the other's length — and that is the failure mode with history here: the
 * expression was copy-pasted across eleven actor drawers before anyone noticed. A new actor
 * type copied from an existing one is the obvious way for it to return, so guard the shape
 * of the source rather than only the helper's behaviour.
 */
describe('no call site indexes one palette by another', () => {
  const source: string = svgDrawSource;

  it('has no raw palette indexing left', () => {
    const raw = [...source.matchAll(/(\w*ColorArray)\[[^\]]*?(\w*ColorArray)\.length]/g)].map(
      (m) => m[0]
    );
    expect(raw).toEqual([]);
  });

  it('routes every actor colour through paletteColor', () => {
    // Both halves of each stroke/fill pair.
    const calls = [...source.matchAll(/paletteColor\((\w+),\s*actorCount\)/g)].map((m) => m[1]);
    expect(calls.length).toBeGreaterThanOrEqual(22);
    expect(new Set(calls)).toEqual(new Set(['borderColorArray', 'bkgColorArray']));
  });
});
