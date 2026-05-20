import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3';
import type { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3';
import type { Diagram } from '../../Diagram.js';
import type { NetworkDiagramConfig } from '../../config.type.js';
import type { DiagramRenderer, DrawDefinition, SVG, SVGGroup } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { NetworkDBImpl } from './db.js';
import type {
  NetworkLinkData,
  NetworkLinkDirection,
  NetworkNodeData,
  NetworkSubnetData,
} from './types.js';

interface SimNode extends SimulationNodeDatum {
  id: string;
  data: NetworkNodeData;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  data: NetworkLinkData;
}

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as NetworkDBImpl;
  const config = db.getConfig();
  const title = db.getDiagramTitle();
  const nodes = db.getNodes();
  const links = db.getLinks();
  const subnets = db.getSubnets();

  const svg: SVG = selectSvgElement(id);

  defineMarkers(svg, id);

  const simNodes: SimNode[] = nodes.map((n) => ({ id: n.id, data: n }));
  const nodeById = new Map(simNodes.map((n) => [n.id, n]));
  const simLinks: SimLink[] = links
    .filter((l) => nodeById.has(l.source) && nodeById.has(l.target))
    .map((l) => ({
      source: nodeById.get(l.source)!,
      target: nodeById.get(l.target)!,
      data: l,
    }));

  layout(simNodes, simLinks, subnets, config);

  const subnetBounds = computeSubnetBounds(simNodes, subnets, config);
  const { minX, minY, width, height } = computeBounds(simNodes, subnetBounds, config);
  const titleHeight = title ? 32 : 0;
  const svgWidth = width + config.padding * 2;
  const svgHeight = height + config.padding * 2 + titleHeight;

  svg.attr(
    'viewBox',
    `${minX - config.padding} ${minY - config.padding - titleHeight} ${svgWidth} ${svgHeight}`
  );
  configureSvgSize(svg, svgHeight, svgWidth, true);

  if (title) {
    svg
      .append('text')
      .attr('class', 'networkTitle')
      .attr('x', minX + width / 2)
      .attr('y', minY - config.padding - titleHeight / 2)
      .attr('dominant-baseline', 'middle')
      .text(title);
  }

  drawSubnets(svg, subnetBounds, config);
  drawLinks(svg, simLinks, config, id);
  drawNodes(svg, simNodes, config);
};

const layout = (
  nodes: SimNode[],
  links: SimLink[],
  subnets: NetworkSubnetData[],
  config: Required<NetworkDiagramConfig>
) => {
  if (nodes.length === 0) {
    return;
  }
  if (nodes.length === 1) {
    nodes[0].x = 0;
    nodes[0].y = 0;
    return;
  }

  const radius = Math.max(config.nodeSpacing, config.iconSize) * Math.sqrt(nodes.length);
  const angleStep = (2 * Math.PI) / nodes.length;
  nodes.forEach((n, i) => {
    n.x = Math.cos(i * angleStep) * radius;
    n.y = Math.sin(i * angleStep) * radius;
  });

  const sameSubnetLinks: SimulationLinkDatum<SimNode>[] = [];
  for (const subnet of subnets) {
    const subnetNodes = subnet.nodeIds
      .map((nid) => nodes.find((n) => n.id === nid))
      .filter((n): n is SimNode => !!n);
    for (let i = 0; i < subnetNodes.length; i++) {
      for (let j = i + 1; j < subnetNodes.length; j++) {
        sameSubnetLinks.push({ source: subnetNodes[i], target: subnetNodes[j] });
      }
    }
  }

  const sim: Simulation<SimNode, SimLink> = forceSimulation<SimNode>(nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(config.nodeSpacing)
        .strength(1)
    )
    .force(
      'subnet',
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(sameSubnetLinks)
        .id((d) => d.id)
        .distance(config.nodeSpacing * 0.6)
        .strength(0.3)
    )
    .force('charge', forceManyBody<SimNode>().strength(-Math.max(400, config.nodeSpacing * 3)))
    .force('x', forceX<SimNode>(0).strength(0.04))
    .force('y', forceY<SimNode>(0).strength(0.06))
    .force('collide', forceCollide<SimNode>(config.iconSize * 0.9))
    .stop();

  for (let i = 0; i < config.iterations; i++) {
    sim.tick();
  }
};

