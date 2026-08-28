import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { updateNodeBounds } from './util.js';
import { getIconSVG, registerIconPacks } from '../../icons.js';

/**
 * BPMN geometry is fixed, not label-driven.
 *
 * The notation gives an event a 36px circle and a gateway a 50px diamond whatever their
 * captions say, and puts the caption outside the shape. Mermaid sizes a node from its
 * label, and `insertMeasuredNode` re-measures the drawn group afterwards, so a node can
 * never end up narrower than its own caption. These shapes therefore keep the glyph a
 * fixed size inside a larger reserved box and override `intersect` so an edge docks to
 * the glyph rather than to the box.
 */
export const EVENT_DIAMETER = 36;
export const GATEWAY_SIZE = 50;
export const ACTIVITY_WIDTH = 100;
export const ACTIVITY_HEIGHT = 80;
export const LABEL_GAP = 6;
export const ICON_SIZE = 16;

export const BPMN_ICON_PREFIX = 'bpmn';

/** The ring weight the notation gives each event position. */
export const EVENT_RINGS = {
  start: { rings: 1, strokeWidth: 1.6 },
  intermediate: { rings: 2, strokeWidth: 1.4 },
  boundary: { rings: 2, strokeWidth: 1.4 },
  end: { rings: 1, strokeWidth: 3.4 },
} as const;

export type EventPosition = keyof typeof EVENT_RINGS;

let iconsRegistered: Promise<void> | undefined;

/**
 * Registers the glyph pack the first time a BPMN shape is drawn.
 *
 * The pack is pulled in with a dynamic import so its path data stays out of the main
 * chunk for every bundle that never draws one of these shapes.
 */
export async function ensureBpmnIcons(): Promise<void> {
  iconsRegistered ??= import('./bpmnIcons.js').then(({ bpmnIcons }) => {
    registerIconPacks([{ name: bpmnIcons.prefix, icons: bpmnIcons }]);
  });
  return iconsRegistered;
}

/**
 * The attributes a BPMN shape reads beyond the generic ones.
 *
 * The element's kind comes from the shape name and its glyph from `icon`, so a diagram
 * that can only name a shape and set an icon can still draw the whole vocabulary.
 */
export type BpmnNode = Node & {
  icon?: string;
  markers?: string[];
  dataDirection?: 'input' | 'output';
  isCollection?: boolean;
};

/** The glyph markup for `icon`, registering the pack on first use. */
export async function glyphSvg(icon: string, size: number): Promise<string> {
  await ensureBpmnIcons();
  return getIconSVG(icon, { height: size, width: size, fallbackPrefix: BPMN_ICON_PREFIX });
}

export interface LabelBox {
  width: number;
  height: number;
  x?: number;
  y?: number;
  top?: number;
  left?: number;
}

/**
 * Moves a measured label so its centre lands on `centerY`.
 *
 * `bbox` is a DOMRect on the HTML-label path and an SVGRect on the text path; `x - left`
 * is zero for the first and the true SVG-space origin for the second, so correcting by it
 * keeps both paths aligned.
 */
export const positionLabelBelow = (
  label: D3Selection<SVGGElement>,
  bbox: LabelBox,
  centerY: number
) => {
  const originX = (bbox.x ?? 0) - (bbox.left ?? 0);
  const originY = (bbox.y ?? 0) - (bbox.top ?? 0);
  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - originX},${centerY - bbox.height / 2 - originY})`
  );
};

/** Draws a glyph centred on the origin of `group`. */
export const appendGlyph = async (
  group: D3Selection<SVGGElement>,
  icon: string | undefined,
  size: number
) => {
  if (!icon) {
    return;
  }
  const glyph = group.append('g').attr('class', 'bpmn-glyph');
  glyph.html(`<g>${await glyphSvg(icon, size)}</g>`);
  glyph.attr('transform', `translate(${-size / 2}, ${-size / 2})`);
};

/**
 * Reserves `width` x `height` around the origin with an invisible rect and declares it as
 * the node's bounds. `getBBox` ignores opacity, so this fixes the size the layout sees
 * without painting anything.
 */
export const reserveBounds = (
  shapeSvg: D3Selection<SVGGElement>,
  node: Node,
  width: number,
  height: number
) => {
  const outline = shapeSvg
    .insert('rect', ':first-child')
    .attr('class', 'bpmn-bounds')
    .attr('x', -width / 2)
    .attr('y', -height / 2)
    .attr('width', width)
    .attr('height', height)
    .attr('opacity', 0)
    .attr('aria-hidden', 'true');
  updateNodeBounds(node, outline);
  return outline;
};

/**
 * Docks an edge at the middle of whichever side it approaches, rather than wherever the
 * line happens to cross the outline.
 *
 * The notation draws a flow leaving the centre of one border and arriving at the centre
 * of another, so two boxes on different rows are joined by one straight segment out of
 * the bottom and into the top, not by a slanted line meeting a corner. The face is chosen
 * by comparing the approach against the box's own aspect, so a wide box still hands a
 * near-horizontal approach to its left or right side.
 */
export const faceCentreIntersect = (
  node: Node,
  width: number,
  height: number,
  point: { x: number; y: number }
) => {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const dx = point.x - cx;
  const dy = point.y - cy;
  if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
    return { x: cx + Math.sign(dx) * halfWidth, y: cy };
  }
  return { x: cx, y: cy + Math.sign(dy) * halfHeight };
};
