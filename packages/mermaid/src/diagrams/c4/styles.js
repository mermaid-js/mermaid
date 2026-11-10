import { getConfig } from '../../diagram-api/diagramAPI.js';
import defaultConfig from '../../defaultConfig.js';
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

/**
 * Label groups whose font the c4 config can change from the stylesheet default. The value
 * goes on the outer group; the label nested in it, which the stylesheet sizes on its own in
 * `em`, inherits instead, so a relative size applies once.
 */
const LABEL_FONT_RULES = [{ outer: 'g.edgeLabel', nested: '.edgeLabel', prefix: 'message' }];

/** A number font size is taken as pixels. */
const FONT_PROPERTIES = [
  { suffix: 'FontFamily', property: 'font-family', toCss: String },
  {
    suffix: 'FontSize',
    property: 'font-size',
    toCss: (value) => (typeof value === 'number' ? `${value}px` : String(value)),
  },
  { suffix: 'FontWeight', property: 'font-weight', toCss: String },
];

// Relationship labels (`messageFont*`) keep the stylesheet's own typography unless the config
// sets a value other than its default; only such a value gets a rule, built through the CSSOM
// like the element rules above.
const labelFontStyles = () => {
  const c4 = getConfig().c4 ?? {};
  const defaults = defaultConfig.c4;
  const sheet = new CSSStyleSheet();
  for (const { outer, nested, prefix } of LABEL_FONT_RULES) {
    const outerRule = sheet.cssRules[sheet.insertRule(`${outer} {}`, sheet.cssRules.length)];
    const nestedRule =
      sheet.cssRules[sheet.insertRule(`${outer} ${nested} {}`, sheet.cssRules.length)];
    for (const { suffix, property, toCss } of FONT_PROPERTIES) {
      const key = `${prefix}${suffix}`;
      const value = c4[key];
      if (value !== undefined && value !== null && value !== '' && value !== defaults[key]) {
        outerRule.style.setProperty(property, toCss(value));
        nestedRule.style.setProperty(property, 'inherit');
      }
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
${labelFontStyles()}

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
  /* Boundaries render as unified clusters: a dashed, unfilled box with its
     label above the contents. */
  .cluster rect {
    fill: none;
    stroke: ${options.lineColor ?? '#666666'};
    stroke-width: 1px;
    stroke-dasharray: 8 4;
  }
  .cluster .cluster-label,
  .cluster .nodeLabel {
    color: ${options.textColor ?? '#333333'};
    fill: ${options.textColor ?? '#333333'};
    font-size: 0.9em;
  }
  /* Relationships: dashed lines with an arrowhead, as on c4model.com. */
  .edgePaths .path,
  path.c4-rel {
    stroke: ${options.lineColor ?? '#666666'};
    fill: none;
    stroke-width: 1.5px;
    stroke-dasharray: 6 4;
  }
  .edgePaths .marker {
    fill: ${options.lineColor ?? '#666666'};
    stroke: ${options.lineColor ?? '#666666'};
  }
  /* Relationship labels: smaller, on an opaque background so they stay legible over lines. */
  .edgeLabel {
    font-size: 0.85em;
    background-color: ${options.background ?? '#ffffff'};
  }
  .edgeLabel .label foreignObject {
    overflow: visible;
  }
  /* The label is centred on its line, so it needs an opaque backing or the line
     shows through between the glyphs. The wrapper div carries it for an HTML
     label; a plain SVG label (htmlLabels: false) has a rect instead. */
  .edgeLabel .labelBkg {
    background-color: ${options.background ?? '#ffffff'};
    opacity: 1;
  }
  .edgeLabel rect {
    fill: ${options.background ?? '#ffffff'};
    opacity: 1;
  }
`;

export default getStyles;
