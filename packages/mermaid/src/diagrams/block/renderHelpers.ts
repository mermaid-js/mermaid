import { getStylesFromArray } from '../../utils.js';
import { insertNode, positionNode } from '../../dagre-wrapper/nodes.js';
import { insertEdge, insertEdgeLabel } from '../../dagre-wrapper/edges.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { getConfig } from '../../config.js';
import type { ContainerElement } from 'd3';
import type { Block } from './blockTypes.js';
import type { BlockDB } from './blockDB.js';

interface Node {
  classes: string;
}

function getNodeFromBlock(block: Block, db: BlockDB, positioned = false) {
  const vertex = block;

  let classStr = 'default';
  if ((vertex?.classes?.length || 0) > 0) {
    classStr = (vertex?.classes || []).join(' ');
  }
  classStr = classStr + ' flowchart-label';

  // We create a SVG label, either by delegating to addHtmlLabel or manually
  let radious = 0;
  let _shape = '';
  let layoutOptions = {};
  let padding;
  // Set the shape based parameters
  switch (vertex.type) {
    case 'round':
      radious = 5;
      _shape = 'rect';
      break;
    // case 'composite-subgraph':
    //   radious = 0;
    //   _shape = 'composite';
    //   break;
    case 'composite':
      radious = 0;
      _shape = 'composite';
      padding = 0;
      break;
    case 'square':
      _shape = 'rect';
      break;
    case 'diamond':
      _shape = 'question';
      layoutOptions = {
        portConstraints: 'FIXED_SIDE',
      };
      break;
    case 'hexagon':
      _shape = 'hexagon';
      break;
    case 'block_arrow':
      _shape = 'block_arrow';
      break;
    case 'odd':
      _shape = 'rect_left_inv_arrow';
      break;
    case 'lean_right':
      _shape = 'lean_right';
      break;
    case 'lean_left':
      _shape = 'lean_left';
      break;
    case 'trapezoid':
      _shape = 'trapezoid';
      break;
    case 'inv_trapezoid':
      _shape = 'inv_trapezoid';
      break;
    case 'rect_left_inv_arrow':
      _shape = 'rect_left_inv_arrow';
      break;
    case 'circle':
      _shape = 'circle';
      break;
    case 'ellipse':
      _shape = 'ellipse';
      break;
    case 'stadium':
      _shape = 'stadium';
      break;
    case 'subroutine':
      _shape = 'subroutine';
      break;
    case 'cylinder':
      _shape = 'cylinder';
      break;
    case 'group':
      _shape = 'rect';
      break;
    case 'doublecircle':
      _shape = 'doublecircle';
      break;
    default:
      _shape = 'rect';
  }

  const styles = getStylesFromArray(vertex?.styles || []);
  // const styles = getStylesFromArray([]);

  // Use vertex id as text in the box if no text is provided by the graph definition
  const vertexText = vertex.label;

  const bounds = vertex.size || { width: 0, height: 0, x: 0, y: 0 };
  // Add the node
  const node = {
    labelStyle: styles.labelStyle,
    shape: _shape,
    labelText: vertexText,
    // labelType: vertex.labelType,
    rx: radious,
    ry: radious,
    class: classStr,
    style: styles.style, // + 'fill:#9f9;stroke:#333;stroke-width:4px;',
    id: vertex.id,
    directions: vertex.directions,
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    positioned,
    intersect: undefined,
    type: vertex.type,
    // props: vertex.props,
    padding: padding ?? (getConfig()?.flowchart?.padding || 0),
  };
  return node;
}
type IOperation = (elem: any, block: any, db: any) => Promise<void>;
async function calculateBlockSize(elem: any, block: any, db: any) {
  const node = getNodeFromBlock(block, db, false);
  if (node.type === 'group') {
    return;
  }

  // Add the element to the DOM to size it
  const nodeEl = await insertNode(elem, node);
  const boundingBox = nodeEl.node().getBBox();
  const obj = db.getBlock(node.id);
  obj.size = { width: boundingBox.width, height: boundingBox.height, x: 0, y: 0, node: nodeEl };
  db.setBlock(obj);
  nodeEl.remove();
}

export async function insertBlockPositioned(elem: any, block: Block, db: any) {
  const node = getNodeFromBlock(block, db, true);
  // if (node.type === 'composite') {
  //   return;
  // }
  // Add the element to the DOM to size it
  const obj = db.getBlock(node.id);
  if (obj.type !== 'space') {
    const nodeEl = await insertNode(elem, node);
    block.intersect = node?.intersect;
    positionNode(node);
  }
}

export async function performOperations(
  elem: ContainerElement,
  blocks: Block[],
  db: BlockDB,
  operation: IOperation
) {
  for (const block of blocks) {
    await operation(elem, block, db);
    if (block.children) {
      await performOperations(elem, block.children, db, operation);
    }
  }
}

export async function calculateBlockSizes(elem: ContainerElement, blocks: Block[], db: BlockDB) {
  await performOperations(elem, blocks, db, calculateBlockSize);
}

export async function insertBlocks(elem: ContainerElement, blocks: Block[], db: BlockDB) {
  await performOperations(elem, blocks, db, insertBlockPositioned);
}

export async function insertEdges(
  elem: ContainerElement,
  edges: Block[],
  blocks: Block[],
  db: BlockDB
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
      const startBlock2 = g.node(edge.start);
      const endBlock = db.getBlock(edge.end);
      const endBlock2 = g.node(edge.end);

      if (startBlock?.size && endBlock?.size) {
        const start = startBlock.size;
        const end = endBlock.size;
        const points = [
          { x: start.x, y: start.y },
          { x: start.x + (end.x - start.x) / 2, y: start.y + (end.y - start.y) / 2 },
          { x: end.x, y: end.y },
        ];
        // edge.points = points;
        await insertEdge(
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
          g
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
        }
      }
    }
  }
}