interface SubnetBox {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const computeSubnetBounds = (
  nodes: SimNode[],
  subnets: NetworkSubnetData[],
  config: Required<NetworkDiagramConfig>
): SubnetBox[] => {
  const padding = config.iconSize * 0.6;
  const labelHeight = config.labelFontSize + 8;
  const boxes: SubnetBox[] = [];
  for (const subnet of subnets) {
    const members = subnet.nodeIds
      .map((nid) => nodes.find((n) => n.id === nid))
      .filter((n): n is SimNode => !!n);
    if (members.length === 0) {
      continue;
    }
    const xs = members.map((n) => n.x ?? 0);
    const ys = members.map((n) => n.y ?? 0);
    const minX = Math.min(...xs) - padding;
    const minY = Math.min(...ys) - padding - labelHeight;
    const maxX = Math.max(...xs) + padding;
    const maxY = Math.max(...ys) + padding + config.labelFontSize + 8;
    boxes.push({
      id: subnet.id,
      label: subnet.label,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    });
  }
  return boxes;
};

const computeBounds = (
  nodes: SimNode[],
  subnets: SubnetBox[],
  config: Required<NetworkDiagramConfig>
) => {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, width: 200, height: 100 };
  }
  const labelMargin = config.labelFontSize + 8;
  const xs = nodes.map((n) => n.x ?? 0);
  const ys = nodes.map((n) => n.y ?? 0);
  let minX = Math.min(...xs) - config.iconSize / 2;
  let maxX = Math.max(...xs) + config.iconSize / 2;
  let minY = Math.min(...ys) - config.iconSize / 2;
  let maxY = Math.max(...ys) + config.iconSize / 2 + labelMargin;
  for (const s of subnets) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + s.width);
    maxY = Math.max(maxY, s.y + s.height);
  }
  return { minX, minY, width: maxX - minX, height: maxY - minY };
};

const ICON_HALF_EXTENTS: Record<string, { hw: number; hh: number; circular?: boolean }> = {
  router: { hw: 0.5, hh: 0.5, circular: true },
  cloud: { hw: 0.5, hh: 0.5, circular: true },
  switch: { hw: 0.9, hh: 0.55 },
  firewall: { hw: 0.9, hh: 0.7 },
  server: { hw: 0.65, hh: 0.95 },
  database: { hw: 0.7, hh: 0.9 },
};
const DEFAULT_HALF_EXTENT = { hw: 0.8, hh: 0.6 };

const iconBoundaryDistance = (
  nodeType: string,
  ux: number,
  uy: number,
  iconSize: number
): number => {
  const ext = ICON_HALF_EXTENTS[nodeType] ?? DEFAULT_HALF_EXTENT;
  const r = iconSize / 2;
  if (ext.circular) {
    return r;
  }
  const hw = ext.hw * iconSize;
  const hh = ext.hh * iconSize;
  const ax = Math.abs(ux);
  const ay = Math.abs(uy);
  const tx = ax > 1e-6 ? hw / ax : Infinity;
  const ty = ay > 1e-6 ? hh / ay : Infinity;
  return Math.min(tx, ty);
};

const defineMarkers = (svg: SVG, id: string) => {
  const defs = svg.append('defs');
  const make = (markerId: string, reverse: boolean) => {
    const marker = defs
      .append('marker')
      .attr('id', `${id}-network-arrow-${markerId}`)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', reverse ? 0 : 10)
      .attr('refY', 5)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto-start-reverse');
    marker
      .append('path')
      .attr('d', reverse ? 'M 10 0 L 0 5 L 10 10 z' : 'M 0 0 L 10 5 L 0 10 z')
      .attr('class', 'networkArrowHead');
  };
  make('end', false);
  make('start', true);
};

const drawSubnets = (svg: SVG, subnets: SubnetBox[], config: Required<NetworkDiagramConfig>) => {
  if (subnets.length === 0) {
    return;
  }
  const g: SVGGroup = svg.append('g').attr('class', 'networkSubnets');
  for (const subnet of subnets) {
    const group = g.append('g').attr('class', 'networkSubnet').attr('data-id', subnet.id);
    group
      .append('rect')
      .attr('class', 'networkSubnetBox')
      .attr('x', subnet.x)
      .attr('y', subnet.y)
      .attr('width', subnet.width)
      .attr('height', subnet.height)
      .attr('rx', 8);
    group
      .append('text')
      .attr('class', 'networkSubnetLabel')
      .attr('x', subnet.x + 8)
      .attr('y', subnet.y + config.labelFontSize)
      .attr('font-size', config.labelFontSize)
      .text(subnet.label);
  }
};

