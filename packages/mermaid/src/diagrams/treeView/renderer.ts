import type { TreeViewDiagramConfig } from '../../config.type.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getIconSVG, registerIconPacks } from '../../rendering-util/icons.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { getNodeIcon, treeViewIcons } from './icons.js';
import type { D3SVGElement, Node, TreeViewDB } from './types.js';

registerIconPacks([
  {
    name: treeViewIcons.prefix,
    icons: treeViewIcons,
  },
]);

const ICON_SIZE = 14;
const ICON_GAP = 4;
const DESC_GAP = 16;

interface RenderInfo {
  node: Node;
  nodeGroup: D3SVGElement<SVGGElement>;
  labelRightEdge: number;
  centerY: number;
}

/** Iconify names may contain `:` (pack:name) which is unsafe in url(#…) references */
const iconSymbolId = (diagramId: string, icon: string) =>
  `tv-icon-${diagramId}-${icon.replace(/[^\w-]/g, '-')}`;

/**
 * Inject <defs> with all referenced icons into the SVG.
 * Each icon is resolved once through the iconify pipeline and referenced
 * per row via <use>, instead of repeating the icon markup for every node.
 */
const injectIconDefs = async (
  svg: D3SVGElement<SVGSVGElement>,
  root: Node,
  config: Required<TreeViewDiagramConfig>,
  diagramId: string
) => {
  const usedIcons = new Set<string>();
  const collect = (node: Node) => {
    const icon = getNodeIcon(node, config);
    if (icon) {
      usedIcons.add(icon);
    }
    node.children.forEach(collect);
  };
  collect(root);
  if (usedIcons.size === 0) {
    return;
  }

  const iconSVGs = await Promise.all(
    [...usedIcons].map(async (icon) => ({
      icon,
      svg: await getIconSVG(icon, {
        height: ICON_SIZE,
        width: ICON_SIZE,
      }),
    }))
  );

  const defs = svg.append('defs');
  for (const { icon, svg: iconSVG } of iconSVGs) {
    defs.append('g').attr('id', iconSymbolId(diagramId, icon)).html(iconSVG);
  }
};

const positionLabel = (
  x: number,
  y: number,
  node: Node,
  domElem: D3SVGElement<SVGGElement>,
  config: Required<TreeViewDiagramConfig>,
  diagramId: string
): RenderInfo => {
  const nodeGroup = domElem.append('g');
  let cssClasses = 'treeView-node-label';
  if (node.nodeType === 'directory') {
    cssClasses += ' treeView-node-dir';
  }
  if (node.cssClass) {
    cssClasses += ` ${node.cssClass}`;
  }

  // Explicit icon() annotations always render; defaults only when showIcons is on
  const iconOffset = ICON_SIZE + ICON_GAP;
  const icon = getNodeIcon(node, config);
  const showIcon = icon !== undefined;
  if (icon) {
    nodeGroup
      .append('use')
      .attr('xlink:href', `#${iconSymbolId(diagramId, icon)}`)
      .attr('x', x + config.paddingX)
      .attr('y', y + config.paddingY)
      .attr('class', 'treeView-node-icon');
  }

  // Label text
  const label = nodeGroup
    .append('text')
    .text(node.name)
    .attr('dominant-baseline', 'middle')
    .attr('class', cssClasses);
  const { height: labelHeight, width: labelWidth } = label.node()!.getBBox();
  const height = labelHeight + config.paddingY * 2;
  const labelX = x + config.paddingX + (showIcon ? iconOffset : 0);
  label.attr('x', labelX);
  label.attr('y', y + height / 2);

  const labelRightEdge = labelX + labelWidth;
  const width = labelWidth + config.paddingX * 2 + (showIcon ? iconOffset : 0);
  node.BBox = { x, y, width, height };

  // Highlight background rect (sized later in drawTree)
  if (node.cssClass?.split(/\s+/).includes('highlight')) {
    nodeGroup
      .insert('rect', ':first-child')
      .attr('x', x)
      .attr('y', y + 1)
      .attr('width', 0)
      .attr('height', height - 2)
      .attr('rx', 3)
      .attr('class', 'treeView-highlight-bg');
  }

  return { node, nodeGroup, labelRightEdge, centerY: y + height / 2 };
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
  config: Required<TreeViewDiagramConfig>,
  diagramId: string
) => {
  let totalHeight = 0;
  let totalWidth = 0;
  const renderInfos: RenderInfo[] = [];

  const drawNode = (
    elem: D3SVGElement<SVGGElement>,
    node: Node,
    config: Required<TreeViewDiagramConfig>,
    depth: number
  ) => {
    const indent = depth * (config.rowIndent + config.paddingX);
    const info = positionLabel(indent, totalHeight, node, elem, config, diagramId);
    renderInfos.push(info);
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

  // Phase 2: Add descriptions, aligned to a common column
  const nodesWithDesc = renderInfos.filter((ri) => ri.node.description);
  if (nodesWithDesc.length > 0) {
    const maxLabelRight = Math.max(...renderInfos.map((ri) => ri.labelRightEdge));
    const descX = maxLabelRight + DESC_GAP;
    for (const ri of nodesWithDesc) {
      const desc = ri.nodeGroup
        .append('text')
        .text(ri.node.description!)
        .attr('dominant-baseline', 'middle')
        .attr('class', 'treeView-node-description')
        .attr('x', descX)
        .attr('y', ri.centerY);
      const descBBox = desc.node()!.getBBox();
      totalWidth = Math.max(totalWidth, descX + descBBox.width + config.paddingX);
    }
  }

  // Phase 3: Size highlight background rects to full tree width
  for (const ri of renderInfos) {
    if (ri.node.cssClass?.split(/\s+/).includes('highlight')) {
      const rect = ri.nodeGroup.select('.treeView-highlight-bg');
      if (!rect.empty()) {
        const rectWidth = totalWidth - ri.node.BBox!.x + 8;
        rect.attr('width', rectWidth);
        // Expand totalWidth to ensure the viewBox includes the highlight rect + stroke
        totalWidth = Math.max(totalWidth, ri.node.BBox!.x + rectWidth + 2);
      }
    }
  }

  return { totalHeight, totalWidth };
};

const draw: DrawDefinition = async (text, id, _ver, diagObj) => {
  log.debug('Rendering treeView diagram\n' + text);

  const db = diagObj.db as TreeViewDB;
  const root = db.getRoot();
  const config = db.getConfig();

  const svg = selectSvgElement(id);

  // Inject icon definitions (scoped to diagramId to avoid duplicates)
  await injectIconDefs(svg, root, config, id);

  const treeElem = svg.append('g');
  treeElem.attr('class', 'tree-view');

  const { totalHeight, totalWidth } = drawTree(treeElem, root, config, id);
  /* -${config.lineThickness/2} is required for a line with x coordinate = 0
     as there is overflow to the left due to the line being centered */
  svg.attr('viewBox', `-${config.lineThickness / 2} 0 ${totalWidth} ${totalHeight}`);
  configureSvgSize(svg, totalHeight, totalWidth, config.useMaxWidth);
};

const renderer: DiagramRenderer = {
  draw,
};

export default renderer;
