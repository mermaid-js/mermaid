/**
 * `redux-color` / `redux-dark-color` are the colour-carrying siblings of `redux` /
 * `redux-dark`: they add `borderColorArray` and a real categorical palette on top of the
 * same geometry and typography. Only the light theme adds `bkgColorArray` -- see the
 * array test below for why the dark one deliberately does not.
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
// khroma's `dist/index.d.ts` re-exports everything via a bare `export * from './methods'`.
// Under this repo's `module: nodenext` that path is resolved as ESM, where a relative
// specifier without a file extension does not resolve -- so TS sees the module as having no exports at all
// and every member of this import errors. The members do exist (khroma
// `dist/methods/index.d.ts` exports them) and the import works at runtime; an isolated
// `tsc --moduleResolution bundler` also compiles it clean, which is why this looks
// unnecessary until `pnpm build:types` runs.
//
// `@ts-expect-error` rather than `@ts-ignore` deliberately: if khroma ships resolvable
// types or the module setting changes, this fails and gets deleted instead of lingering.
// @ts-expect-error -- see above
import { hue, isDark, toRgba } from 'khroma';
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
  // The third gantt band, and an exemption the *dark* pair needs only. Both base themes
  // set it to 'white', which is right on a white canvas: at the 20% opacity gantt paints
  // bands with it composites to nothing, so every other band reads as absent. On the dark
  // canvas the same literal composites to rgb(92,92,92) -- a grey brighter than either
  // tuned hue, so half of every gantt's banding fought the other half -- and the dark
  // theme therefore uses its canvas colour instead. The light theme keeps 'white'
  // verbatim, so it does not diverge and this exemption goes unused for that pair.
  'altSectionBkgColor',
]);

const PAIRS = [
  ['redux', 'redux-color'],
  ['redux-dark', 'redux-dark-color'],
] as const;

/**
 * How many `bkgColorArray` entries each colour theme ships. The asymmetry is deliberate,
 * not leftover drift: `bkgColorArray` is what gates *fills* in `er/styles.ts`,
 * `requirement/styles.js` and `sequence/svgDraw.js`, and the dark theme intentionally
 * colours only borders there, leaving box interiors on the dark canvas. Populating it
 * would silently repaint ER entities, requirement boxes and sequence actors.
 *
 * It is asserted per theme rather than left unchecked so that the difference stays a
 * recorded decision. An earlier version of this spec checked only `borderColorArray`,
 * which meant the one asymmetry between the two themes passed the very test written to
 * catch drift between them.
 */
const EXPECTED_BKG_COLORS: Record<string, number> = {
  'redux-color': 12,
  'redux-dark-color': 0,
};

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
    expect(base.bkgColorArray).toBeUndefined();
    expect(color.borderColorArray).toHaveLength(12);
    expect(color.bkgColorArray).toHaveLength(EXPECTED_BKG_COLORS[colorName]);
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
/** The opacity `gantt/styles.js` paints its `.section` bands at. */
const GANTT_BAND_OPACITY = 0.2;

const channels = (color: string): number[] =>
  (toRgba(color).match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);

/** Flatten a colour onto a background at the given alpha, as the browser would. */
const compositeOver = (foreground: string, background: string, alpha: number): number[] => {
  const fg = channels(foreground);
  const bg = channels(background);
  return fg.map((value, i) => Math.round(alpha * value + (1 - alpha) * bg[i]));
};

const maxChannelDelta = (a: number[], b: number[]): number =>
  Math.max(...a.map((value, i) => Math.abs(value - b[i])));

describe.each(['redux-color', 'redux-dark-color'] as const)('%s chart palettes', (name) => {
  const vars = themes[name].getThemeVariables({}) as unknown as Record<string, string>;

  it('draws pie slices from the categorical scale', () => {
    const slices = Array.from({ length: 12 }, (_, i) => vars[`pie${i + 1}`]);
    const scale = Array.from({ length: 12 }, (_, i) => vars[`cScale${i}`]);
    expect(slices).toEqual(scale);
  });

  it('gives user-journey a distinct hue per section', () => {
    // Not "eight distinct values": the old tints were eight distinct values too -- four
    // hues repeated in pairs -- so a `Set` of the strings passes against the broken code.
    // One hue per section is the property that was actually missing. (In the dark theme
    // the old fills were also all under 5% saturation, i.e. greyscale.)
    const fills = Array.from({ length: 8 }, (_, i) => vars[`fillType${i}`]);
    expect(fills.every((fill) => typeof fill === 'string' && fill.length > 0)).toBe(true);
    const hues = fills.map((fill) => Math.round(hue(fill)));
    expect(new Set(hues).size).toBe(8);
  });

  it('bands gantt sections with two visibly different colours', () => {
    // `gantt/styles.js` paints bands at 20% opacity, so what matters is how the two
    // composite over the canvas -- not whether the source strings differ. On the previous
    // code they differed as strings while compositing to a max-channel delta of 4 in the
    // light theme and 0 in the dark one: no visible banding at all, which a `not.toBe`
    // assertion accepts without complaint. The tuned bands land at 35 in both.
    const band0 = compositeOver(vars.sectionBkgColor, vars.background, GANTT_BAND_OPACITY);
    const band2 = compositeOver(vars.sectionBkgColor2, vars.background, GANTT_BAND_OPACITY);
    expect(maxChannelDelta(band0, band2)).toBeGreaterThanOrEqual(16);
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