const drawLinks = (
  svg: SVG,
  links: SimLink[],
  config: Required<NetworkDiagramConfig>,
  id: string
) => {
  const g: SVGGroup = svg.append('g').attr('class', 'networkLinks');
  for (const link of links) {
    const source = link.source as SimNode;
    const target = link.target as SimNode;
    const x1 = source.x ?? 0;
    const y1 = source.y ?? 0;
    const x2 = target.x ?? 0;
    const y2 = target.y ?? 0;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const t1 = iconBoundaryDistance(source.data.nodeType, ux, uy, config.iconSize);
    const t2 = iconBoundaryDistance(target.data.nodeType, -ux, -uy, config.iconSize);
    const tx1 = x1 + ux * t1;
    const ty1 = y1 + uy * t1;
    const tx2 = x2 - ux * t2;
    const ty2 = y2 - uy * t2;

    const line = g
      .append('line')
      .attr('class', `networkLink networkLink-${link.data.direction}`)
      .attr('data-source', source.id)
      .attr('data-target', target.id)
      .attr('data-direction', link.data.direction)
      .attr('x1', tx1)
      .attr('y1', ty1)
      .attr('x2', tx2)
      .attr('y2', ty2);

    applyArrows(line, link.data.direction, id);

    if (link.data.label) {
      g.append('text')
        .attr('class', 'networkLinkLabel')
        .attr('font-size', config.linkLabelFontSize)
        .attr('x', (x1 + x2) / 2)
        .attr('y', (y1 + y2) / 2)
        .text(link.data.label);
    }
  }
};

const applyArrows = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  line: any,
  direction: NetworkLinkDirection,
  id: string
) => {
  switch (direction) {
    case 'forward':
      line.attr('marker-end', `url(#${id}-network-arrow-end)`);
      break;
    case 'backward':
      line.attr('marker-start', `url(#${id}-network-arrow-start)`);
      break;
    case 'both':
      line.attr('marker-end', `url(#${id}-network-arrow-end)`);
      line.attr('marker-start', `url(#${id}-network-arrow-start)`);
      break;
    default:
  }
};

const drawNodes = (svg: SVG, nodes: SimNode[], config: Required<NetworkDiagramConfig>) => {
  const g: SVGGroup = svg.append('g').attr('class', 'networkNodes');
  for (const node of nodes) {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const group = g
      .append('g')
      .attr('class', `networkNode networkNode-${sanitizeClass(node.data.nodeType)}`)
      .attr('data-id', node.id)
      .attr('transform', `translate(${x}, ${y})`);

    if (node.data.meta && node.data.meta.length > 0) {
      const tooltip = [node.data.label, ...node.data.meta.map((m) => `${m.key}: ${m.value}`)].join(
        '\n'
      );
      group.append('title').text(tooltip);
    }

    drawIcon(group, node.data.nodeType, config.iconSize);

    group
      .append('text')
      .attr('class', 'networkLabel')
      .attr('x', 0)
      .attr('y', config.iconSize / 2 + 4)
      .attr('font-size', config.labelFontSize)
      .text(node.data.label);
  }
};

const sanitizeClass = (s: string) => s.replace(/[^\w-]/g, '_');

const drawIcon = (group: SVGGroup, type: string, size: number) => {
  const half = size / 2;
  switch (type) {
    case 'router':
      drawRouter(group, half);
      break;
    case 'switch':
      drawSwitch(group, half);
      break;
    case 'server':
      drawServer(group, half);
      break;
    case 'firewall':
      drawFirewall(group, half);
      break;
    case 'cloud':
    case 'internet':
      drawCloud(group, half);
      break;
    case 'database':
    case 'db':
      drawDatabase(group, half);
      break;
    default:
      drawDefault(group, half);
  }
};

const drawRouter = (group: SVGGroup, r: number) => {
  group.append('circle').attr('class', 'networkNodeIcon').attr('r', r);
  const arm = r * 0.55;
  const tip = r * 0.85;
  const head = r * 0.15;
  const arrows = [
    `M 0 ${-arm} L 0 ${-tip} M ${-head} ${-tip + head} L 0 ${-tip} L ${head} ${-tip + head}`,
    `M 0 ${arm} L 0 ${tip} M ${-head} ${tip - head} L 0 ${tip} L ${head} ${tip - head}`,
    `M ${-arm} 0 L ${-tip} 0 M ${-tip + head} ${-head} L ${-tip} 0 L ${-tip + head} ${head}`,
    `M ${arm} 0 L ${tip} 0 M ${tip - head} ${-head} L ${tip} 0 L ${tip - head} ${head}`,
  ];
  for (const d of arrows) {
    group
      .append('path')
      .attr('class', 'accent')
      .attr('d', d)
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', Math.max(1.5, r * 0.08));
  }
};

