/**
 * `redux-color` / `redux-dark-color` are the colour-carrying siblings of `redux` /
 * `redux-dark`: they add `borderColorArray`, `bkgColorArray` and a real categorical
 * palette on top of the same geometry and typography.
 *
 * They were forked by copy-paste, so they had drifted: seven variables `redux`
 * defines were either missing (`stateEdgeLabelBackground`,
 * `requirementEdgeLabelBackground`) or silently re-derived from the grey
 * `primaryColor` (`primaryBorderColor`, `clusterBkg`, `clusterBorder`,
 * `altBackground`, `compositeTitleBackground`). Nothing crashes when that
 * happens — diagrams just pick up an untuned value where the base theme has a
 * deliberate one, which is invisible in review and only shows up in a screenshot.
 *
 * This pins two properties:
 *
 *  1. A colour theme defines everything its base theme defines.
 *  2. It diverges *only* on the palette it exists to provide — and that palette is
 *     listed here explicitly, so widening it is a deliberate edit to this file
 *     rather than something a loose pattern lets through unnoticed.
 */
// @ts-ignore TODO: incorrect types from khroma -- `isDark` exists at runtime but is
// missing from the shipped .d.ts, the same gap worked around in er/styles.ts.
import { isDark } from 'khroma';
import { describe, expect, it } from 'vitest';
import themes from './index.js';

/**
 * The variables a colour theme is meant to own. Everything else has to match its
 * base theme exactly.
 */
const PALETTE_VARS = new Set([
  // Categorical scale: mindmap, kanban, treemap, radar, timeline.
  ...Array.from({ length: 12 }, (_, i) => `cScale${i}`),
  ...Array.from({ length: 12 }, (_, i) => `cScaleInv${i}`),
  ...Array.from({ length: 12 }, (_, i) => `cScalePeer${i}`),
  ...Array.from({ length: 12 }, (_, i) => `cScaleLabel${i}`),
  // Pie slices are drawn from the categorical scale.
  ...Array.from({ length: 12 }, (_, i) => `pie${i + 1}`),
  // …which means the in-slice label ink is a palette decision too.
  'pieSectionTextColor',
  // User-journey task and section fills.
  ...Array.from({ length: 8 }, (_, i) => `fillType${i}`),
  // Gantt section banding.
  'sectionBkgColor',
  'sectionBkgColor2',
]);

const PAIRS = [
  ['redux', 'redux-color'],
  ['redux-dark', 'redux-dark-color'],
] as const;

describe.each(PAIRS)('%s -> %s', (baseName, colorName) => {
  const base = themes[baseName].getThemeVariables({}) as unknown as Record<string, unknown>;
  const color = themes[colorName].getThemeVariables({}) as unknown as Record<string, unknown>;

  it(`${colorName} defines every variable ${baseName} defines`, () => {
    const missing = Object.keys(base).filter(
      (key) => typeof base[key] !== 'function' && color[key] === undefined
    );
    expect(missing).toEqual([]);
  });

  it(`${colorName} only diverges from ${baseName} on the palette`, () => {
    const unexpected = Object.keys(base).filter(
      (key) =>
        typeof base[key] !== 'function' &&
        !PALETTE_VARS.has(key) &&
        JSON.stringify(base[key]) !== JSON.stringify(color[key])
    );
    expect(unexpected).toEqual([]);
  });

  it(`${colorName} provides the colour arrays ${baseName} does not`, () => {
    expect(base.borderColorArray).toBeUndefined();
    expect(color.borderColorArray).toHaveLength(12);
  });
});

/**
 * The chart diagrams read flat `pieN` / `fillTypeN` variables rather than the
 * `cScale` array, so they were the last diagrams still rendering monochrome under
 * the colour themes: every `pieN` was a tint of one pale lavender (`pie3` resolved
 * to pure white in `redux-color`, and to near-black in `redux-dark-color`).
 *
 * "12 distinct values" alone would have passed before this was fixed — the tints
 * *were* distinct, just indistinguishable. So assert real separation instead.
 */
describe.each(['redux-color', 'redux-dark-color'] as const)('%s chart palettes', (name) => {
  const vars = themes[name].getThemeVariables({}) as unknown as Record<string, string>;

  it('draws pie slices from the categorical scale', () => {
    const slices = Array.from({ length: 12 }, (_, i) => vars[`pie${i + 1}`]);
    const scale = Array.from({ length: 12 }, (_, i) => vars[`cScale${i}`]);
    expect(slices).toEqual(scale);
  });

  it('gives user-journey eight distinct task fills', () => {
    const fills = Array.from({ length: 8 }, (_, i) => vars[`fillType${i}`]);
    expect(fills.every((fill) => typeof fill === 'string' && fill.length > 0)).toBe(true);
    expect(new Set(fills).size).toBe(8);
  });

  it('bands gantt sections with two different colours', () => {
    expect(vars.sectionBkgColor).not.toBe(vars.sectionBkgColor2);
  });

  /**
   * User-journey paints task labels with the theme's `textColor` (verified against the
   * rendered DOM, not the stylesheet -- `user-journey/styles.js` also carries a
   * hardcoded `.label text { fill: #333 }` rule that does not win). So a light theme
   * needs light fills and a dark theme needs dark ones. Picking fills off the shared
   * categorical scale gets this wrong in the dark theme: the labels end up light ink on
   * a light fill.
   */
  it('keeps user-journey fills on the opposite side of the label ink', () => {
    const inkIsDark = isDark(vars.textColor);
    const wrong = Array.from({ length: 8 }, (_, i) => `fillType${i}`).filter(
      (key) => isDark(vars[key]) === inkIsDark
    );
    expect(wrong).toEqual([]);
  });
});
