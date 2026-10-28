// @ts-expect-error Incorrect khroma types
import { luminance } from 'khroma';
import { describe, it, expect } from 'vitest';
import getStyles from './styles.js';

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
    expect(valueFor(getStyles({ background: '#ffffff' }), parts('.c4-shape rect'), 'fill')).toBe(
      '#ffffff'
    );
  });

  it('derives each element type its own identity colour from the palette', () => {
    const css = getStyles({ background: '#ffffff' });

    // person (#08427B) and container (#438DD5) are different palette entries, so the
    // rules must not collapse to a single colour.
    expect(valueFor(css, parts('.c4-shape.c4-person rect'), 'stroke')).not.toBe(
      valueFor(css, parts('.c4-shape.c4-container rect'), 'stroke')
    );
  });

  // The regression the outline look risks: deriving the identity colour without regard to
  // the surface puts a dark border and dark label text on a dark body.
  it('lightens the identity colour on a dark surface instead of darkening it', () => {
    const person = parts('.c4-shape.c4-person rect');
    const onLight = valueFor(getStyles({ background: '#ffffff' }), person, 'stroke');
    const onDark = valueFor(getStyles({ background: '#333333' }), person, 'stroke');

    expect(luminance(onDark)).toBeGreaterThan(luminance(onLight));
  });

  it('carries the identity colour on the group so the label inherits it', () => {
    const css = getStyles({ background: '#ffffff' });

    expect(valueFor(css, group('.c4-shape.c4-person'), 'color')).toBe(
      valueFor(css, parts('.c4-shape.c4-person rect'), 'stroke')
    );
    expect(valueFor(css, parts('.c4-shape .label'), 'fill')).toBe('currentColor');
  });
});
