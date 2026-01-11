import type { Diagram } from '../../Diagram.js';
import type { VennData, VennDB, VennTextData } from './vennTypes.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import type { VennDiagramConfig } from '../../config.type.js';
import type { Selection } from 'd3';
import { schemeCategory10 as colors, select as d3select } from 'd3';
import { getConfig } from '../../config.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import * as venn from '@upsetjs/venn.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';

type DummyD3Root = Selection<HTMLDivElement, unknown, null, undefined>;

export const draw: DrawDefinition = (
  _text: string,
  id: string,
  _version: string,
  diagObj: Diagram
): void => {
  const db = diagObj.db as VennDB;
  const config = db.getConfig?.();
  const { themeVariables } = getConfig();
  const title = db.getDiagramTitle?.();
  const titleHeight = title ? 48 : 0;
  const sets = db.getSubsetData();
  const textNodes = db.getTextData();

  // Build lookup tables for custom colors per set/union
  const defaultTextColor = themeVariables.primaryTextColor ?? themeVariables.textColor;
  const customFontColorMap = new Map<VennData['sets'], string>(
    sets.filter((s) => s.color).map((s) => [s.sets, s.color!])
  );
  const customBackgroundColorMap = new Map<VennData['sets'], string>(
    sets.filter((s) => s.background).map((s) => [s.sets, s.background!])
  );

  // Prepare the target viewBox
  const svg = selectSvgElement(id);
  const svgWidth = 1600;
  const svgHeight = 900;
  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

  if (title) {
    svg
      .append('text')
      .text(title)
      .attr('font-size', '32px')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('x', '50%')
      .attr('y', 32);
  }

  // Get the original SVG output of Venn.js from a dummy root
  const dummyD3root: DummyD3Root = d3select(document.createElement('div'));
  const vennDiagram = venn
    .VennDiagram()
    .width(svgWidth)
    .height(svgHeight - titleHeight);
  dummyD3root.datum(sets).call(vennDiagram as never);

  // Compute layout areas so we can position additional text nodes
  const layoutAreas = venn.layout(sets, {
    width: svgWidth,
    height: svgHeight - titleHeight,
    padding: config?.padding ?? 15,
  });

  // Build a lookup table from set key to layout area
  const layoutByKey = new Map<string, (typeof layoutAreas)[number]>();
  for (const area of layoutAreas) {
    const key = stableSetsKey([...area.data.sets].sort());
    layoutByKey.set(key, area);
  }

  if (textNodes.length > 0) {
    renderTextNodes(config, layoutByKey, dummyD3root, textNodes);
  }

  // Style the set circles
  dummyD3root
    .selectAll('.venn-circle path')
    .style('fill-opacity', 0)
    .style('stroke-width', 5)
    .style('stroke-opacity', 0.3)
    .style('stroke', (_, i) => colors[i]);

  // Style the set labels
  dummyD3root.selectAll('.venn-circle text').style('font-size', '48px');

  // Style the union labels
  dummyD3root
    .selectAll('.venn-intersection text')
    .style('font-size', '48px')
    .style('fill', (e) => customFontColorMap.get((e as VennData).sets) ?? defaultTextColor);
  dummyD3root
    .selectAll('.venn-intersection path')
    .style('fill-opacity', (e) => (customBackgroundColorMap.has((e as VennData).sets) ? 1 : 0))
    .style('fill', (e) => customBackgroundColorMap.get((e as VennData).sets) ?? 'transparent');

  // Transfer the dummy SVG contents into the real SVG group
  const vennGroup = svg.append('g').attr('transform', `translate(0, ${titleHeight})`);
  const dummySvg = dummyD3root.select('svg').node();
  if (dummySvg && 'childNodes' in dummySvg) {
    for (const child of [...dummySvg.childNodes]) {
      vennGroup.node()?.appendChild(child);
    }
  }
  configureSvgSize(svg, svgHeight, svgWidth, config?.useMaxWidth ?? true);
};

function stableSetsKey(setIds: string[]): string {
  return setIds.join('|');
}

