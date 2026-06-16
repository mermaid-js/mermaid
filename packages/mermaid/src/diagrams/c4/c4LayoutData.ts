import { hsl } from 'd3';
import type { MermaidConfig } from '../../config.type.js';
import type { ShapeID } from '../../rendering-util/rendering-elements/shapes.js';
import type { Edge, LayoutData, Node } from '../../rendering-util/types.js';

/**
 * Adapter that converts the legacy C4 db state (c4ShapeArray / boundaries / rels)
 * into the unified renderer's LayoutData format. Lives in a separate file so the
 * legacy c4Db keeps its exact shape (and so the JS to TS conversion in #7829 is
 * not duplicated here).
 */

interface C4Text {
  text: string;
}

interface C4Shape {
  alias: string;
  label: C4Text;
  typeC4Shape: C4Text;
  parentBoundary: string;
  techn?: C4Text;
  descr?: C4Text;
  bgColor?: string;
  fontColor?: string;
  borderColor?: string;
  link?: string;
  shape?: string;
  sprite?: string;
  tags?: string;
  shadowing?: string;
}

interface C4Boundary {
  alias: string;
  label: C4Text;
  type: C4Text;
  parentBoundary: string;
  descr?: C4Text;
  nodeType?: string;
  bgColor?: string;
  fontColor?: string;
  borderColor?: string;
  link?: string | null;
}

interface C4Rel {
  type: string;
  from: string;
  to: string;
  label: C4Text;
  techn?: C4Text;
  descr?: C4Text;
  textColor?: string;
  lineColor?: string;
}

interface C4Db {
  getC4ShapeArray: (parentBoundary?: string) => C4Shape[];
  getBoundaries: (parentBoundary?: string) => C4Boundary[];
  getRels: () => C4Rel[];
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
  person: 'c4-person',
  box: 'rounded',
  rounded: 'rounded',
  folder: 'c4-folder',
  directory: 'c4-folder',
  cylinder: 'cylinder',
  database: 'cylinder',
  db: 'cylinder',
  queue: 'h-cyl',
  pipe: 'h-cyl',
  bucket: 'c4-bucket',
  blob: 'c4-bucket',
  s3: 'c4-bucket',
  terminal: 'c4-terminal',
  console: 'c4-terminal',
  browser: 'c4-browser',
  spa: 'c4-browser',
  component: 'fr-rect',
};

const keywordShape = (value: string | undefined): ShapeID | undefined =>
  value ? SHAPE_KEYWORDS[value.toLowerCase()] : undefined;

/**
 * Resolves the render shape for a C4 element: explicit $shape/$sprite first,
 * then a recognised $tags token, then the element type.
 */
