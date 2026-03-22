import type { Diagram } from '../../Diagram.js';
import type { VennData, VennDB, VennTextData, VennStyleData } from './vennTypes.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import type { VennDiagramConfig } from '../../config.type.js';
import type { Selection } from 'd3';
import { select as d3select } from 'd3';
// @ts-expect-error Incorrect khroma types
import { isDark, lighten, darken, transparentize } from 'khroma';
import { getConfig } from '../../config.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import * as venn from '@upsetjs/venn.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import rough from 'roughjs';

type DummyD3Root = Selection<HTMLDivElement, unknown, null, undefined>;

function buildStyleByKey(styleData: VennStyleData[]): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>();
  for (const entry of styleData) {
    const key = entry.targets.join('|');
    const existing = map.get(key);
    if (existing) {
      Object.assign(existing, entry.styles);
    } else {
      map.set(key, { ...entry.styles });
    }
  }
  return map;
}

export const draw: DrawDefinition = (
  _text: string,
  id: string,
  _version: string,
  diagObj: Diagram
): void => {
  const db = diagObj.db as VennDB;
  const config = db.getConfig?.();
  const { themeVariables, look, handDrawnSeed } = getConfig();
  const isHandDrawn = look === 'handDrawn';
  const themeColors: string[] = [
    themeVariables.venn1,
    themeVariables.venn2,
    themeVariables.venn3,
    themeVariables.venn4,
    themeVariables.venn5,
    themeVariables.venn6,
    themeVariables.venn7,
    themeVariables.venn8,
  ].filter(Boolean);
  const title = db.getDiagramTitle?.();
  const sets = db.getSubsetData();
  const textNodes = db.getTextData();
  const styleByKey = buildStyleByKey(db.getStyleData());

  // Configurable viewBox size with scale factor for proportional rendering
  const svgWidth = config?.width ?? 800;
  const svgHeight = config?.height ?? 450;
  const REFERENCE_WIDTH = 1600;
  const scale = svgWidth / REFERENCE_WIDTH;
  const titleHeight = title ? 48 * scale : 0;

  const defaultTextColor = themeVariables.primaryTextColor ?? themeVariables.textColor;

  // Prepare the target viewBox
  const svg = selectSvgElement(id);
  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

  if (title) {
    svg
      .append('text')
      .text(title)
      .attr('class', 'venn-title')
      .attr('font-size', `${32 * scale}px`)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('x', '50%')
      .attr('y', 32 * scale)
      .style('fill', themeVariables.vennTitleTextColor || themeVariables.titleColor);
  }

  // Get the original SVG output of Venn.js from a dummy root
  const dummyD3root: DummyD3Root = d3select(document.createElement('div'));
  const vennDiagram = venn
    .VennDiagram()
    .width(svgWidth)
    .height(svgHeight - titleHeight);
  dummyD3root.datum(sets).call(vennDiagram as never);

  const roughSvg = isHandDrawn
    ? rough.svg(dummyD3root.select('svg').node() as SVGSVGElement)
    : undefined;

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
    renderTextNodes(config, layoutByKey, dummyD3root, textNodes, scale, styleByKey);
  }

  // Style the set circles with theme colors
  const themeDark = isDark(themeVariables.background || '#f4f4f4');
  dummyD3root.selectAll('.venn-circle').each(function (d, i) {
    const group = d3select(this as Element);
    const data = d as VennData;
    const setsKey = stableSetsKey([...data.sets].sort());
    const customStyle = styleByKey.get(setsKey);
    const baseColor =
      customStyle?.fill || themeColors[i % themeColors.length] || themeVariables.primaryColor;
    group.classed(`venn-set-${i % 8}`, true);
    const fillOpacity = customStyle?.['fill-opacity'] ?? 0.1;
    const strokeColor = customStyle?.stroke || baseColor;
    const strokeWidthVal = customStyle?.['stroke-width'] || `${5 * scale}`;

    if (isHandDrawn && roughSvg) {
      const layoutArea = layoutByKey.get(setsKey);
      if (layoutArea && layoutArea.circles.length > 0) {
        const c = layoutArea.circles[0];
        const roughNode = roughSvg.circle(c.x, c.y, c.radius * 2, {
          roughness: 0.7,
          seed: handDrawnSeed,
          fill: transparentize(baseColor, 0.7),
          fillStyle: 'hachure',
          fillWeight: 2,
          hachureGap: 8,
          hachureAngle: -41 + i * 60,
          stroke: strokeColor,
          strokeWidth: parseFloat(String(strokeWidthVal)),
        });
        group.select('path').remove();
        group.node()?.insertBefore(roughNode, group.select('text').node() as Node | null);
      }
    } else {
      group
        .select('path')
        .style('fill', baseColor)
        .style('fill-opacity', fillOpacity)
        .style('stroke', strokeColor)
        .style('stroke-width', strokeWidthVal)
        .style('stroke-opacity', 0.95);
    }
    // Blend border color toward black (light theme) or white (dark theme) for readable text
    const textColor: string =
      customStyle?.color || (themeDark ? lighten(baseColor, 30) : darken(baseColor, 30));
    group
      .select('text')
      .style('font-size', `${48 * scale}px`)
      .style('fill', textColor);
  });

  // Style the union labels
  if (isHandDrawn && roughSvg) {
    dummyD3root.selectAll('.venn-intersection').each(function (d) {
      const group = d3select(this as Element);
      const data = d as VennData;
      const setsKey = stableSetsKey([...data.sets].sort());
      const customStyle = styleByKey.get(setsKey);
      const customFill = customStyle?.fill;

      if (customFill) {
        const pathEl = group.select('path');
        const pathD = pathEl.attr('d');
        if (pathD) {
          const roughNode = roughSvg.path(pathD, {
            roughness: 0.7,
            seed: handDrawnSeed,
            fill: transparentize(customFill, 0.3),
            fillStyle: 'cross-hatch',
            fillWeight: 2,
            hachureGap: 6,
            hachureAngle: 60,
            stroke: 'none',
          });
          const existingPath = pathEl.node() as Element | null;
          existingPath?.parentNode?.insertBefore(roughNode, existingPath);
          pathEl.remove();
        }
      } else {
        group.select('path').style('fill-opacity', 0);
      }

      group
        .select('text')
        .style('font-size', `${48 * scale}px`)
        .style('fill', customStyle?.color ?? themeVariables.vennSetTextColor ?? defaultTextColor);
    });
  } else {
    dummyD3root
      .selectAll('.venn-intersection text')
      .style('font-size', `${48 * scale}px`)
      .style('fill', (e) => {
        const data = e as VennData;
        const setsKey = stableSetsKey([...data.sets].sort());
        return (
          styleByKey.get(setsKey)?.color ?? themeVariables.vennSetTextColor ?? defaultTextColor
        );
      });
    dummyD3root
      .selectAll('.venn-intersection path')
      .style('fill-opacity', (e) => {
        const data = e as VennData;
        const setsKey = stableSetsKey([...data.sets].sort());
        return styleByKey.get(setsKey)?.fill ? 1 : 0;
      })
      .style('fill', (e) => {
        const data = e as VennData;
        const setsKey = stableSetsKey([...data.sets].sort());
        return styleByKey.get(setsKey)?.fill ?? 'transparent';
      });
  }

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
  textNodes: VennTextData[],
  scale: number,
  styleByKey: Map<string, Record<string, string>>
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
      .attr('font-size', `${40 * scale}px`);
    if (useDebugLayout) {
      areaGroup
        .append('circle')
        .attr('class', 'venn-text-debug-circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', innerRadius)
        .attr('fill', 'none')
        .attr('stroke', 'purple')
        .attr('stroke-width', 1.5 * scale)
        .attr('stroke-dasharray', `${6 * scale} ${4 * scale}`);
    }

    // Compute a grid within the area for placing text nodes
    const innerWidth = Math.max(80 * scale, innerRadius * 2 * 0.95);
    const innerHeight = Math.max(60 * scale, innerRadius * 2 * 0.95);
    const hasLabel = area.data.label && area.data.label.length > 0;
    const labelOffsetBase = hasLabel ? Math.min(32 * scale, innerRadius * 0.25) : 0;
    const labelOffset = labelOffsetBase + (nodes.length <= 2 ? 30 * scale : 0);
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
          .attr('stroke-width', 1 * scale)
          .attr('stroke-dasharray', `${4 * scale} ${3 * scale}`);
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

      const textColor = styleByKey.get(node.id)?.color;
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

      if (textColor) {
        text.style('color', textColor);
      }
    }
  }
}

export const renderer: DiagramRenderer = { draw };
