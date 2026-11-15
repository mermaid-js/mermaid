/**
 * The use case diagram takes its colours by *role* -- one colour per kind of element --
 * rather than by handing each element a slot from the theme's categorical palette.
 *
 * That is the default for three reasons, and each has an assertion here:
 *
 *   1. Stability. A rotating counter binds colour to declaration order, so inserting one
 *      use case recolours every element after it, wrecking diffs, documentation
 *      screenshots and visual baselines. Role colour is invariant under insertion,
 *      reordering and renaming.
 *   2. Colour should not compete with shape. The shape already carries the type -- stick
 *      figure, ellipse, frame -- so rotating hue across ellipses adds a second encoding
 *      that means nothing, and readers go looking for the meaning anyway.
 *   3. Contrast can be tuned once per theme instead of being a per-instance lottery.
 *
 * `usecase.colorScheme: 'rotate'` is the escape hatch for anyone who wants the variety;
 * `paletteCssGeneration.spec.ts` covers the rules it emits. `classDef` / `style` keep
 * working under both, which is the real escape hatch for semantic colour.
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as configApi from '../../config.js';
import type { MermaidConfig } from '../../config.type.js';
import themes from '../../themes/index.js';
import getStyles from './styles.js';

const COLOUR_THEMES = [
  'redux-color',
  'redux-dark-color',
] as const satisfies MermaidConfig['theme'][];

const render = (
  theme: MermaidConfig['theme'],
  config: Partial<MermaidConfig> = {},
  overrides: Record<string, unknown> = {}
) => {
  const themeVariables = themes[theme as keyof typeof themes].getThemeVariables({});
  const options = {
    ...(themeVariables as unknown as Record<string, unknown>),
    theme,
    look: 'classic',
    ...overrides,
  };
  configApi.reset();
  configApi.setSiteConfig({ theme, look: 'classic', themeVariables: options, ...config });
  return getStyles(options);
};

/** Every rule block keyed by a palette slot, whichever kind of element it targets. */
const slotRules = (css: string) => [...css.matchAll(/\[data-color-id="color-\d+"]/g)].length;

/** Slot rules that paint an actor or a use case -- the ones `role` must not emit. */
const leafSlotRules = (css: string) =>
  [...css.matchAll(/\[data-color-id="color-\d+"]\.usecase-(?:actor|element)/g)].length;

/** Slot rules that paint a system boundary -- emitted under both schemes. */
const boundarySlotRules = (css: string) =>
  [...css.matchAll(/\[data-color-id="color-\d+"]\.system-boundary/g)].length;

afterEach(() => {
  configApi.reset();
});

