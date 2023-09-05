import { getStylesFromArray } from '../../utils.js';
import { insertNode } from '../../dagre-wrapper/nodes.js';
import { getConfig } from '../../config.js';
import { ContainerElement } from 'd3';
import type { Block } from './blockTypes.js';
import { BlockDB } from './blockDB.js';

function getNodeFromBlock(block: Block, db: BlockDB, positioned: boolean = false) {
  const vertex = block;

  /**
   * Variable for storing the classes for the vertex
   *
   * @type {string}
   */
  let classStr = 'default';
  if ((vertex?.classes?.length || []) > 0) {
    classStr = vertex.classes.join(' ');
  }
  classStr = classStr + ' flowchart-label';

  // We create a SVG label, either by delegating to addHtmlLabel or manually
  let vertexNode;
  const labelData = { width: 0, height: 0 };

  let radious = 0;
  let _shape = '';
  let layoutOptions = {};
  // Set the shape based parameters
  switch (vertex.type) {
    case 'round':
      radious = 5;
      _shape = 'rect';
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
    case 'odd_right':
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

  // const styles = getStylesFromArray(vertex.styles);
  const styles = getStylesFromArray([]);

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
    style: styles.style,
    id: vertex.id,
    // link: vertex.link,
    // linkTarget: vertex.linkTarget,
    // tooltip: diagObj.db.getTooltip(vertex.id) || '',
    // domId: diagObj.db.lookUpDomId(vertex.id),
    // haveCallback: vertex.haveCallback,
    // width: vertex.type === 'group' ? 500 : undefined,
    // dir: vertex.dir,
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    positioned,
    type: vertex.type,
    // props: vertex.props,
    padding: getConfig()?.flowchart?.padding || 0,
  };
  return node;
}
type IOperation = (elem: any, block: any, db: any) => Promise<void>;
async function calculateBlockSize(elem: any, block: any, db: any) {
  const node = getNodeFromBlock(block, db, false);
  if (node.type === 'group') return;

  // Add the element to the DOM to size it
  const nodeEl = await insertNode(elem, node);
  const boundingBox = nodeEl.node().getBBox();
  const obj = db.getBlock(node.id);
  obj.size = { width: boundingBox.width, height: boundingBox.height, x: 0, y: 0, node: nodeEl };
  console.log('Here boundsíng', boundingBox.width);
  db.setBlock(obj);
  nodeEl.remove();
}

export async function insertBlockPositioned(elem: any, block: any, db: any) {
  console.log('Here insertBlockPositioned');
  const node = getNodeFromBlock(block, db, true);
  if (node.type === 'group') return;

  // Add the element to the DOM to size it
  const obj = db.getBlock(node.id);
  const nodeEl = await insertNode(elem, node);
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
