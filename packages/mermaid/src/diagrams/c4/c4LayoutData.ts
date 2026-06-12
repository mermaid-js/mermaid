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

const getNodeShape = (typeC4Shape: string): ShapeID => {
  if (DB_SHAPES.has(typeC4Shape)) {
    return 'cylinder';
  }
  if (QUEUE_SHAPES.has(typeC4Shape)) {
    return 'h-cyl';
  }
  return 'rect';
};

/**
 * The type line rendered above the element name, e.g. `<<system>>`.
 * Mirrors the legacy renderer which displays the C4-PlantUML stereotype.
 */
const typeLabel = (typeC4Shape: string): string => {
  return typeC4Shape.replace(/^external_/, '').replace(/_/g, ' ');
};

const isExternal = (typeC4Shape: string): boolean => typeC4Shape.startsWith('external_');

const escapeHtml = (txt: string): string =>
  txt.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const buildNodeLabel = (shape: C4Shape): string => {
  const lines: string[] = [];
  lines.push(`<small>&laquo;${escapeHtml(typeLabel(shape.typeC4Shape.text))}&raquo;</small>`);
  lines.push(`<b>${escapeHtml(shape.label.text)}</b>`);
  if (shape.techn?.text) {
    lines.push(`<small><i>[${escapeHtml(shape.techn.text)}]</i></small>`);
  }
  if (shape.descr?.text) {
    lines.push(escapeHtml(shape.descr.text));
  }
  return lines.join('<br/>');
};

const buildBoundaryLabel = (boundary: C4Boundary): string => {
  const lines: string[] = [`<b>${escapeHtml(boundary.label.text)}</b>`];
  const type = boundary.type?.text;
  if (type && type !== 'system' && type !== 'container') {
    lines.push(`<small>[${escapeHtml(type)}]</small>`);
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

/**
 * Default fill/stroke for an element type from the c4 config color keys
 * (person_bg_color, external_system_border_color, ...), so the unified
 * renderer keeps the exact palette of the legacy renderer.
 */
const configColorStyles = (typeC4Shape: string, c4Config: Record<string, any>): string[] => {
  const styles: string[] = [];
  const bg = c4Config[`${typeC4Shape}_bg_color`];
  const border = c4Config[`${typeC4Shape}_border_color`];
  if (bg) {
    styles.push(`fill:${bg}`);
  }
  if (border) {
    styles.push(`stroke:${border}`);
  }
  return styles;
};

export const getData = (db: C4Db, config: MermaidConfig): LayoutData => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const c4Config: Record<string, any> = config.c4 ?? {};

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
      shape: getNodeShape(type),
      parentId: parentIdOf(shape.parentBoundary),
      cssClasses: `c4-shape c4-${type}${isExternal(type) ? ' c4-external' : ''}`,
      cssStyles: [...configColorStyles(type, c4Config), ...elementCssStyles(shape)],
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
      look: config.look,
    });
  });

  return {
    nodes,
    edges,
    config,
  };
};