describe('usecase role colours', () => {
  it.each(COLOUR_THEMES)('gives actors and use cases no palette slot for %s', (theme) => {
    // The default is `role`, so a colour theme alone must not start rotating the leaves.
    expect(leafSlotRules(render(theme))).toBe(0);
  });

  it.each(COLOUR_THEMES)('still numbers the system boundaries for %s', (theme) => {
    // Boundaries are the exception, and the reason is that the counter means something for
    // a container: slot N is "the Nth group". Flowchart subgraphs are numbered the same way.
    expect(boundarySlotRules(render(theme))).toBeGreaterThan(0);
  });

  it.each(COLOUR_THEMES)('gives actors and use cases a slot for %s when rotating', (theme) => {
    // Pinned alongside the assertion above so the two cannot both be satisfied by a
    // stylesheet that simply never emits slot rules at all.
    expect(leafSlotRules(render(theme, { usecase: { colorScheme: 'rotate' } }))).toBeGreaterThan(0);
  });

  it('emits no slot rules at all on a theme without a palette', () => {
    // Including the boundary ones: with no palette there is nothing to number with.
    expect(slotRules(render('neutral'))).toBe(0);
    expect(slotRules(render('neutral', { usecase: { colorScheme: 'rotate' } }))).toBe(0);
  });

  it('gives actors, use cases and boundaries three distinct role colours', () => {
    // The boundary token is the fallback for themes with no palette to number with, so it
    // still has to be distinguishable from the other two.
    const css = render('redux-color');
    const themeVariables = themes['redux-color'].getThemeVariables({}) as unknown as Record<
      string,
      string
    >;
    const roles = [
      themeVariables.usecaseActorBorder,
      themeVariables.usecaseBorder,
      themeVariables.usecaseBoundaryBorder,
    ];
    // Distinct: the whole point of a role token is that the kind is legible from the
    // colour, which fails if two kinds share one.
    expect(new Set(roles).size).toBe(3);
    for (const color of roles) {
      expect(css).toContain(color);
    }
  });

  it('falls back to the previous colours when a theme declares no role tokens', () => {
    // Adding the tokens must not restyle the themes that do not set them. `neutral` is one
    // of those, so its use case bodies still resolve to `mainBkg` / `nodeBorder`.
    const themeVariables = themes.neutral.getThemeVariables({}) as unknown as Record<
      string,
      string
    >;
    const css = render('neutral');
    expect(themeVariables.usecaseBorder).toBeUndefined();
    expect(css).toContain(`fill: ${themeVariables.mainBkg};`);
    expect(css).toContain(`stroke: ${themeVariables.nodeBorder};`);
  });

  it('separates include from extend by hue, not only by dash', () => {
    const css = render('redux-color');
    const themeVariables = themes['redux-color'].getThemeVariables({}) as unknown as Record<
      string,
      string
    >;
    expect(themeVariables.usecaseIncludeLine).not.toBe(themeVariables.usecaseExtendLine);
    expect(css).toMatch(
      new RegExp(`\\.relationship-include \\{\\s*stroke: ${themeVariables.usecaseIncludeLine};`)
    );
    expect(css).toMatch(
      new RegExp(`\\.relationship-extend \\{\\s*stroke: ${themeVariables.usecaseExtendLine};`)
    );
  });

  /**
   * The neo look -- the default -- ships rules like `[data-look="neo"].node rect` and
   * `[data-look="neo"].node path` that land directly on the elements the role rules are
   * trying to colour. A plain `.usecase-element rect` selector is one class short of them,
   * and on a tie the later stylesheet wins, so the role colour silently lost: a `[Rect]`
   * use case kept the node border colour while its ellipse siblings took the role colour.
   *
   * Asserted on the emitted selectors rather than on rendered pixels, because the failure
   * is invisible in any theme where the two colours happen to be close.
   */
  describe('outranking the neo look', () => {
    const qualified = (css: string, suffix: string) =>
      css.includes(`[data-look="neo"].node.usecase-element ${suffix}`);

    it('qualifies the use case body rules under neo', () => {
      const css = render('redux-color', {}, { look: 'neo' });
      expect(qualified(css, 'rect')).toBe(true);
      expect(qualified(css, 'ellipse')).toBe(true);
    });

    it('qualifies the business marker rule under neo', () => {
      expect(render('redux-color', {}, { look: 'neo' })).toContain(
        '[data-look="neo"].node.usecase-element .usecase-business-marker'
      );
    });

    it('qualifies the actor glyph rule under neo', () => {
      // Three classes deep, which already clears `[data-look="neo"].node path`.
      expect(render('redux-color', {}, { look: 'neo' })).toContain(
        '.node.usecase-actor .usecase-actor-glyph path'
      );
    });

    it('omits the element-qualified rules under handDrawn', () => {
      // roughjs draws paths, so there is no `<rect>` or `<ellipse>` to qualify -- and the
      // glyph rule must stay out entirely, or a hollow actor fills in.
      const css = render('redux-color', {}, { look: 'handDrawn' });
      expect(qualified(css, 'rect')).toBe(false);
      expect(css).not.toContain('.usecase-actor-glyph path');
    });
  });

  it('honours a themeVariables override of a role token', () => {
    // The tokens are reachable through `themeVariables` even on a theme that never declares
    // them, which is what makes them a usable customisation point.
    const css = render('neutral', {}, { usecaseBorder: '#123456' });
    expect(css).toContain('stroke: #123456;');
  });
});
