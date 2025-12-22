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
  const title = db.getDiagramTitle?.();
  const titleHeight = title ? 48 : 0;
  const sets = db.getSubsetData();
  const textNodes = db.getTextData();
  const customFontColorMap = new Map<VennData['sets'], string>();
  const customBackgroundColorMap = new Map<VennData['sets'], string>();
  const { themeVariables } = getConfig();
  const defaultTextColor = themeVariables.primaryTextColor ?? themeVariables.textColor;
  for (const set of sets) {
    if (set.color) {
      customFontColorMap.set(set.sets, set.color);
    }
    if (set.background) {
      customBackgroundColorMap.set(set.sets, set.background);
    }
  }

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

  // Create a dummy root to render the Venn diagram in
  const dummyD3root: DummyD3Root = d3select(document.createElement('div'));
  const vennDiagram = venn
    .VennDiagram()
    .width(svgWidth)
    .height(svgHeight - titleHeight);
  dummyD3root.datum(sets).call(vennDiagram as never);

  const layoutAreas = venn.layout(sets, {
    width: svgWidth,
    height: svgHeight - titleHeight,
    padding: config?.padding ?? 15,
  });
  const layoutByKey = new Map<string, (typeof layoutAreas)[number]>();
  for (const area of layoutAreas) {
    const key = setsKey([...area.data.sets].sort());
    layoutByKey.set(key, area);
  }

  if (textNodes.length > 0) {
    renderTextNodes(config, layoutByKey, dummyD3root, textNodes);
  }

  // Styling
  dummyD3root
    .selectAll('.venn-circle path')
    .style('fill-opacity', 0)
    .style('stroke-width', 5)
    .style('stroke-opacity', 0.3)
    .style('stroke', (_, i) => colors[i]);
  dummyD3root.selectAll('.venn-circle text').style('font-size', '48px');

  dummyD3root
    .selectAll('.venn-intersection text')
    .style('font-size', '48px')
    .style('fill', (e) => {
      const d = e as VennData;
      return customFontColorMap.get(d.sets) ?? defaultTextColor;
    });

  dummyD3root
    .selectAll('.venn-intersection path')
    .style('fill-opacity', (e) => {
      const d = e as VennData;
      return customBackgroundColorMap.get(d.sets) ? 1 : 0;
    })
    .style('fill', (e) => {
      const d = e as VennData;
      return customBackgroundColorMap.get(d.sets) ?? 'transparent';
    });
  const vennGroup = svg.append('g').attr('transform', `translate(0, ${titleHeight})`);
  const dummySvg = dummyD3root.select('svg').node();
  if (dummySvg && 'childNodes' in dummySvg) {
    for (const child of [...dummySvg.childNodes]) {
      vennGroup.node()?.appendChild(child);
    }
  }
  configureSvgSize(svg, svgHeight, svgWidth, config?.useMaxWidth ?? true);
};

function setsKey(setIds: string[]): string {
  return setIds.join('|');
}

function renderTextNodes(
  config: Required<VennDiagramConfig>,
  layoutByKey: Map<string, venn.IVennLayout<VennData>>,
  dummyD3root: DummyD3Root,
  textNodes: VennTextData[]
) {
  const debugTextLayout = config?.debugTextLayout ?? false;
  const vennSvg = dummyD3root.select('svg');
  const textGroup = vennSvg.append('g').attr('class', 'venn-text-nodes');
  const nodesByArea = new Map<string, VennTextData[]>();

  for (const node of textNodes) {
    const key = setsKey(node.sets);
    const existing = nodesByArea.get(key);
    if (existing) {
      existing.push(node);
    } else {
      nodesByArea.set(key, [node]);
    }
  }

  for (const [key, nodes] of nodesByArea.entries()) {
    const area = layoutByKey.get(key);
    if (!area?.text) {
      continue;
    }
    const centerX = area.text.x;
    const centerY = area.text.y;
    const minCircleRadius = Math.min(...area.circles.map((circle) => circle.radius));
    const innerRadiusRaw = Math.min(
      ...area.circles.map((circle) => {
        const dx = centerX - circle.x;
        const dy = centerY - circle.y;
        return circle.radius - Math.hypot(dx, dy);
      })
    );
    let innerRadius = Number.isFinite(innerRadiusRaw) ? Math.max(0, innerRadiusRaw) : 0;
    if (innerRadius === 0 && Number.isFinite(minCircleRadius)) {
      innerRadius = minCircleRadius * 0.6;
    }

    // Render text area
    const areaGroup = textGroup
      .append('g')
      .attr('class', 'venn-text-area')
      .attr('font-size', `40px`);
    if (debugTextLayout) {
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

    // Render text nodes
    const innerWidth = Math.max(80, innerRadius * 2 * 0.95);
    const innerHeight = Math.max(60, innerRadius * 2 * 0.95);
    const labelOffsetBase = (area.data.label?.length ?? '') ? Math.min(32, innerRadius * 0.25) : 0;
    const labelOffset = nodes.length === 1 ? labelOffsetBase + 30 : labelOffsetBase;
    const startX = centerX - innerWidth / 2;
    const startY = centerY - innerHeight / 2 + labelOffset;
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    const rows = Math.max(1, Math.ceil(nodes.length / cols));
    const cellWidth = innerWidth / cols;
    const cellHeight = innerHeight / rows;

    for (const [i, node] of nodes.entries()) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + cellWidth * (col + 0.5);
      const y = startY + cellHeight * (row + 0.5);

      if (debugTextLayout) {
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

      const textEl = areaGroup
        .append('text')
        .attr('class', 'venn-text-node')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', `40px`)
        .text(node.text);

      if (node.color) {
        textEl.attr('fill', node.color);
      }
    }
  }
}

export const renderer: DiagramRenderer = { draw };
