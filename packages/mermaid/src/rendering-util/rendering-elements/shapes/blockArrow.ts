import type { Direction } from '../../../diagrams/block/blockTypes.js';
import type { D3Selection, Point } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { insertPolygonShape } from './insertPolygonShape.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';

type BlockArrowNode = Node & {
  directions?: Direction[];
  positioned?: boolean;
  style?: string;
  widthInColumns?: number;
};

type DirectionName = Exclude<Direction, 'x' | 'y'>;
interface ArrowMetrics {
  height: number;
  midpoint: number;
  padding: number;
  width: number;
}

type ArrowPointsFactory = (metrics: ArrowMetrics) => Point[];

const DIRECTION_ORDER: DirectionName[] = ['right', 'left', 'up', 'down'];
const POINT_KEY = 'point';

const expandAndDeduplicateDirections = (directions: Direction[]): Set<DirectionName> => {
  const uniqueDirections = new Set<DirectionName>();

  for (const direction of directions) {
    switch (direction) {
      case 'x':
        uniqueDirections.add('right');
        uniqueDirections.add('left');
        break;
      case 'y':
        uniqueDirections.add('up');
        uniqueDirections.add('down');
        break;
      default:
        uniqueDirections.add(direction);
        break;
    }
  }

  return uniqueDirections;
};

const getDirectionKey = (directions: Set<DirectionName>) =>
  DIRECTION_ORDER.filter((direction) => directions.has(direction)).join('|') || POINT_KEY;

const arrowPointFactories: Record<string, ArrowPointsFactory> = {
  'right|left|up|down': ({ height, midpoint, padding, width }) => [
    { x: 0, y: 0 },
    { x: midpoint, y: 0 },
    { x: width / 2, y: 2 * padding },
    { x: width - midpoint, y: 0 },
    { x: width, y: 0 },
    { x: width, y: -height / 3 },
    { x: width + 2 * padding, y: -height / 2 },
    { x: width, y: (-2 * height) / 3 },
    { x: width, y: -height },
    { x: width - midpoint, y: -height },
    { x: width / 2, y: -height - 2 * padding },
    { x: midpoint, y: -height },
    { x: 0, y: -height },
    { x: 0, y: (-2 * height) / 3 },
    { x: -2 * padding, y: -height / 2 },
    { x: 0, y: -height / 3 },
  ],
  'right|left|up': ({ height, midpoint, width }) => [
    { x: midpoint, y: 0 },
    { x: width - midpoint, y: 0 },
    { x: width, y: -height / 2 },
    { x: width - midpoint, y: -height },
    { x: midpoint, y: -height },
    { x: 0, y: -height / 2 },
  ],
  'right|left|down': ({ height, midpoint, width }) => [
    { x: 0, y: 0 },
    { x: midpoint, y: -height },
    { x: width - midpoint, y: -height },
    { x: width, y: 0 },
  ],
  'right|up|down': ({ height, midpoint, width }) => [
    { x: 0, y: 0 },
    { x: width, y: -midpoint },
    { x: width, y: -height + midpoint },
    { x: 0, y: -height },
  ],
  'left|up|down': ({ height, midpoint, width }) => [
    { x: width, y: 0 },
    { x: 0, y: -midpoint },
    { x: 0, y: -height + midpoint },
    { x: width, y: -height },
  ],
  'right|left': ({ height, midpoint, padding, width }) => [
    { x: midpoint, y: 0 },
    { x: midpoint, y: -padding },
    { x: width - midpoint, y: -padding },
    { x: width - midpoint, y: 0 },
    { x: width, y: -height / 2 },
    { x: width - midpoint, y: -height },
    { x: width - midpoint, y: -height + padding },
    { x: midpoint, y: -height + padding },
    { x: midpoint, y: -height },
    { x: 0, y: -height / 2 },
  ],
  'up|down': ({ height, midpoint, padding, width }) => [
    { x: width / 2, y: 0 },
    { x: 0, y: -padding },
    { x: midpoint, y: -padding },
    { x: midpoint, y: -height + padding },
    { x: 0, y: -height + padding },
    { x: width / 2, y: -height },
    { x: width, y: -height + padding },
    { x: width - midpoint, y: -height + padding },
    { x: width - midpoint, y: -padding },
    { x: width, y: -padding },
  ],
  'right|up': ({ height, midpoint, width }) => [
    { x: 0, y: 0 },
    { x: width, y: -midpoint },
    { x: 0, y: -height },
  ],
  'right|down': ({ height, width }) => [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: 0, y: -height },
  ],
  'left|up': ({ height, midpoint, width }) => [
    { x: width, y: 0 },
    { x: 0, y: -midpoint },
    { x: width, y: -height },
  ],
  'left|down': ({ height, width }) => [
    { x: width, y: 0 },
    { x: 0, y: 0 },
    { x: width, y: -height },
  ],
  right: ({ height, midpoint, padding, width }) => [
    { x: midpoint, y: -padding },
    { x: midpoint, y: -padding },
    { x: width - midpoint, y: -padding },
    { x: width - midpoint, y: 0 },
    { x: width, y: -height / 2 },
    { x: width - midpoint, y: -height },
    { x: width - midpoint, y: -height + padding },
    { x: midpoint, y: -height + padding },
    { x: midpoint, y: -height + padding },
  ],
  left: ({ height, midpoint, padding, width }) => [
    { x: midpoint, y: 0 },
    { x: midpoint, y: -padding },
    { x: width - midpoint, y: -padding },
    { x: width - midpoint, y: -height + padding },
    { x: midpoint, y: -height + padding },
    { x: midpoint, y: -height },
    { x: 0, y: -height / 2 },
  ],
  up: ({ height, midpoint, padding, width }) => [
    { x: midpoint, y: -padding },
    { x: midpoint, y: -height + padding },
    { x: 0, y: -height + padding },
    { x: width / 2, y: -height },
    { x: width, y: -height + padding },
    { x: width - midpoint, y: -height + padding },
    { x: width - midpoint, y: -padding },
  ],
  down: ({ height, midpoint, padding, width }) => [
    { x: width / 2, y: 0 },
    { x: 0, y: -padding },
    { x: midpoint, y: -padding },
    { x: midpoint, y: -height + padding },
    { x: width - midpoint, y: -height + padding },
    { x: width - midpoint, y: -padding },
    { x: width, y: -padding },
  ],
  [POINT_KEY]: () => [{ x: 0, y: 0 }],
};

