import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { getConfig } from '../../config.js';
import {
  insertEdge,
  insertEdgeLabel,
  positionEdgeLabel,
} from '../../rendering-util/rendering-elements/edges.js';
import { insertNode, positionNode } from '../../rendering-util/rendering-elements/nodes.js';
import type { ShapeID } from '../../rendering-util/rendering-elements/shapes.js';
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
  const cssCompiledStyles = (vertex?.classes ?? []).flatMap(
    (className) => db.getClasses().get(className)?.styles ?? []
  );

  // We create a SVG label, either by delegating to addHtmlLabel or manually
  let radius = 0;
  let shape: ShapeID = 'rect';
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
      // @ts-expect-error -- Ellipses are broken, see https://github.com/mermaid-js/mermaid/issues/5976
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
  const dbDiagramId = db.getDiagramId();
  // Add the node
  const node = {
    labelStyle: styles.labelStyle,
    shape,
    label: vertexText,
    labelText: vertexText,
    rx: radius,
    ry: radius,
    class: classStr,
    cssClasses: classStr,
    cssStyles: vertex?.styles ?? [],
    cssCompiledStyles,
    style: styles.style,
    id: vertex.id,
    domId: dbDiagramId ? `${dbDiagramId}-${vertex.id}` : vertex.id,
    isGroup: false as const,
    directions: vertex.directions,
    width: bounds.width || undefined,
    height: bounds.height || undefined,
    x: bounds.x,
    y: bounds.y,
    positioned,
    intersect: undefined,
    padding: padding ?? getConfig()?.block?.padding ?? 0,
    widthInColumns: vertex.widthInColumns ?? 1,
  };
  return node;
}
async function calculateBlockSize(
  elem: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  block: any,
  db: any
) {
  const node = getNodeFromBlock(block, db, false);
  if (block.type === 'group') {
    return;
  }

  // Add the element to the DOM to size it
  const config = getConfig();
  const nodeEl = await insertNode(elem, node, { config });
  const boundingBox = nodeEl.node()?.getBBox() ?? { width: 0, height: 0 };
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
        const prefixedEdgeId = id ? `${id}-${edge.id}` : edge.id;

        const thicknessClass =
          edge.thickness === 'thick' ? 'edge-thickness-thick' : 'edge-thickness-normal';
        const patternClass =
          edge.pattern === 'dotted' ? 'edge-pattern-dotted' : 'edge-pattern-solid';
        const dynamicClasses = `${thicknessClass} ${patternClass} flowchart-link LS-a1 LE-b1`;

        insertEdge(
          elem,
          {
            ...edge,
            id: prefixedEdgeId,
            arrowTypeEnd: edge.arrowTypeEnd,
            arrowTypeStart: edge.arrowTypeStart,
            points,
            classes: dynamicClasses,
          },
          {},
          'block',
          g.node(edge.start),
          g.node(edge.end),
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
            classes: dynamicClasses,
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
