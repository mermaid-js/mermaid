import type { MermaidConfig } from '../../config.type.js';
import { getEffectiveHtmlLabels } from '../../config.js';
import type { Edge, LayoutData, Node } from '../../rendering-util/types.js';
import type {
  C4Boundary,
  C4ElementTag,
  C4LabelNudge,
  C4Rel,
  C4RelTag,
  C4Shape,
} from './c4Types.js';
import type { C4TagStyle } from './c4ShapeAdapter.js';
import { asColor, buildC4Node, buildEdgeLabel } from './c4ShapeAdapter.js';

/**
 * Converts the legacy C4 db state (elements, boundaries, relationships) into the
 * unified renderer's {@link LayoutData}, so C4 diagrams are laid out by the shared
 * pipeline instead of the legacy row grid. Element nodes are built by the same
 * adapter the legacy renderer already used, so the elements themselves render
 * identically; only their placement changes.
 */

/** The parts of the C4 db this adapter reads. */
interface C4Db {
  getC4ShapeArray: (parentBoundary?: string) => C4Shape[];
  getBoundaries: (parentBoundary?: string) => C4Boundary[];
  getRels: () => C4Rel[];
  getC4Type: () => string | undefined;
  getDirection: () => string;
  getElementTags: () => C4ElementTag[];
  getRelTags: () => C4RelTag[];
}

/**
 * The tags an element or relationship names in `$tags`, resolved against the tags the
 * diagram defined. Later tags win, so a list reads left to right like a CSS class list.
 * A name with no matching definition contributes nothing.
 */
const resolveTags = <T extends { tagName: string }>(
  tags: string | undefined,
  defined: Map<string, T>
): T[] =>
  tags
    ? tags
        .split(',')
        .map((tag) => defined.get(tag.trim()))
        .filter((tag): tag is T => tag !== undefined)
    : [];

/** Merges the matched tags into one style, later tags overriding earlier ones. */
const mergeTagStyle = (tags: C4ElementTag[]): C4TagStyle | undefined => {
  if (tags.length === 0) {
    return undefined;
  }
  const merged: C4TagStyle = {};
  for (const tag of tags) {
    merged.bgColor = tag.bgColor ?? merged.bgColor;
    merged.fontColor = tag.fontColor ?? merged.fontColor;
    merged.borderColor = tag.borderColor ?? merged.borderColor;
    merged.shape = tag.shape ?? merged.shape;
  }
  return merged;
};

/**
 * A boundary's own type is only worth showing when it is not the implied one:
 * `System_Boundary`, `Container_Boundary` and `Node` all carry a type that just
 * restates the keyword.
 */
const IMPLICIT_BOUNDARY_TYPES = new Set(['system', 'container', 'node']);

/**
 * The grammar injects its boundary kind in upper case. A type that arrived from
 * the diagram source instead is shown verbatim.
 */
const BOUNDARY_TYPE_LABELS: Record<string, string> = { enterprise: 'Enterprise' };

const boundaryLabel = (boundary: C4Boundary): string => {
  const type = boundary.type?.text;
  if (!type || IMPLICIT_BOUNDARY_TYPES.has(type.toLowerCase())) {
    return boundary.label.text;
  }
  return `${boundary.label.text} [${BOUNDARY_TYPE_LABELS[type.toLowerCase()] ?? type}]`;
};

/**
 * Explicit colours applied to a boundary. `UpdateElementStyle` resolves its alias
 * against the elements first and then the boundaries, so it styles both. A boundary
 * has no palette to fall back to, so a value that is not a colour is dropped.
 */
const boundaryCssStyles = (boundary: C4Boundary): string[] => {
  const styles: string[] = [];
  const fill = asColor(boundary.bgColor);
  const stroke = asColor(boundary.borderColor);
  const color = asColor(boundary.fontColor);
  if (fill) {
    styles.push(`fill:${fill}`);
  }
  if (stroke) {
    styles.push(`stroke:${stroke}`);
  }
  if (color) {
    styles.push(`color:${color}`);
  }
  return styles;
};