export const getArrowPoints = (
  duplicatedDirections: Direction[],
  bbox: { width: number; height: number },
  node: Pick<Node, 'padding'>,
  totalWidth?: number
): Point[] => {
  const directions = expandAndDeduplicateDirections(duplicatedDirections);
  const padding = (node.padding ?? 0) / 2;
  const height = bbox.height + 4 * padding;
  const midpoint = height / 2;
  const width = totalWidth ?? bbox.width + 2 * midpoint + 2 * padding;
  const key = getDirectionKey(directions);
  const pointFactory = arrowPointFactories[key] ?? arrowPointFactories[POINT_KEY];

  return pointFactory({ height, midpoint, padding, width });
};

export async function block_arrow<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const blockNode = node as BlockArrowNode;
  const { shapeSvg, bbox } = await labelHelper(parent, blockNode, getNodeClasses(blockNode));
  const nodePadding = blockNode.padding ?? 0;
  const height = bbox.height + 2 * nodePadding;
  const midpoint = height / 2;
  const naturalWidth = bbox.width + 2 * midpoint + nodePadding;
  const nodeWidth = blockNode.width ?? 0;
  const isSpanning =
    blockNode.positioned && (blockNode.widthInColumns ?? 1) > 1 && nodeWidth > naturalWidth;
  const width = isSpanning ? nodeWidth : naturalWidth;
  const points = getArrowPoints(blockNode.directions ?? [], bbox, blockNode, width);
  const blockArrow = insertPolygonShape(shapeSvg, width, height, points);

  blockArrow.attr('style', blockNode.style ?? null);
  updateNodeBounds(blockNode, blockArrow);

  blockNode.intersect = function (point) {
    return intersect.polygon(blockNode, points, point);
  };

  return shapeSvg;
}