function renderTextNodes(
  config: Required<VennDiagramConfig>,
  layoutByKey: Map<string, venn.IVennLayout<VennData>>,
  dummyD3root: DummyD3Root,
  textNodes: VennTextData[]
) {
  const useDebugLayout = config?.useDebugLayout ?? false;
  const vennSvg = dummyD3root.select('svg');
  const textGroup = vennSvg.append('g').attr('class', 'venn-text-nodes');

  // Group text nodes by the set key they belong to
  const nodesByArea = new Map<string, VennTextData[]>();
  for (const node of textNodes) {
    const key = stableSetsKey(node.sets);
    const existing = nodesByArea.get(key);
    if (existing) {
      existing.push(node);
    } else {
      nodesByArea.set(key, [node]);
    }
  }

  // For each area, compute a text box and place nodes in a grid.
  for (const [key, nodes] of nodesByArea.entries()) {
    const area = layoutByKey.get(key);
    if (!area?.text) {
      continue;
    }
    // Calculate the center point and a safe inner radius for text.
    const centerX = area.text.x;
    const centerY = area.text.y;
    const minCircleRadius = Math.min(...area.circles.map((c) => c.radius));
    const innerRadiusRaw = Math.min(
      ...area.circles.map((c) => c.radius - Math.hypot(centerX - c.x, centerY - c.y))
    );
    let innerRadius = Number.isFinite(innerRadiusRaw) ? Math.max(0, innerRadiusRaw) : 0;
    if (innerRadius === 0 && Number.isFinite(minCircleRadius)) {
      innerRadius = minCircleRadius * 0.6;
    }

    // Render text area container
    const areaGroup = textGroup
      .append('g')
      .attr('class', 'venn-text-area')
      .attr('font-size', `40px`);
    if (useDebugLayout) {
      areaGroup
        .append('circle')
        .attr('class', 'venn-text-debug-circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', innerRadius)
        .attr('fill', 'none')
        .attr('stroke', 'purple')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6 4');
    }

    // Compute a grid within the area for placing text nodes
    const innerWidth = Math.max(80, innerRadius * 2 * 0.95);
    const innerHeight = Math.max(60, innerRadius * 2 * 0.95);
    const hasLabel = area.data.label && area.data.label.length > 0;
    const labelOffsetBase = hasLabel ? Math.min(32, innerRadius * 0.25) : 0;
    const labelOffset = labelOffsetBase + (nodes.length <= 2 ? 30 : 0);
    const startX = centerX - innerWidth / 2;
    const startY = centerY - innerHeight / 2 + labelOffset;
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    const rows = Math.max(1, Math.ceil(nodes.length / cols));
    const cellWidth = innerWidth / cols;
    const cellHeight = innerHeight / rows;

    // Place each node into a grid cell
    for (const [i, node] of nodes.entries()) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + cellWidth * (col + 0.5);
      const y = startY + cellHeight * (row + 0.5);

      if (useDebugLayout) {
        areaGroup
          .append('rect')
          .attr('class', 'venn-text-debug-cell')
          .attr('x', startX + cellWidth * col)
          .attr('y', startY + cellHeight * row)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', 'none')
          .attr('stroke', 'teal')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4 3');
      }

      const boxWidth = cellWidth * 0.9;
      const boxHeight = cellHeight * 0.9;

      // foreignObject lets us use HTML styling for auto-wrap
      const container = areaGroup
        .append('foreignObject')
        .attr('class', 'venn-text-node-fo')
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('x', x - boxWidth / 2)
        .attr('y', y - boxHeight / 2)
        .attr('overflow', 'visible');

      const text = container
        .append('xhtml:span')
        .attr('class', 'venn-text-node')
        .style('display', 'flex')
        .style('width', '100%')
        .style('height', '100%')
        .style('white-space', 'normal')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('text-align', 'center')
        .style('overflow-wrap', 'normal')
        .style('word-break', 'normal')
        .text(node.label ?? node.id);

      if (node.color) {
        text.style('color', node.color);
      }
    }
  }
}

export const renderer: DiagramRenderer = { draw };
