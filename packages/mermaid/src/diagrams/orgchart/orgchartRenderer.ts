import rough from 'roughjs';
import { getConfig } from '../../config.js';
import type { DrawDefinition, SVGGroup } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import utils from '../../utils.js';
import { layoutOrgChart } from './orgchartLayout.js';
import type { OrgChartLayoutOptions } from './orgchartLayout.js';
import type { OrgChartDB, OrgNode } from './orgchartTypes.js';

const PADDING = 20;
const NODE_PADDING_X = 16;
const NODE_PADDING_Y = 10;
const LINE_GAP = 4;
const MIN_NODE_WIDTH = 100;
const TITLE_TOP_MARGIN = 20;

const toPlainText = (text: string): string => utils.entityDecode(text);

const measure = (group: SVGGroup, text: string, cssClass: string) => {
  const probe = group.append('text').attr('class', cssClass).text(text);
  const element = probe.node();
  if (!element) {
    throw new Error('Could not measure orgchart label');
  }
  const box = element.getBBox();
  probe.remove();
  return box;
};

/** All boxes share one size so the chart reads as a regular grid. */
const measureNodes = (chart: SVGGroup, nodes: OrgNode[]) => {
  const group = chart.append('g').attr('class', 'orgchart-node');
  let width = MIN_NODE_WIDTH;
  let labelHeight = 0;
  let secondaryHeight = 0;
  for (const node of nodes) {
    const label = measure(group, toPlainText(node.label), 'orgchart-label');
    width = Math.max(width, label.width + NODE_PADDING_X * 2);
    labelHeight = Math.max(labelHeight, label.height);
    if (node.secondaryLabel) {
      const secondary = measure(
        group,
        toPlainText(node.secondaryLabel),
        'orgchart-secondary-label'
      );
      width = Math.max(width, secondary.width + NODE_PADDING_X * 2);
      secondaryHeight = Math.max(secondaryHeight, secondary.height);
    }
  }
  group.remove();
  const height =
    labelHeight + (secondaryHeight ? secondaryHeight + LINE_GAP : 0) + NODE_PADDING_Y * 2;
  return { width, height, labelHeight, secondaryHeight };
};

const draw: DrawDefinition = (text, id, _version, diagram) => {
  log.debug('Rendering orgchart diagram\n' + text);
  const db = diagram.db as OrgChartDB;
  const root = db.getRoot();
  const svg = selectSvgElement(id);
  if (!root) {
    throw new Error('Cannot render an orgchart without a root node');
  }

  const chart = svg.append('g').attr('class', 'orgchart');
  const size = measureNodes(chart, db.getNodes());
  const { look, handDrawnSeed } = getConfig();
  const roughSvg = look === 'handDrawn' ? rough.svg(svg.node()!) : undefined;
  const roughOptions = { seed: handDrawnSeed, roughness: 0.7, stroke: 'currentColor' };
  const options: OrgChartLayoutOptions = {
    nodeWidth: size.width,
    nodeHeight: size.height,
    siblingGap: 24,
    levelGap: 40,
    staffGap: 24,
    staffRowGap: 16,
  };
  const layout = layoutOrgChart(root, options);

  const connectors = chart.append('g').attr('class', 'orgchart-connectors');
  for (const connector of layout.connectors) {
    const path = connector.segments.map(([x1, y1, x2, y2]) => `M${x1},${y1}L${x2},${y2}`).join('');
    const cssClass = `orgchart-connector orgchart-connector-${connector.kind}`;
    if (roughSvg) {
      const line = roughSvg.path(path, roughOptions);
      line.setAttribute('class', cssClass);
      connectors.node()!.appendChild(line);
    } else {
      connectors.append('path').attr('class', cssClass).attr('d', path);
    }
  }

  const nodes = chart.append('g').attr('class', 'orgchart-nodes');
  for (const { node, x, y, width, height } of layout.nodes) {
    const g = nodes
      .append('g')
      .attr('class', `orgchart-node orgchart-node-${node.kind}`)
      .attr('id', `${id}-${node.id}`)
      .attr('transform', `translate(${x},${y})`);
    if (roughSvg) {
      const box = roughSvg.rectangle(0, 0, width, height, {
        ...roughOptions,
        fill: 'currentColor',
        fillStyle: 'solid',
      });
      box.setAttribute('class', 'orgchart-node-shape');
      for (const path of box.querySelectorAll('path')) {
        path.setAttribute(
          'class',
          path.getAttribute('stroke') === 'none' ? 'orgchart-node-fill' : 'orgchart-node-outline'
        );
      }
      g.node()!.appendChild(box);
    } else {
      g.append('rect').attr('width', width).attr('height', height).attr('rx', 4).attr('ry', 4);
    }

    // Stack the primary and secondary label, centred as a block.
    const lineHeights = [size.labelHeight, ...(node.secondaryLabel ? [size.secondaryHeight] : [])];
    const blockHeight =
      lineHeights.reduce((a, b) => a + b, 0) + (node.secondaryLabel ? LINE_GAP : 0);
    let cursor = (height - blockHeight) / 2;
    g.append('text')
      .attr('class', 'orgchart-label')
      .attr('x', width / 2)
      .attr('y', cursor + size.labelHeight / 2)
      .text(toPlainText(node.label));
    if (node.secondaryLabel) {
      cursor += size.labelHeight + LINE_GAP;
      g.append('text')
        .attr('class', 'orgchart-secondary-label')
        .attr('x', width / 2)
        .attr('y', cursor + size.secondaryHeight / 2)
        .text(toPlainText(node.secondaryLabel));
    }
  }

  utils.insertTitle(svg, 'orgchart-title', TITLE_TOP_MARGIN, toPlainText(db.getDiagramTitle()));
  setupViewPortForSVG(svg, PADDING, 'orgchart', true);
};

export const renderer = { draw };
