import type { Diagram } from '../../Diagram.js';
import type { VennDB, VennData } from './vennTypes.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import * as venn from '@upsetjs/venn.js';
import { schemeCategory10 as colors, select as d3select } from 'd3';
// import { configureSvgSize } from '../../setupGraphViewbox.js';

export const draw: DrawDefinition = function (
  _text: string,
  id: string,
  _version: string,
  diagObj: Diagram
): void {
  const db = diagObj.db as VennDB;
  const title = db.getDiagramTitle?.();
  const titleHeight = title ? 48 : 0;
  const sets = db.getSubsetData();
  const customFontColorMap = new Map<VennData['sets'], string>();
  const customBackgroundColorMap = new Map<VennData['sets'], string>();
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
  svg.attr('viewbox', `0 0 ${svgWidth} ${svgHeight}`);

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
  const dummyD3root = d3select(document.createElement('div'));
  const vennDiagram = venn
    .VennDiagram()
    .width(svgWidth)
    .height(svgHeight - titleHeight);
  dummyD3root.datum(sets).call(vennDiagram as never);

  // Styling
  dummyD3root
    .selectAll('.venn-circle path')
    .style('fill-opacity', 0)
    .style('stroke-width', 5)
    .style('stroke-opacity', 0.3)
    .style('stroke', (_, i) => colors[i]);
  dummyD3root.selectAll('.venn-circle text').style('font-size', '48px'); //.style('fill', 'white');

  dummyD3root
    .selectAll('.venn-intersection text')
    .style('font-size', '48px')
    .style('fill', (e) => {
      const d = e as VennData;
      return customFontColorMap.get(d.sets) || 'b;acl';
    });

  dummyD3root
    .selectAll('.venn-intersection path')
    .style('fill-opacity', (e) => {
      const d = e as VennData;
      return customBackgroundColorMap.get(d.sets) ? 1 : 0;
    })
    .style('fill', (e) => {
      const d = e as VennData;
      return customBackgroundColorMap.get(d.sets) || 'white';
    });
  const vennBox = svg.append('svg').attr('y', titleHeight);

  // Transfer the Venn diagram to the real SVG
  vennBox.append(() => dummyD3root.select('svg').node());

  // Not needed?
  // configureSvgSize(svg, svgHeight, svgWidth, true);
};

export const renderer: DiagramRenderer = { draw };
