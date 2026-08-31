/**
 * Lanes take a per-lane colour under the redux colour themes, the same way flowchart
 * subgraphs do — a lane is a participant, which is exactly what a categorical palette is
 * for.
 *
 * These assertions are about the shape of the emitted CSS, because that is where this
 * wiring fails silently. A lane renders identically whether a declaration was discarded,
 * outranked, or never emitted, so nothing downstream reports the difference:
 *
 *   1. A lane is two rects — the title band and the body — under classic and neo, and two
 *      roughjs path pairs under handDrawn. Missing either half leaves a lane half-painted.
 *   2. The generic `.cluster` palette rules must not reach lanes. Under handDrawn a lane
 *      body asks roughjs for no fill, which it answers with a hachure path carrying
 *      `stroke="none"`; the generic `path` rule would paint that invisible hachure and
 *      fill both outline paths solid.
 *   3. The lane-border override in this stylesheet is `!important` — it has to be, to
 *      outrank `[data-look="neo"].cluster rect`, which ties with it on specificity. An
 *      `!important` that also covered palette lanes would outrank every rule above and
 *      lanes would stay grey with no sign of why.
 *   4. `redux-dark-color` ships a border palette and no background palette, so rules
 *      derived from the background array have to be dropped rather than emitted with a
 *      missing value.
 */
import { describe, expect, it } from 'vitest';
import themes from '../../themes/index.js';
import { COLOR_THEMES } from '../common/colorThemeGate.js';
import swimlanesStyles from './styles.js';

const COLOUR_THEMES = [...COLOR_THEMES];
const PLAIN_THEMES = Object.keys(themes).filter((name) => !COLOR_THEMES.has(name));

interface Palette {
  borderColorArray?: string[];
  bkgColorArray?: string[];
  clusterBorder: string;
}

const paletteOf = (themeName: string): Palette =>
  themes[themeName as keyof typeof themes].getThemeVariables({}) as unknown as Palette;

const render = (themeName: string, look = 'neo'): string =>
  swimlanesStyles({
    ...(paletteOf(themeName) as unknown as Record<string, unknown>),
    theme: themeName,
    look,
  } as never);

/** The declaration body of every rule whose selector matches `pattern`. */
const bodiesMatching = (css: string, pattern: RegExp): string[] =>
  [...css.matchAll(/([^{}]+){([^{}]*)}/g)]
    .filter(([, selector]) => pattern.test(selector))
    .map(([, , body]) => body);

describe.each(COLOUR_THEMES)('%s lane palette', (themeName) => {
  const { borderColorArray, bkgColorArray, clusterBorder } = paletteOf(themeName);
  const slots = borderColorArray!.map((_, slot) => slot);

  it.each(slots)('paints both halves of the lane in slot %i', (slot) => {
    const css = render(themeName);
    const prefix = `\\[data-look="neo"\\]\\[data-color-id="color-${slot}"\\]\\.swimlane\\.cluster`;

    // Title band and body share one rule, so the selector has to name both halves --
    // each with the full prefix, or the second would match nothing.
    const laneRect = new RegExp(
      `${prefix} rect\\.swimlane-title,\\s*${prefix} rect\\.swimlane-body \\{([^}]*)\\}`
    ).exec(css);
    expect(laneRect, `no lane rect rule for slot ${slot}`).not.toBeNull();
    expect(laneRect![1]).toContain(`stroke: ${borderColorArray![slot]};`);
    if (bkgColorArray?.length) {
      expect(laneRect![1]).toContain(`fill: ${bkgColorArray[slot]};`);
    }

    // handDrawn: roughjs draws a hachure fill path then the outline path, so the outline
    // is the second one and the only one that takes the border colour.
    const laneOutline = new RegExp(
      `${prefix} \\.swimlane-title path:nth-of-type\\(2\\), ` +
        `${prefix} \\.swimlane-body path:nth-of-type\\(2\\) \\{([^}]*)\\}`
    ).exec(css);
    expect(laneOutline, `no lane outline rule for slot ${slot}`).not.toBeNull();
    expect(laneOutline![1]).toContain(`stroke: ${borderColorArray![slot]};`);
  });

  it('keeps the generic cluster palette rules away from lanes', () => {
    const tails = [...render(themeName).matchAll(/\[data-color-id="color-\d+"]\.cluster([^,{]*)/g)]
      .map((match) => match[1])
      .filter((tail) => !tail.startsWith('.swimlane'));

    expect(tails.length).toBeGreaterThan(0);
    expect(tails.filter((tail) => !tail.startsWith(':not(.swimlane)'))).toEqual([]);
  });

  it('exempts palette lanes from the !important lane border', () => {
    const css = render(themeName);

    expect(css).toContain(`.swimlane.cluster:not([data-color-id]) rect {
    stroke: ${clusterBorder} !important;
  }`);
    // No unscoped form left behind, which would outrank every lane palette rule.
    expect(css).not.toContain('.swimlane.cluster rect {');
  });

  it('never marks a lane palette rule !important', () => {
    // A user's `style` / `classDef` reaches the lane as an inline `style` attribute and
    // has to keep winning over the theme.
    const bodies = bodiesMatching(render(themeName), /\[data-color-id="color-\d+"]\.swimlane/);

    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.filter((body) => body.includes('!important'))).toEqual([]);
  });

  it('emits no empty or undefined declaration', () => {
    const bodies = bodiesMatching(render(themeName), /data-color-id="color-\d+"/);

    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      expect(body).not.toMatch(/:\s*(undefined|NaN)?\s*;/);
    }
  });
});

/**
 * `bkgColorArray` is empty in `redux-dark-color`, which is what makes the guard load
 * bearing rather than defensive: the background-derived rule must be absent there, not
 * emitted with a missing value.
 */
it('emits the handDrawn title fill rule only where a background palette exists', () => {
  expect(paletteOf('redux-color').bkgColorArray?.length).toBeGreaterThan(0);
  expect(paletteOf('redux-dark-color').bkgColorArray ?? []).toHaveLength(0);

  expect(render('redux-color')).toContain('.swimlane-title path:first-of-type');
  expect(render('redux-dark-color')).not.toContain('path:first-of-type');
});

it.each(PLAIN_THEMES)('emits no lane palette rules for %s', (themeName) => {
  const css = render(themeName);

  expect(css).not.toContain('data-color-id="color-');
  // The lane border override still ships for these themes: the exemption is keyed on an
  // attribute nothing stamps outside the colour themes, so their lanes are unchanged.
  expect(css).toContain('.swimlane.cluster:not([data-color-id]) rect');
});
