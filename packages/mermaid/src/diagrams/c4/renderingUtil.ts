import { select } from 'd3';
import type { Edge, LayoutData, Node } from '../../rendering-util/types.js';
import { getIconSVG, registerIconPacks } from '../../rendering-util/icons.js';
import { c4Icons, getIconDimensions } from './c4Icons.js';
import type { SVG } from '../../mermaid.js';
import { calculateTextWidth } from '../../utils.js';
import { getConfig } from '../../config.js';
import type { Legend } from './c4Types.js';

const supportedIcons = ['database', 'person'];

export async function addIcons(svgId: string, data4Layout: LayoutData) {
  registerIconPacks([
    {
      name: c4Icons.prefix,
      icons: c4Icons,
    },
  ]);

  // Add icons to nodes with sprites
  await Promise.all(
    data4Layout.nodes.map(async (node: Node) => {
      const nodeElem = select(`#${svgId}`).select(`#${node.id}`);
      if (!nodeElem.empty()) {
        // Check if nodeElem exists
        const labelElem = nodeElem.select('.label');
        const labelElemNode = labelElem.node();
        if (labelElemNode && node.icon) {
          // Check if labelElem exists
          const svgGroup = nodeElem.append('g').attr('class', 'sprite');
          const iconName = getNodeIconName(node);
          svgGroup.html(
            `<g>${await getIconSVG(iconName, { height: getIconDimensions(iconName).height, width: getIconDimensions(iconName).width, fallbackPrefix: c4Icons.prefix })}</g>`
          );
          const svg = svgGroup.select('svg');
          svg.attr(
            'viewBox',
            `0 0 ${getIconDimensions(iconName).viewBox} ${getIconDimensions(iconName).viewBox}`
          );

          // Get label position
          const labelTransform = labelElem.attr('transform');
          let labelY = 0;
          if (labelTransform) {
            const match = /translate\(([^,]+),\s*([^)]+)\)/.exec(labelTransform);
            if (match) {
              labelY = parseFloat(match[2]);
            }
          }

          // Position SVG
          svg.attr(
            'transform',
            `translate(-${getIconDimensions(iconName).width / 2}, ${labelY + 25})`
          );
        }
      }
    })
  );

  // Add icons to edges with sprites
  await Promise.all(
    data4Layout.edges.map(async (edge: Edge) => {
      const edgeElem = select(`#${svgId}`).select(`#${edge.id}`);
      const labelElem = select(
        (
          select(`#${svgId}`)
            .selectAll('.edgeLabel')
            .filter(function () {
              const style = select(this).attr('style') || '';
              if (data4Layout.config.layout === 'elk') {
                return style.includes(edge.id.slice(0, -2));
              }
              return style.includes(edge.id);
            })
            .node() as HTMLElement
        ).closest('.label')
      );
      const width = (labelElem?.node() as SVGGraphicsElement)?.getBBox().width || 0;

      if (!edgeElem.node() || !labelElem) {
        return;
      }

      if (edge.icon) {
        const svgGroup = labelElem.append('g').attr('class', 'sprite');
        const iconName = getEdgeIconName(edge);
        svgGroup.html(
          `<g>${await getIconSVG(iconName, { height: getIconDimensions(iconName).height, width: getIconDimensions(iconName).width, fallbackPrefix: c4Icons.prefix })}</g>`
        );
        const svg = svgGroup.select('svg');
        svg.attr(
          'viewBox',
          `0 0 ${getIconDimensions(iconName).viewBox} ${getIconDimensions(iconName).viewBox}`
        );

        // Position SVG
        svg.attr('transform', `translate(${width / 2 - getIconDimensions(iconName).width / 2}, 5)`);
      }
    })
  );
}

function getNodeIconName(node: Node): string {
  if (!node.icon) {
    return 'unknown';
  }
  if (supportedIcons.includes(node.icon)) {
    return node.icon;
  }
  return 'unknown';
}

function getEdgeIconName(edge: Edge): string {
  if (!edge.icon) {
    return 'unknown';
  }
  if (supportedIcons.includes(edge.icon)) {
    return edge.icon;
  }
  return 'unknown';
}

