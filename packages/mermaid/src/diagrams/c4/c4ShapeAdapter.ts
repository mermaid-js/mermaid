import type { C4DiagramConfig } from '../../config.type.js';
import type { ShapeID } from '../../rendering-util/rendering-elements/shapes.js';
import type { NonClusterNode } from '../../rendering-util/types.js';

/**
 * Builds a unified-renderer {@link Node} from a legacy C4 shape so the legacy
 * renderer can draw elements through the shared unified shapes (the first
 * "migrate shapes" step of the C4 renderer migration). Layout still comes from
 * the legacy grid; only the drawing is delegated to the unified shapes.
 */

interface C4Text {
  text: string;
}

/** The subset of a legacy C4 shape the adapter reads. */
export interface C4ShapeLike {
  alias: string;
  label: C4Text;
  typeC4Shape: C4Text;
  techn?: C4Text;
  descr?: C4Text;
  bgColor?: string;
  fontColor?: string;
  borderColor?: string;
  shape?: string;
  sprite?: string;
  tags?: string;
}

const QUEUE_SHAPES = new Set([
  'system_queue',
  'external_system_queue',
  'container_queue',
  'external_container_queue',
  'component_queue',
  'external_component_queue',
]);

const DB_SHAPES = new Set([
  'system_db',
  'external_system_db',
  'container_db',
  'external_container_db',
  'component_db',
  'external_component_db',
]);

// Structurizr-style shape keywords accepted via $shape, $sprite or $tags.
const SHAPE_KEYWORDS: Record<string, ShapeID> = {
  person: 'person',
  box: 'rounded',
  rounded: 'rounded',
  cylinder: 'cylinder',
  database: 'cylinder',
  db: 'cylinder',
  queue: 'h-cyl',
  pipe: 'h-cyl',
  component: 'fr-rect',
};

const keywordShape = (value: string | undefined): ShapeID | undefined =>
  value ? SHAPE_KEYWORDS[value.toLowerCase()] : undefined;

/**
 * Resolves the render shape for a C4 element: explicit $shape/$sprite first,
 * then a recognised $tags token, then the element type.
 */
export const resolveNodeShape = (shape: C4ShapeLike): ShapeID => {
  const explicit = keywordShape(shape.shape) ?? keywordShape(shape.sprite);
  if (explicit) {
    return explicit;
  }
  if (shape.tags) {
    for (const tag of shape.tags.split(',')) {
      const tagged = keywordShape(tag.trim());
      if (tagged) {
        return tagged;
      }
    }
  }
  const typeC4Shape = shape.typeC4Shape.text;
  if (typeC4Shape === 'person' || typeC4Shape === 'external_person') {
    return 'person';
  }
  if (DB_SHAPES.has(typeC4Shape)) {
    return 'cylinder';
  }
  if (QUEUE_SHAPES.has(typeC4Shape)) {
    return 'h-cyl';
  }
  return 'rounded';
};

const STEREOTYPE_NAMES: Record<string, string> = {
  person: 'Person',
  system: 'Software System',
  container: 'Container',
  component: 'Component',
};

// Structurizr-style stereotype, e.g. `Software System` for system / system_db / external_system.
const stereotypeLabel = (typeC4Shape: string): string => {
  const base = typeC4Shape.replace(/^external_/, '').replace(/_(db|queue)$/, '');
  return STEREOTYPE_NAMES[base] ?? base.replace(/_/g, ' ');
};

const isExternal = (typeC4Shape: string): boolean => typeC4Shape.startsWith('external_');

// Structurizr-style type line, e.g. `[Container: Node.js]`.
const stereotypeText = (shape: C4ShapeLike): string => {
  const stereotype = stereotypeLabel(shape.typeC4Shape.text);
  return shape.techn?.text ? `[${stereotype}: ${shape.techn.text}]` : `[${stereotype}]`;
};

const escapeHtml = (txt: string): string =>
  txt
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/**
 * A colour from the diagram source, accepted only if it is a colour on its own. The value is
 * interpolated into a CSS declaration, so one carrying `;` or a `url(...)` could append
 * further declarations; `CSS.supports` rejects those, and anything it cannot judge (no
 * CSS API, as in jsdom) falls back to a conservative pattern match.
 */
