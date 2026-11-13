import { Diagram } from '../../../../Diagram.js';
import type { LayoutData, Node } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

export const NODE_WIDTH = 80;
export const NODE_HEIGHT = 40;
export const DEFAULT_NODE_SPACING = 40;
export const DEFAULT_RANK_SPACING = 100;

export interface LayoutOptions {
  fontSize?: number;
  /** `flowchart.nodeSpacing`: the gap between neighbouring nodes in a layer. */
  nodeSpacing?: number;
  /** Width of a node by id; the default is `NODE_WIDTH` for every node. */
  nodeWidth?: (id: string) => number;
  /** The padding of every lane; the default leaves what the parser gives them. */
  lanePadding?: number;
  /** `swimlane.automaticLaneOrdering`: let the layout reorder the lanes that have nodes. */
  automaticLaneOrdering?: boolean;
}

/** Parses swimlane source and runs the layout core on it with fixed node sizes. */
export async function layoutFromSource(
  source: string,
  options: LayoutOptions = {}
): Promise<LayoutData> {
  const diagram = await Diagram.fromText(source);
  const layout = (diagram.db as { getData: () => LayoutData }).getData();
  (layout as LayoutData & { direction?: string }).direction = (
    diagram.db as { getDirection?: () => string }
  ).getDirection?.();
  layout.config = {
    flowchart: {
      nodeSpacing: options.nodeSpacing ?? DEFAULT_NODE_SPACING,
      rankSpacing: DEFAULT_RANK_SPACING,
    },
    ...(options.automaticLaneOrdering === undefined
      ? {}
      : { swimlane: { automaticLaneOrdering: options.automaticLaneOrdering } }),
    ...(options.fontSize === undefined ? {} : { fontSize: options.fontSize }),
  } as LayoutData['config'];
  for (const node of layout.nodes) {
    if (!node.isGroup) {
      node.width = options.nodeWidth?.(node.id) ?? NODE_WIDTH;
      node.height = NODE_HEIGHT;
    } else if (options.lanePadding !== undefined && !node.parentId) {
      node.padding = options.lanePadding;
    }
  }
  prepareLayoutForSwimlanes(layout);
  runSwimlaneLayoutCore(layout);
  return layout;
}

export function nodeById(layout: LayoutData, id: string): Node {
  const found = layout.nodes.find((n) => n.id === id);
  if (!found) {
    throw new Error(`no node ${id}`);
  }
  return found;
}

export interface Extent {
  left: number;
  right: number;
}

export function extentOf(node: Node): Extent {
  return {
    left: (node.x ?? 0) - (node.width ?? 0) / 2,
    right: (node.x ?? 0) + (node.width ?? 0) / 2,
  };
}

/** The top-level lane (a group without a parent) a node stands in, by walking up its parents. */
function topLaneIdOf(layout: LayoutData, node: Node): string | undefined {
  let current: Node | undefined = node;
  while (current?.parentId) {
    current = layout.nodes.find((n) => n.id === current?.parentId);
  }
  return current?.isGroup ? current.id : undefined;
}

/** One line per node whose box is not inside its own top-level lane, for a readable failure. */
export function nodesOutsideTheirLane(layout: LayoutData, tolerance = 0.5): string[] {
  const outside: string[] = [];
  for (const node of layout.nodes) {
    if (node.isGroup || node.isEdgeLabel || !node.parentId) {
      continue;
    }
    const laneId = topLaneIdOf(layout, node);
    const lane = laneId === undefined ? undefined : nodeById(layout, laneId);
    if (!lane) {
      continue;
    }
    const box = extentOf(node);
    const span = extentOf(lane);
    if (box.left < span.left - tolerance || box.right > span.right + tolerance) {
      outside.push(
        `${node.id} ${box.left}..${box.right} is outside ${lane.id} ${span.left}..${span.right}`
      );
    }
  }
  return outside;
}

/** Top-level lane ids from left to right, by centre. */
export function laneOrderLeftToRight(layout: LayoutData): string[] {
  return layout.nodes
    .filter((node) => node.isGroup && !node.parentId)
    .sort((a, b) => (a.x ?? 0) - (b.x ?? 0))
    .map((node) => node.id);
}

/** The gaps between neighbouring top-level lanes, left to right: negative where they overlap. */
export function laneSeams(layout: LayoutData): number[] {
  const spans = layout.nodes
    .filter((node) => node.isGroup && !node.parentId)
    .map(extentOf)
    .sort((a, b) => a.left - b.left);
  return spans.slice(1).map((span, index) => span.left - spans[index].right);
}

/** Whether the lanes that hold nodes stand in another order than the source declares them. */
export function nodeLanesReordered(layout: LayoutData, declared: string[]): boolean {
  const holding = new Set(
    layout.nodes.filter((n) => !n.isGroup && n.parentId).map((n) => n.parentId)
  );
  const standing = laneOrderLeftToRight(layout).filter((id) => holding.has(id));
  return standing.join() !== declared.filter((id) => holding.has(id)).join();
}
