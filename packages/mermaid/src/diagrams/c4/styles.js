import { getConfig } from '../../diagram-api/diagramAPI.js';
import { C4_ELEMENT_TYPES } from './c4ShapeAdapter.js';
import { readableOn } from './c4Colors.js';

// The elements each C4 shape draws; `person` contributes both a rect and a circle.
const SHAPE_PARTS = ['rect', 'path', 'circle', 'ellipse', 'line'];

// Per-element-type font rules from the c4 config (personFontFamily and friends).
// Built through the CSSOM so config values are parsed as CSS values: a value
// that does not fit the property's grammar (e.g. one smuggling extra
// declarations) is dropped whole instead of landing in the stylesheet.
const elementFontStyles = () => {
  const c4 = getConfig().c4 ?? {};
  const sheet = new CSSStyleSheet();
  for (const type of C4_ELEMENT_TYPES) {
    const rule =
      sheet.cssRules[sheet.insertRule(`.c4-shape.c4-${type} .label {}`, sheet.cssRules.length)];
    const fontFamily = c4[`${type}FontFamily`];
    const fontSize = c4[`${type}FontSize`];
    const fontWeight = c4[`${type}FontWeight`];
    if (fontFamily) {
      rule.style.setProperty('font-family', fontFamily);
    }
    if (fontSize) {
      rule.style.setProperty(
        'font-size',
        typeof fontSize === 'number' ? `${fontSize}px` : fontSize
      );
    }
    if (fontWeight) {
      rule.style.setProperty('font-weight', String(fontWeight));
    }
  }
  return [...sheet.cssRules]
    .filter((rule) => rule.style.length > 0)
    .map((rule) => `  ${rule.cssText}`)
    .join('\n');
};

// The c4model.com outline look: each element type's palette colour becomes its border
// and text - its identity - over the theme's surface colour. Built through the CSSOM for
// the same reason as the font rules, and here rather than inline on the node because the
// theme variables only exist at style-generation time. An `UpdateElementStyle` colour is
// still emitted inline by the shape adapter, which outranks any of this.
const elementColorStyles = (options) => {
  const c4 = getConfig().c4 ?? {};
  const surface = options.background;
  const sheet = new CSSStyleSheet();
  for (const type of C4_ELEMENT_TYPES) {
    const paletteColor = c4[`${type}_bg_color`];
    if (!paletteColor) {
      continue;
    }
    const identity = readableOn(paletteColor, surface);
    const parts = SHAPE_PARTS.map((part) => `.c4-shape.c4-${type} ${part}`).join(', ');
    const strokeRule = sheet.cssRules[sheet.insertRule(`${parts} {}`, sheet.cssRules.length)];
    strokeRule.style.setProperty('stroke', identity);
    // Set on the group so the label inherits it and `fill: currentColor` picks it up.
    const colorRule =
      sheet.cssRules[sheet.insertRule(`.c4-shape.c4-${type} {}`, sheet.cssRules.length)];
    colorRule.style.setProperty('color', identity);
  }
  return [...sheet.cssRules]
    .filter((rule) => rule.style.length > 0)
    .map((rule) => `  ${rule.cssText}`)
    .join('\n');
};

const getStyles = (options) =>
  `${elementFontStyles()}
${elementColorStyles(options)}

  ${SHAPE_PARTS.map((part) => `.c4-shape ${part}`).join(',\n  ')} {
    fill: ${options.background};
    stroke-width: 2px;
  }
  /* The identity colour is set on the element group above; the label follows it. */
  .c4-shape .label,
  .c4-shape .label text {
    color: inherit;
    fill: currentColor;
  }
  /* Structurizr typography: bold name, smaller stereotype/type and description lines. */
  .c4-shape .label .c4-name {
    font-weight: bold;
  }
  .c4-shape .label .c4-type {
    font-size: 0.75em;
  }
  .c4-shape .label .c4-descr {
    font-size: 0.82em;
  }
`;

export default getStyles;