const resolveNodeShape = (shape: C4Shape): ShapeID => {
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
    return 'c4-person';
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

const escapeHtml = (txt: string): string =>
  txt.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const buildNodeLabel = (shape: C4Shape): string => {
  const stereotype = stereotypeLabel(shape.typeC4Shape.text);
  const type = shape.techn?.text
    ? `[${escapeHtml(stereotype)}: ${escapeHtml(shape.techn.text)}]`
    : `[${escapeHtml(stereotype)}]`;
  const lines: string[] = [
    `<b>${escapeHtml(shape.label.text)}</b>`,
    `<span class="c4-type">${type}</span>`,
  ];
  if (shape.descr?.text) {
    lines.push(`<span class="c4-descr">${escapeHtml(shape.descr.text)}</span>`);
  }
  return lines.join('<br/>');
};

const buildBoundaryLabel = (boundary: C4Boundary): string => {
  const lines: string[] = [`<b>${escapeHtml(boundary.label.text)}</b>`];
  const type = boundary.type?.text;
  const implicit = type?.toLowerCase();
  if (type && implicit !== 'system' && implicit !== 'container') {
    lines.push(`<span class="c4-type">[${escapeHtml(type)}]</span>`);
  }
  return lines.join('<br/>');
};

const buildEdgeLabel = (rel: C4Rel): string => {
  const lines: string[] = [`<b>${escapeHtml(rel.label.text)}</b>`];
  if (rel.techn?.text) {
    lines.push(`<small><i>[${escapeHtml(rel.techn.text)}]</i></small>`);
  }
  if (rel.descr?.text) {
    lines.push(`<small>${escapeHtml(rel.descr.text)}</small>`);
  }
  return lines.join('<br/>');
};

const elementCssStyles = (
  element: Pick<C4Shape, 'bgColor' | 'fontColor' | 'borderColor'>
): string[] => {
  const styles: string[] = [];
  if (element.bgColor) {
    styles.push(`fill:${element.bgColor}`);
  }
  if (element.borderColor) {
    styles.push(`stroke:${element.borderColor}`);
  }
  if (element.fontColor) {
    styles.push(`color:${element.fontColor}`);
  }
  return styles;
};

// Clamp a palette color dark enough to read as text/border on a light fill.
const ensureReadable = (color: string): string => {
  const c = hsl(color);
  if (Number.isNaN(c.l)) {
    return color;
  }
  c.l = Math.min(c.l, 0.42);
  return c.formatHex();
};

/**
 * Outline styling for an element type: the c4 palette color becomes the border
 * and text (the element's identity), over a light fill, as on c4model.com.
 */
const configColorStyles = (
  typeC4Shape: string,
  c4Config: Record<string, any>,
  background: string
): string[] => {
  const styles: string[] = [`fill:${background}`];
  const bg = c4Config[`${typeC4Shape}_bg_color`];
  if (typeof bg === 'string') {
    const identity = ensureReadable(bg);
    styles.push(`stroke:${identity}`, `color:${identity}`);
  }
  return styles;
};

export const getData = (db: C4Db, config: MermaidConfig): LayoutData => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const c4Config: Record<string, any> = config.c4 ?? {};
  const background = config.themeVariables?.background ?? '#ffffff';
  // Generous internal padding so labels never crowd the element borders.
  const shapePadding = typeof c4Config.c4ShapePadding === 'number' ? c4Config.c4ShapePadding : 20;

  const boundaries = db.getBoundaries().filter((boundary) => boundary.alias !== 'global');
  const boundaryAliases = new Set(boundaries.map((boundary) => boundary.alias));

  const parentIdOf = (parentBoundary: string): string | undefined =>
    parentBoundary && parentBoundary !== 'global' && boundaryAliases.has(parentBoundary)
      ? parentBoundary
      : undefined;

  for (const boundary of boundaries) {
    const isDeploymentNode = boundary.nodeType !== undefined;
    nodes.push({
      id: boundary.alias,
      label: buildBoundaryLabel(boundary),
      isGroup: true,
      shape: 'rect',
      parentId: parentIdOf(boundary.parentBoundary),
      cssClasses: isDeploymentNode ? 'c4-boundary c4-deployment-node' : 'c4-boundary',
      cssStyles: elementCssStyles(boundary),
      link: boundary.link ?? undefined,
      look: config.look,
    });
  }

  for (const shape of db.getC4ShapeArray()) {
    const type = shape.typeC4Shape.text;
    nodes.push({
      id: shape.alias,
      label: buildNodeLabel(shape),
      isGroup: false,
      shape: resolveNodeShape(shape),
      parentId: parentIdOf(shape.parentBoundary),
      padding: shapePadding,
      cssClasses: `c4-shape c4-${type}${isExternal(type) ? ' c4-external' : ''}`,
      cssStyles: [...configColorStyles(type, c4Config, background), ...elementCssStyles(shape)],
      link: shape.link,
      look: config.look,
    });
  }

  db.getRels().forEach((rel, index) => {
    const isBidirectional = rel.type === 'birel';
    const isBack = rel.type === 'rel_b';
    const style: string[] = [];
    const labelStyle: string[] = [];
    if (rel.lineColor) {
      style.push(`stroke:${rel.lineColor}`);
    }
    if (rel.textColor) {
      labelStyle.push(`color:${rel.textColor}`);
    }
    edges.push({
      id: `c4-edge-${index}-${rel.from}-${rel.to}`,
      start: rel.from,
      end: rel.to,
      label: buildEdgeLabel(rel),
      arrowTypeStart: isBidirectional || isBack ? 'arrow_point' : undefined,
      arrowTypeEnd: isBack ? undefined : 'arrow_point',
      style,
      labelStyle,
      classes: 'c4-rel',
      // Straight lines matching c4model.com, with the label centered on the line's
      // midpoint (not beside it, where the layout label point can sit).
      curve: 'linear',
      centerLabelOnLine: true,
      look: config.look,
    });
  });

  return {
    nodes,
    edges,
    config,
  };
};