/**
 * The label nudge an `UpdateRelStyle` asked for.
 *
 * A named attribute lands in a slot that is not parsed, so the db holds these as strings as often
 * as numbers; a value that is not a number at all is dropped rather than shifting the label by NaN.
 */
const labelNudge = (rel: C4Rel): C4LabelNudge => {
  const nudge: C4LabelNudge = {};
  const x = Number(rel.offsetX);
  const y = Number(rel.offsetY);
  if (rel.offsetX !== undefined && rel.offsetX !== null && !Number.isNaN(x)) {
    nudge.labelOffsetX = x;
  }
  if (rel.offsetY !== undefined && rel.offsetY !== null && !Number.isNaN(y)) {
    nudge.labelOffsetY = y;
  }
  return nudge;
};

export const getData = (db: C4Db, config: MermaidConfig): LayoutData => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const c4Config = config.c4 ?? {};
  const padding = c4Config.c4ShapePadding ?? 20;
  const elementWidth = c4Config.width ?? 216;
  const look = config.look ?? 'classic';
  const useHtmlLabels = getEffectiveHtmlLabels(config);
  // C4Dynamic numbers each relationship in declaration order (1: ..., 2: ...).
  const isDynamic = db.getC4Type() === 'C4Dynamic';
  const elementTags = new Map(db.getElementTags().map((tag) => [tag.tagName, tag]));
  const relTags = new Map(db.getRelTags().map((tag) => [tag.tagName, tag]));

  // 'global' is the implicit root boundary; it is a container in the db, not a drawn box.
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
      label: boundaryLabel(boundary),
      labelType: 'string',
      isGroup: true,
      shape: 'rect',
      parentId: parentIdOf(boundary.parentBoundary),
      cssClasses: isDeploymentNode ? 'c4-boundary c4-deployment-node' : 'c4-boundary',
      cssStyles: boundaryCssStyles(boundary),
      link: boundary.link ?? undefined,
      look,
    });
  }

  for (const shape of db.getC4ShapeArray()) {
    const tagStyle = mergeTagStyle(resolveTags(shape.tags, elementTags));
    nodes.push({
      ...buildC4Node(shape, c4Config, padding, look, elementWidth, tagStyle),
      parentId: parentIdOf(shape.parentBoundary),
      link: shape.link,
    });
  }

  db.getRels().forEach((rel, index) => {
    const isBidirectional = rel.type === 'birel';
    const isBack = rel.type === 'rel_b';
    const label = buildEdgeLabel(
      isDynamic
        ? { ...rel, label: { ...rel.label, text: `${index + 1}: ${rel.label.text}` } }
        : rel,
      useHtmlLabels
    );
    const style: string[] = [];
    const labelStyle: string[] = [];
    // An explicit `UpdateRelStyle` on this relationship wins over any tag it carries.
    const tags = resolveTags(rel.tags, relTags);
    const taggedLine = tags.reduce<string | undefined>((c, tag) => tag.lineColor ?? c, undefined);
    const taggedText = tags.reduce<string | undefined>((c, tag) => tag.textColor ?? c, undefined);
    const lineColor = asColor(rel.lineColor) ?? asColor(taggedLine);
    const textColor = asColor(rel.textColor) ?? asColor(taggedText);
    if (lineColor) {
      style.push(`stroke:${lineColor}`);
    }
    if (textColor) {
      labelStyle.push(`color:${textColor}`);
    }
    edges.push({
      id: `c4-edge-${index}-${rel.from}-${rel.to}`,
      start: rel.from,
      end: rel.to,
      label,
      arrowTypeStart: isBidirectional || isBack ? 'arrow_point' : undefined,
      arrowTypeEnd: isBack ? undefined : 'arrow_point',
      style,
      labelStyle,
      classes: 'c4-rel',
      // Straight lines as on c4model.com; labelpos 'c' centres the label on the
      // line rather than dagre's default side offset.
      curve: 'linear',
      labelpos: 'c',
      // `UpdateRelStyle($offsetX, $offsetY)`: applied to the placed label by the renderer,
      // since the shared pipeline decides where a label goes.
      ...labelNudge(rel),
      look,
    });
  });

  return {
    nodes,
    edges,
    config,
    direction: db.getDirection(),
  };
};
