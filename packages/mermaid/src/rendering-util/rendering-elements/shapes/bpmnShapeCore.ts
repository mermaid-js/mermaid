import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { updateNodeBounds } from './util.js';
import { getIconSVG, registerIconPacks } from '../../icons.js';

export const EVENT_DIAMETER = 36;
export const GATEWAY_SIZE = 50;
export const ACTIVITY_WIDTH = 100;
export const ACTIVITY_HEIGHT = 80;
export const LABEL_GAP = 6;
export const ICON_SIZE = 16;

export const BPMN_ICON_PREFIX = 'bpmn';

export const EVENT_RINGS = {
  start: { rings: 1, strokeWidth: 1.6 },
  intermediate: { rings: 2, strokeWidth: 1.4 },
  boundary: { rings: 2, strokeWidth: 1.4 },
  end: { rings: 1, strokeWidth: 3.4 },
} as const;

export type EventPosition = keyof typeof EVENT_RINGS;

let iconsRegistered: Promise<void> | undefined;

export async function ensureBpmnIcons(): Promise<void> {
  iconsRegistered ??= import('./bpmnIcons.js').then(({ bpmnIcons }) => {
    registerIconPacks([{ name: bpmnIcons.prefix, icons: bpmnIcons }]);
  });
  return iconsRegistered;
}

export type BpmnNode = Node & {
  icon?: string;
  markers?: string[];
};

export function dataDirectionOf(node: Node): 'input' | 'output' | undefined {
  const direction = node.metadata?.dataDirection;
  return direction === 'input' || direction === 'output' ? direction : undefined;
}

export function isCollectionData(node: Node): boolean {
  return node.metadata?.isCollection === true;
}

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

export const reserveBounds = (
  shapeSvg: D3Selection<SVGGElement>,
  node: Node,
  width: number,
  height: number,
  drawn?: { width: number; height: number }
) => {
  if (drawn) {
    node.metadata = { ...(node.metadata ?? {}), drawnExtent: drawn };
  }
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

export type ShapeFace = 'top' | 'bottom' | 'left' | 'right';

const CORNER_INSET = 8;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

export const faceProjectIntersect = (
  node: Node,
  width: number,
  height: number,
  point: { x: number; y: number },
  fixedFace?: ShapeFace
) => {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const face: ShapeFace =
    fixedFace ??
    (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth
      ? dx >= 0
        ? 'right'
        : 'left'
      : dy >= 0
        ? 'bottom'
        : 'top');
  const reach = (half: number) => Math.max(0, half - Math.min(CORNER_INSET, half / 2));
  if (face === 'left' || face === 'right') {
    return {
      x: cx + (face === 'right' ? halfWidth : -halfWidth),
      y: clamp(point.y, cy - reach(halfHeight), cy + reach(halfHeight)),
    };
  }
  return {
    x: clamp(point.x, cx - reach(halfWidth), cx + reach(halfWidth)),
    y: cy + (face === 'bottom' ? halfHeight : -halfHeight),
  };
};

export const ringIntersect = (node: Node, diameter: number, point: { x: number; y: number }) => {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  const radius = diameter / 2;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const reach = radius * 0.85;
  if (Math.abs(dy) >= Math.abs(dx)) {
    const along = clamp(dx, -reach, reach);
    return {
      x: cx + along,
      y: cy + Math.sign(dy || 1) * Math.sqrt(radius * radius - along * along),
    };
  }
  const along = clamp(dy, -reach, reach);
  return { x: cx + Math.sign(dx || 1) * Math.sqrt(radius * radius - along * along), y: cy + along };
};

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
  return { x: cx, y: cy + Math.sign(dy || 1) * halfHeight };
};
