import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { getConfig } from '../../config.js';
import { insertEdge, insertEdgeLabel, positionEdgeLabel } from '../../dagre-wrapper/edges.js';
import { insertNode, positionNode } from '../../dagre-wrapper/nodes.js';
import { getStylesFromArray } from '../../utils.js';
import type { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';

function getNodeFromBlock(block: Block, db: BlockDB, positioned = false) {
  const vertex = block;

  let classStr = 'default';
  if ((vertex?.classes?.length || 0) > 0) {
    classStr = (vertex?.classes ?? []).join(' ');
  }
  classStr = classStr + ' flowchart-label';

  // We create a SVG label, either by delegating to addHtmlLabel or manually
  let radius = 0;
  let shape = '';
  let padding;
  // Set the shape based parameters
  switch (vertex.type) {
    case 'round':
      radius = 5;
      shape = 'rect';
      break;
    case 'composite':
      radius = 0;
      shape = 'composite';
      padding = 0;
      break;
    case 'square':
      shape = 'rect';
      break;
    case 'diamond':
      shape = 'question';
      break;
    case 'hexagon':
      shape = 'hexagon';
      break;
    case 'block_arrow':
      shape = 'block_arrow';
      break;
    case 'odd':
      shape = 'rect_left_inv_arrow';
      break;
    case 'lean_right':
      shape = 'lean_right';
      break;
    case 'lean_left':
      shape = 'lean_left';
      break;
    case 'trapezoid':
      shape = 'trapezoid';
      break;
    case 'inv_trapezoid':
      shape = 'inv_trapezoid';
      break;
    case 'rect_left_inv_arrow':
      shape = 'rect_left_inv_arrow';
      break;
    case 'circle':
      shape = 'circle';
      break;
    case 'ellipse':
      shape = 'ellipse';
      break;
    case 'stadium':
      shape = 'stadium';
      break;
    case 'subroutine':
      shape = 'subroutine';
      break;
    case 'cylinder':
      shape = 'cylinder';
      break;
    case 'group':
      shape = 'rect';
      break;
    case 'doublecircle':
      shape = 'doublecircle';
      break;
    default:
      shape = 'rect';
  }

  const styles = getStylesFromArray(vertex?.styles ?? []);

  // Use vertex id as text in the box if no text is provided by the graph definition
  const vertexText = vertex.label;

  const bounds = vertex.size ?? { width: 0, height: 0, x: 0, y: 0 };
  // Add the node
  const node = {
    labelStyle: styles.labelStyle,
    shape: shape,
    labelText: vertexText,
    rx: radius,
    ry: radius,
    class: classStr,
    style: styles.style,
    id: vertex.id,
    directions: vertex.directions,
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    positioned,
    intersect: undefined,
    type: vertex.type,
    padding: padding ?? getConfig()?.block?.padding ?? 0,
  };
  return node;
}
async function calculateBlockSize(
  elem: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  block: any,
  db: any
) {
  const node = getNodeFromBlock(block, db, false);
  if (node.type === 'group') {
    return;
  }

  // Add the element to the DOM to size it
  const config = getConfig();
  const nodeEl = await insertNode(elem, node, { config });
  const boundingBox = nodeEl.node().getBBox();
  const obj = db.getBlock(node.id);
  obj.size = { width: boundingBox.width, height: boundingBox.height, x: 0, y: 0, node: nodeEl };
  db.setBlock(obj);
  nodeEl.remove();
}
type ActionFun = typeof calculateBlockSize;

export async function insertBlockPositioned(elem: any, block: Block, db: any) {
  const node = getNodeFromBlock(block, db, true);
  // Add the element to the DOM to size it
  const obj = db.getBlock(node.id);
  if (obj.type !== 'space') {
    const config = getConfig();
    await insertNode(elem, node, { config });
    block.intersect = node?.intersect;
    positionNode(node);
  }
}

export async function performOperations(
  elem: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  blocks: Block[],
  db: BlockDB,
  operation: ActionFun
) {
  for (const block of blocks) {
    await operation(elem, block, db);
    if (block.children) {
      await performOperations(elem, block.children, db, operation);
    }
  }
}

export async function calculateBlockSizes(elem: any, blocks: Block[], db: BlockDB) {
  await performOperations(elem, blocks, db, calculateBlockSize);
}

export async function insertBlocks(
  elem: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  blocks: Block[],
  db: BlockDB
) {
  await performOperations(elem, blocks, db, insertBlockPositioned);
}

export async function insertEdges(
  elem: any,
  edges: Block[],
  blocks: Block[],
  db: BlockDB,
  id: string
) {
  const g = new graphlib.Graph({
    multigraph: true,
    compound: true,
  });
  g.setGraph({
    rankdir: 'TB',
    nodesep: 10,
    ranksep: 10,
    marginx: 8,
    marginy: 8,
  });

  for (const block of blocks) {
    if (block.size) {
      g.setNode(block.id, {
        width: block.size.width,
        height: block.size.height,
        intersect: block.intersect,
      });
    }
  }

  for (const edge of edges) {
    // elem, e, edge, clusterDb, diagramType, graph;
    if (edge.start && edge.end) {
      const startBlock = db.getBlock(edge.start);
      const endBlock = db.getBlock(edge.end);

      if (startBlock?.size && endBlock?.size) {
        const start = startBlock.size;
        const end = endBlock.size;
        const points = [
          { x: start.x, y: start.y },
          { x: start.x + (end.x - start.x) / 2, y: start.y + (end.y - start.y) / 2 },
          { x: end.x, y: end.y },
        ];
        // edge.points = points;
        insertEdge(
          elem,
          { v: edge.start, w: edge.end, name: edge.id },
          {
            ...edge,
            arrowTypeEnd: edge.arrowTypeEnd,
            arrowTypeStart: edge.arrowTypeStart,
            points,
            classes: 'edge-thickness-normal edge-pattern-solid flowchart-link LS-a1 LE-b1',
          },
          undefined,
          'block',
          g,
          id
        );
        if (edge.label) {
          await insertEdgeLabel(elem, {
            ...edge,
            label: edge.label,
            labelStyle: 'stroke: #333; stroke-width: 1.5px;fill:none;',
            arrowTypeEnd: edge.arrowTypeEnd,
            arrowTypeStart: edge.arrowTypeStart,
            points,
            classes: 'edge-thickness-normal edge-pattern-solid flowchart-link LS-a1 LE-b1',
          });
          positionEdgeLabel(
            { ...edge, x: points[1].x, y: points[1].y },
            {
              originalPath: points,
            }
          );
        }
      }
    }
  }
}