const drawSwitch = (group: SVGGroup, r: number) => {
  const w = r * 1.8;
  const h = r * 1.1;
  group
    .append('rect')
    .attr('class', 'networkNodeIcon')
    .attr('x', -w / 2)
    .attr('y', -h / 2)
    .attr('width', w)
    .attr('height', h)
    .attr('rx', r * 0.15);
  const y1 = -h * 0.15;
  const y2 = h * 0.15;
  const tip = w * 0.35;
  const head = r * 0.18;
  group
    .append('path')
    .attr('class', 'accent')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', Math.max(1, r * 0.07))
    .attr(
      'd',
      `M ${-tip} ${y1} L ${tip} ${y1} M ${tip - head} ${y1 - head} L ${tip} ${y1} L ${tip - head} ${y1 + head} ` +
        `M ${tip} ${y2} L ${-tip} ${y2} M ${-tip + head} ${y2 - head} L ${-tip} ${y2} L ${-tip + head} ${y2 + head}`
    );
};

const drawServer = (group: SVGGroup, r: number) => {
  const w = r * 1.3;
  const h = r * 1.9;
  group
    .append('rect')
    .attr('class', 'networkNodeIcon')
    .attr('x', -w / 2)
    .attr('y', -h / 2)
    .attr('width', w)
    .attr('height', h)
    .attr('rx', r * 0.1);
  const stroke = Math.max(1, r * 0.06);
  for (let i = -1; i <= 1; i++) {
    const y = i * (h / 4);
    group
      .append('line')
      .attr('class', 'accent')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', stroke)
      .attr('x1', -w * 0.35)
      .attr('x2', w * 0.35)
      .attr('y1', y)
      .attr('y2', y);
  }
};

const drawFirewall = (group: SVGGroup, r: number) => {
  const w = r * 1.8;
  const h = r * 1.4;
  group
    .append('rect')
    .attr('class', 'networkNodeIcon')
    .attr('x', -w / 2)
    .attr('y', -h / 2)
    .attr('width', w)
    .attr('height', h)
    .attr('rx', r * 0.08);
  const rows = 3;
  const cols = 4;
  const bw = w / cols;
  const bh = h / rows;
  const stroke = Math.max(0.8, r * 0.05);
  for (let i = 1; i < rows; i++) {
    const y = -h / 2 + i * bh;
    group
      .append('line')
      .attr('class', 'accent')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', stroke)
      .attr('x1', -w / 2)
      .attr('x2', w / 2)
      .attr('y1', y)
      .attr('y2', y);
  }
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : bw / 2;
    for (let c = 1; c < cols; c++) {
      const x = -w / 2 + c * bw - offset;
      if (x <= -w / 2 || x >= w / 2) {
        continue;
      }
      const y0 = -h / 2 + row * bh;
      const y1 = y0 + bh;
      group
        .append('line')
        .attr('class', 'accent')
        .attr('stroke', 'currentColor')
        .attr('stroke-width', stroke)
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', y0)
        .attr('y2', y1);
    }
  }
};

const drawCloud = (group: SVGGroup, r: number) => {
  const cy = r * 0.1;
  group
    .append('path')
    .attr('class', 'networkNodeIcon')
    .attr(
      'd',
      `M ${-r * 0.9} ${cy + r * 0.3} ` +
        `a ${r * 0.45} ${r * 0.45} 0 0 1 ${r * 0.4} ${-r * 0.7} ` +
        `a ${r * 0.5} ${r * 0.5} 0 0 1 ${r * 0.9} ${-r * 0.05} ` +
        `a ${r * 0.4} ${r * 0.4} 0 0 1 ${r * 0.55} ${r * 0.55} ` +
        `a ${r * 0.35} ${r * 0.35} 0 0 1 ${-r * 0.15} ${r * 0.55} ` +
        `Z`
    );
};

const drawDatabase = (group: SVGGroup, r: number) => {
  const w = r * 1.4;
  const h = r * 1.8;
  const ry = r * 0.25;
  group
    .append('path')
    .attr('class', 'networkNodeIcon')
    .attr(
      'd',
      `M ${-w / 2} ${-h / 2 + ry} ` +
        `a ${w / 2} ${ry} 0 0 0 ${w} 0 ` +
        `L ${w / 2} ${h / 2 - ry} ` +
        `a ${w / 2} ${ry} 0 0 1 ${-w} 0 ` +
        `Z`
    );
  group
    .append('path')
    .attr('class', 'accent')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', Math.max(1, r * 0.06))
    .attr('d', `M ${-w / 2} ${-h / 2 + ry} a ${w / 2} ${ry} 0 0 0 ${w} 0`);
};

const drawDefault = (group: SVGGroup, r: number) => {
  const w = r * 1.6;
  const h = r * 1.2;
  group
    .append('rect')
    .attr('class', 'networkNodeIcon')
    .attr('x', -w / 2)
    .attr('y', -h / 2)
    .attr('width', w)
    .attr('height', h)
    .attr('rx', r * 0.2);
};

export const renderer: DiagramRenderer = { draw };