export async function drawLegend(svg: SVG, legend: Legend) {
  // Get SVG dimensions
  const padding = 40;
  const itemHeight = 30;
  const totalHeight = legend.items.length * itemHeight + 40;
  const itemMaxWidth = legend.items.reduce((max, item) => {
    const width = calculateTextWidth(item.text, getConfig());
    return Math.max(max, width || 0);
  }, 0);
  const maxWidth = Math.max(
    itemMaxWidth,
    calculateTextWidth(Array.isArray(legend.title) ? legend.title[0] : legend.title, getConfig())
  );
  let yOffset = 10;

  // Create legend group
  const legendGroup = svg.append('g').attr('class', 'legend');

  const bkgRect = legendGroup
    .append('rect')
    .attr('class', 'legendBkg')
    .attr('x', -padding / 2 - 5)
    .attr('y', -padding / 2)
    .attr('width', maxWidth + padding * 2)
    .attr('height', totalHeight + padding / 2)
    .attr('fill', 'white')
    .attr('stroke', 'black');

  if (legend.items.length === 0) {
    bkgRect.attr('x', -padding);
  }

  legendGroup
    .append('text')
    .text(legend.title)
    .attr('class', 'legend-title')
    .attr('style', 'font-weight: bold;');

  for (const legendItem of legend.items) {
    // Separate color style for text
    const colorStyles = legendItem.styles.filter((style) => style.includes('color')) || [];
    const colorStyle = colorStyles[colorStyles.length - 1] || '';
    const otherStyles = legendItem.styles.filter(
      (style) =>
        !style.includes('color') &&
        !style.includes('stroke-width') &&
        !style.includes('drop-shadow')
    );

    const legendItemGroup = legendGroup.append('g').attr('class', 'legend-item');
    const rect = legendItemGroup
      .append('rect')
      .attr('width', maxWidth + 30)
      .attr('height', 30)
      .attr('x', 0)
      .attr('style', 'fill: none; opacity: 0.75;');

    if (legendItem.type === 'node') {
      rect.attr('style', 'fill: none; opacity: 0.75;' + otherStyles.join(';'));
    }

    // Add sprite if exists
    if (legendItem.sprite) {
      const svgGroup = legendItemGroup.append('g').attr('class', 'sprite');
      const iconName = getNodeIconName({ icon: legendItem.sprite } as Node);
      svgGroup.html(
        `<g>${await getIconSVG(iconName, { height: 20, width: 20, fallbackPrefix: c4Icons.prefix })}</g>`
      );
      const svg = svgGroup.select('svg');
      svg.attr(
        'viewBox',
        `0 0 ${getIconDimensions(iconName).viewBox} ${getIconDimensions(iconName).viewBox}`
      );

      // Position SVG
      svg.attr('transform', `translate(4, 4)`);
    } else if (legendItem.type === 'node') {
      // Draw empty box for node
      legendItemGroup
        .append('rect')
        .attr('width', 10)
        .attr('height', 20)
        .attr('x', 4)
        .attr('y', 4)
        .attr('transform', 'translate(5, 0)')
        .attr('style', otherStyles.join(';'));
    } else if (legendItem.type === 'rel') {
      // Draw horizontal line for relationship
      legendItemGroup
        .append('line')
        .attr('x1', 4)
        .attr('y1', 15)
        .attr('x2', 24)
        .attr('y2', 15)
        .attr('style', 'stroke:black;' + otherStyles.join(';'));
    }

    legendItemGroup
      .append('text')
      .text(legendItem.text)
      .attr('class', 'legend-text')
      .attr('x', 28)
      .attr('y', 20)
      .attr('style', colorStyle.replace('color', 'fill'));

    legendItemGroup.attr('transform', `translate(0, ${yOffset})`);

    yOffset += 30;
  }

  const svgBBox = svg.node()?.getBBox();
  const bbox = legendGroup.node()?.getBBox();
  if (svgBBox) {
    legendGroup.attr(
      'transform',
      `translate(
      ${svgBBox.width - (bbox?.width ?? 0)}, 
      ${svgBBox.height}
    )`
    );
  }

  return legendGroup;
}
