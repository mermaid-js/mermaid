import { getConfig } from '../../diagram-api/diagramAPI.js';
import { C4_ELEMENT_TYPES } from './c4ShapeAdapter.js';

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

const getStyles = (options) =>
  `.person {
    stroke: ${options.personBorder};
    fill: ${options.personBkg};
  }
${elementFontStyles()}

  /* The element font colour is set inline per element (default white); the
     label text takes it via currentColor. */
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
  .c4-shape .basic,
  .c4-shape rect,
  .c4-shape path,
  .c4-shape circle,
  .c4-shape ellipse,
  .c4-shape line {
    stroke-width: 2px;
  }
`;

export default getStyles;