export const asColor = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value === '') {
    return undefined;
  }
  const accepted =
    typeof globalThis.CSS?.supports === 'function'
      ? globalThis.CSS.supports('color', value)
      : /^(#[\da-f]{3,8}|[a-z]+|rgba?\([\d\s%,./]+\)|hsla?\([\d\s%,./deg]+\))$/i.test(value);
  return accepted ? value : undefined;
};

/**
 * A C4 relationship label: name, then optional `[technology]` and description, one per
 * line. `<br/>` separates the lines either way, since it is a line break in an HTML
 * label and a line delimiter in a plain SVG one. The emphasis tags only render as
 * emphasis in an HTML label; with `htmlLabels` off they would show as literal text, so
 * the plain form carries the same words without them.
 */
export const buildEdgeLabel = (
  rel: { label: C4Text; techn?: C4Text; descr?: C4Text },
  useHtmlLabels = true
): string => {
  const parts = [rel.label.text, rel.techn?.text && `[${rel.techn.text}]`, rel.descr?.text].filter(
    (part): part is string => Boolean(part)
  );
  if (!useHtmlLabels) {
    return parts.join('<br/>');
  }
  const [name, ...rest] = parts.map((part) => escapeHtml(part));
  const lines = [`<b>${name}</b>`];
  if (rel.techn?.text) {
    lines.push(`<small><i>${rest.shift()}</i></small>`);
  }
  for (const part of rest) {
    lines.push(`<small>${part}</small>`);
  }
  return lines.join('<br/>');
};

/** The C4 element types, internal and external, that carry per-type config. */
export const C4_ELEMENT_TYPES = (
  [
    'person',
    'system',
    'system_db',
    'system_queue',
    'container',
    'container_db',
    'container_queue',
    'component',
    'component_db',
    'component_queue',
  ] as const
).flatMap((type) => [type, `external_${type}`] as const);

const C4_ELEMENT_TYPE_SET = new Set<string>(C4_ELEMENT_TYPES);

const isC4ElementType = (value: string): value is (typeof C4_ELEMENT_TYPES)[number] =>
  C4_ELEMENT_TYPE_SET.has(value);

/**
 * Element colours: the per-element `<type>_bg_color`/`<type>_border_color` config
 * palette drives the fill and border, with white text. An explicit per-element
 * colour (UpdateElementStyle: $bgColor/$borderColor/$fontColor) overrides it.
 */
const elementCssStyles = (shape: C4ShapeLike, config: C4DiagramConfig): string[] => {
  const elementType = shape.typeC4Shape.text;
  const fill = shape.bgColor ?? (isC4ElementType(elementType) && config[`${elementType}_bg_color`]);
  const stroke =
    shape.borderColor ?? (isC4ElementType(elementType) && config[`${elementType}_border_color`]);
  const styles: string[] = [];
  if (fill) {
    styles.push(`fill:${fill}`);
  }
  if (stroke) {
    styles.push(`stroke:${stroke}`);
  }
  styles.push(`color:${shape.fontColor ?? '#FFFFFF'}`);
  return styles;
};

/**
 * Converts a legacy C4 shape into a unified-renderer Node. `config` is the c4
 * diagram config, whose `<type>_bg_color`/`<type>_border_color` palette drives the fill and border.
 * `elementWidth` is the target shape width (`c4.width`); the label helper
 * derives its own text-wrapping width from it.
 */
export const buildC4Node = (
  shape: C4ShapeLike,
  config: C4DiagramConfig,
  padding: number,
  look: string,
  elementWidth: number
): NonClusterNode => {
  const typeC4Shape = shape.typeC4Shape.text;
  const cssClasses = ['c4-shape', `c4-${typeC4Shape}`];
  if (isExternal(typeC4Shape)) {
    cssClasses.push('c4-external');
  }
  const nodeShape = resolveNodeShape(shape);
  const cssStyles = elementCssStyles(shape, config);
  if (nodeShape === 'rounded' || nodeShape === 'fr-rect') {
    // Inline so it wins over the shape's default corner radius.
    cssStyles.push('rx:12px', 'ry:12px');
  }
  return {
    id: shape.alias,
    label: shape.label.text,
    stereotype: stereotypeText(shape),
    description: shape.descr?.text ? [shape.descr.text] : undefined,
    labelType: 'string',
    isGroup: false,
    shape: nodeShape,
    cssClasses: cssClasses.join(' '),
    cssStyles,
    padding,
    look,
    useHtmlLabels: false,
    width: elementWidth,
  };
};
