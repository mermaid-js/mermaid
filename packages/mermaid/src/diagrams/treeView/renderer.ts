import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import type { D3SVGElement, TreeViewDB } from './types.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { TreeViewDiagramConfig } from '../../config.type.js';
import type { Node } from './types.js';

const positionLabel = (
  x: number,
  y: number,
  node: Node,
  domElem: D3SVGElement<SVGGElement>,
  config: Required<TreeViewDiagramConfig>
) => {
  const label = domElem
    .append('text')
    .text(node.name)
    .attr('dominant-baseline', 'middle')
    .attr('class', 'treeView-node-label');
  const { height: labelHeight, width: labelWidth } = label.node()!.getBBox();
  const height = labelHeight + config.paddingY * 2;
  const width = labelWidth + config.paddingX * 2;
  label.attr('x', x + config.paddingX);
  label.attr('y', y + height / 2);
  node.BBox = {
    x,
    y,
    width,
    height,
  };
};

const positionLine = (
  domElem: D3SVGElement<SVGGElement>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lineThickness: number
) => {
  return domElem
    .append('line')
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2)
    .attr('stroke-width', lineThickness)
    .attr('class', 'treeView-node-line');
};

const drawTree = (
  elem: D3SVGElement<SVGGElement>,
  root: Node,
  config: Required<TreeViewDiagramConfig>
) => {
  let totalHeight = 0;
  let totalWidth = 0;
  const drawNode = (
    elem: D3SVGElement<SVGGElement>,
    node: Node,
    config: Required<TreeViewDiagramConfig>,
    depth: number
  ) => {
    const indent = depth * (config.rowIndent + config.paddingX);
    positionLabel(indent, totalHeight, node, elem, config);
    const { height, width } = node.BBox!;
    positionLine(
      elem,
      indent - config.rowIndent,
      totalHeight + height / 2,
      indent,
      totalHeight + height / 2,
      config.lineThickness
    );

    totalWidth = Math.max(totalWidth, indent + width);
    totalHeight += height;
  };

  const processNode = (node: Node, depth = 0) => {
    drawNode(elem, node, config, depth);
    node.children.forEach((child) => {
      processNode(child, depth + 1);
    });
    const { x, y, height } = node.BBox!;
    if (node.children.length) {
      const { y: endY, height: endHeight } = node.children[node.children.length - 1].BBox!;
      positionLine(
        elem,
        x + config.paddingX,
        y + height,
        x + config.paddingX,
        endY + endHeight / 2 + config.lineThickness / 2,
        config.lineThickness
      );
    }
  };

  processNode(root);
  return { totalHeight, totalWidth };
};

const draw: DrawDefinition = (text, id, _ver, diagObj) => {
  log.debug('Rendering treeView diagram\n' + text);

  const db = diagObj.db as TreeViewDB;
  const root = db.getRoot();
  const config = db.getConfig();

  const svg = selectSvgElement(id);
  const treeElem = svg.append('g');
  treeElem.attr('class', 'tree-view');

  const { totalHeight, totalWidth } = drawTree(treeElem, root, config);
  /* -${config.lineThickness/2} is required for a line with x coordinate = 0
     as there is overflow to the left due to the line being centered */
  svg.attr('viewBox', `-${config.lineThickness / 2} 0 ${totalWidth} ${totalHeight}`);
  configureSvgSize(svg, totalHeight, totalWidth, config.useMaxWidth);
};

const renderer: DiagramRenderer = {
  draw,
};

export default renderer;
