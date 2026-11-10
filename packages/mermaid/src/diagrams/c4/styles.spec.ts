// @ts-expect-error Incorrect khroma types
import { luminance } from 'khroma';
import { describe, it, expect } from 'vitest';
import { mermaidAPI } from '../../mermaidAPI.js';
import getStyles from './styles.js';

/** The selector part that keeps the paint rules off hand-drawn elements. */
const PAINTED = ':where(:not(.rough-node))';

/** Comments sit above the rules they describe, so they would read as selector text. */
const withoutComments = (css: string): string =>
  css
    .split('/*')
    .map((chunk, index) => (index === 0 ? chunk : chunk.slice(chunk.indexOf('*/') + 2)))
    .join('');

/** The generated stylesheet as selector/declaration pairs. */
const rulesOf = (css: string): { selector: string; declarations: string }[] =>
  withoutComments(css)
    .split('}')
    .map((block) => block.split('{'))
    .filter((parts) => parts.length === 2)
    .map(([selector, declarations]) => ({ selector: selector.trim(), declarations }));

/**
 * The value a rule gives one property. `matches` takes the whole selector text, so a
 * rule for the element group can be told apart from the rule for its parts.
 */
const valueFor = (
  css: string,
  matches: (selector: string) => boolean,
  property: string
): string => {
  const rule = rulesOf(css).find(({ selector }) => matches(selector));
  if (!rule) {
    throw new Error(`no matching rule in\n${css}`);
  }
  const declaration = rule.declarations
    .split(';')
    .map((one) => one.trim())
    .find((one) => one.startsWith(`${property}:`));
  if (!declaration) {
    throw new Error(`no "${property}" on "${rule.selector}"`);
  }
  return declaration.slice(property.length + 1).trim();
};

const parts = (selectorStart: string) => (selector: string) => selector.startsWith(selectorStart);
const group = (selectorText: string) => (selector: string) => selector === selectorText;

describe('c4 styles', () => {
  it('puts the element body on the theme surface', () => {
    expect(
      valueFor(getStyles({ background: '#ffffff' }), parts(`.c4-shape${PAINTED} rect`), 'fill')
    ).toBe('#ffffff');
  });

  it('derives each element type its own identity colour from the palette', () => {
    const css = getStyles({ background: '#ffffff' });

    // person (#08427B) and container (#438DD5) are different palette entries, so the
    // rules must not collapse to a single colour.
    expect(valueFor(css, parts(`.c4-shape.c4-person${PAINTED} rect`), 'stroke')).not.toBe(
      valueFor(css, parts(`.c4-shape.c4-container${PAINTED} rect`), 'stroke')
    );
  });

  // The regression the outline look risks: deriving the identity colour without regard to
  // the surface puts a dark border and dark label text on a dark body.
  it('lightens the identity colour on a dark surface instead of darkening it', () => {
    const person = parts(`.c4-shape.c4-person${PAINTED} rect`);
    const onLight = valueFor(getStyles({ background: '#ffffff' }), person, 'stroke');
    const onDark = valueFor(getStyles({ background: '#333333' }), person, 'stroke');

    expect(luminance(onDark)).toBeGreaterThan(luminance(onLight));
  });

  it('carries the identity colour on the group so the label inherits it', () => {
    const css = getStyles({ background: '#ffffff' });

    expect(valueFor(css, group('.c4-shape.c4-person'), 'color')).toBe(
      valueFor(css, parts(`.c4-shape.c4-person${PAINTED} rect`), 'stroke')
    );
    expect(valueFor(css, parts('.c4-shape .label'), 'fill')).toBe('currentColor');
  });

  // `$shape="component"` draws the framed rectangle as a polygon, which has no inline
  // colours of its own.
  it('paints the polygon of a component-shaped element like the other shape parts', () => {
    const css = getStyles({ background: '#ffffff' });
    const hasPart = (part: string) => (selector: string) =>
      selector.split(',').some((one) => one.trim() === part);

    expect(valueFor(css, hasPart(`.c4-shape${PAINTED} polygon`), 'fill')).toBe('#ffffff');
    expect(valueFor(css, hasPart(`.c4-shape.c4-component${PAINTED} polygon`), 'stroke')).toBe(
      valueFor(css, parts(`.c4-shape.c4-component${PAINTED} rect`), 'stroke')
    );
  });

  // RoughJS takes the colours as path attributes and draws the fill as hatching, so a
  // stylesheet rule on a hand-drawn element would repaint both.
  describe('by look', () => {
    const STUB_TEXT_WIDTH = 40;
    const STUB_TEXT_HEIGHT = 20;
    const EXPLICIT_FILL = '#ff0000';

    beforeAll(() => {
      Object.assign(SVGElement.prototype, {
        getComputedTextLength: () => STUB_TEXT_WIDTH,
        getBBox: () => ({ x: 0, y: 0, width: STUB_TEXT_WIDTH, height: STUB_TEXT_HEIGHT }),
        getTotalLength: () => 0,
        getPointAtLength: () => ({ x: 0, y: 0 }),
      });
    });

    const render = async (look: string) => {
      const { svg } = await mermaidAPI.render(
        'c4-look',
        `---\nconfig:\n  look: ${look}\n  handDrawnSeed: 1\n---\nC4Context\nSystem(a, "A")\nUpdateElementStyle(a, $bgColor="${EXPLICIT_FILL}")`
      );
      const host = document.createElement('div');
      host.innerHTML = svg;
      const css = getStyles({ background: '#ffffff' });
      const paintSelectors = rulesOf(css)
        .filter(({ declarations }) => /\b(fill|stroke):/.test(declarations))
        .flatMap(({ selector }) => selector.split(',').map((one) => one.trim()))
        .filter((selector) => !selector.includes('.label'));
      const shapeParts = [...host.querySelectorAll('.c4-shape path, .c4-shape rect')].filter(
        (element) => !element.closest('.label')
      );
      const painted = shapeParts.filter((element) =>
        paintSelectors.some((selector) => element.matches(selector))
      );
      return { shapeParts, painted };
    };

    it('leaves a hand-drawn element to the colours RoughJS gave it', async () => {
      const { shapeParts, painted } = await render('handDrawn');

      expect(shapeParts.length).toBeGreaterThan(0);
      expect(painted).toEqual([]);
      expect(
        shapeParts.some((element) =>
          [element.getAttribute('fill'), element.getAttribute('stroke')].includes(EXPLICIT_FILL)
        )
      ).toBe(true);
    });

    it('still paints an element in the classic look', async () => {
      const { shapeParts, painted } = await render('classic');

      expect(shapeParts.length).toBeGreaterThan(0);
      expect(painted.length).toBe(shapeParts.length);
    });
  });
});
