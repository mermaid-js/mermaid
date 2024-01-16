import type d3 from 'd3';
import { scaleOrdinal, pie as d3pie, arc } from 'd3';
import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { cleanAndMerge, parseFontSize } from '../../utils.js';
import type { DrawDefinition, Group, SVG } from '../../diagram-api/types.js';
import type { D3Sections, PieDB, Sections } from './pieTypes.js';
import type { MermaidConfig, PieDiagramConfig } from '../../config.type.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';

const createPieArcs = (sections: Sections): d3.PieArcDatum<D3Sections>[] => {
  // Compute the position of each group on the pie:
  const pieData: D3Sections[] = Object.entries(sections)
    .map((element: [string, number]): D3Sections => {
      return {
        label: element[0],
        value: element[1],
      };
    })
    .sort((a: D3Sections, b: D3Sections): number => {
      return b.value - a.value;
    });
  const pie: d3.Pie<unknown, D3Sections> = d3pie<D3Sections>().value(
    (d3Section: D3Sections): number => d3Section.value
  );
  return pie(pieData);
};

/**
 * Draws a Pie Chart with the data given in text.
 *
 * @param text - pie chart code
 * @param id - diagram id
 * @param _version - MermaidJS version from package.json.
 * @param diagObj - A standard diagram containing the DB and the text and type etc of the diagram.
 */
export const draw: DrawDefinition = (text, id, _version, diagObj) => {
  log.debug('rendering pie chart\n' + text);
  const db = diagObj.db as PieDB;
  const globalConfig: MermaidConfig = getConfig();
  const pieConfig: Required<PieDiagramConfig> = cleanAndMerge(db.getConfig(), globalConfig.pie);
  const MARGIN = 40;
  const LEGEND_RECT_SIZE = 18;
  const LEGEND_SPACING = 4;
  const height = 450;
  const pieWidth: number = height;
  const svg: SVG = selectSvgElement(id);
  const group: Group = svg.append('g');
  const sections: Sections = db.getSections();
  group.attr('transform', 'translate(' + pieWidth / 2 + ',' + height / 2 + ')');

  const { themeVariables } = globalConfig;
  let [outerStrokeWidth] = parseFontSize(themeVariables.pieOuterStrokeWidth);
  outerStrokeWidth ??= 2;

  const textPosition: number = pieConfig.textPosition;
  const radius: number = Math.min(pieWidth, height) / 2 - MARGIN;
  // Shape helper to build arcs:
  const arcGenerator: d3.Arc<unknown, d3.PieArcDatum<D3Sections>> = arc<
    d3.PieArcDatum<D3Sections>
  >()
    .innerRadius(0)
    .outerRadius(radius);
  const labelArcGenerator: d3.Arc<unknown, d3.PieArcDatum<D3Sections>> = arc<
    d3.PieArcDatum<D3Sections>
  >()
    .innerRadius(radius * textPosition)
    .outerRadius(radius * textPosition);

  group
    .append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', radius + outerStrokeWidth / 2)
    .attr('class', 'pieOuterCircle');

  const arcs: d3.PieArcDatum<D3Sections>[] = createPieArcs(sections);

  const myGeneratedColors = [
    themeVariables.pie1,
    themeVariables.pie2,
    themeVariables.pie3,
    themeVariables.pie4,
    themeVariables.pie5,
    themeVariables.pie6,
    themeVariables.pie7,
    themeVariables.pie8,
    themeVariables.pie9,
    themeVariables.pie10,
    themeVariables.pie11,
    themeVariables.pie12,
  ];
  // Set the color scale
  const color: d3.ScaleOrdinal<string, 12, never> = scaleOrdinal(myGeneratedColors);

  // Build the pie chart: each part of the pie is a path that we build using the arc function.
  group
    .selectAll('mySlices')
    .data(arcs)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (datum: d3.PieArcDatum<D3Sections>) => {
      return color(datum.data.label);
    })
    .attr('class', 'pieCircle');

  let sum = 0;
  Object.keys(sections).forEach((key: string): void => {
    sum += sections[key];
  });
  // Now add the percentage.
  // Use the centroid method to get the best coordinates.
  group
    .selectAll('mySlices')
    .data(arcs)
    .enter()
    .append('text')
    .text((datum: d3.PieArcDatum<D3Sections>): string => {
      return ((datum.data.value / sum) * 100).toFixed(0) + '%';
    })
    .attr('transform', (datum: d3.PieArcDatum<D3Sections>): string => {
      return 'translate(' + labelArcGenerator.centroid(datum) + ')';
    })
    .style('text-anchor', 'middle')
    .attr('class', 'slice');

  group
    .append('text')
    .text(db.getDiagramTitle())
    .attr('x', 0)
    .attr('y', -(height - 50) / 2)
    .attr('class', 'pieTitleText');

  // Add the legends/annotations for each section
  const legend = group
    .selectAll('.legend')
    .data(color.domain())
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', (_datum, index: number): string => {
      const height = LEGEND_RECT_SIZE + LEGEND_SPACING;
      const offset = (height * color.domain().length) / 2;
      const horizontal = 12 * LEGEND_RECT_SIZE;
      const vertical = index * height - offset;
      return 'translate(' + horizontal + ',' + vertical + ')';
    });

  legend
    .append('rect')
    .attr('width', LEGEND_RECT_SIZE)
    .attr('height', LEGEND_RECT_SIZE)
    .style('fill', color)
    .style('stroke', color);

  legend
    .data(arcs)
    .append('text')
    .attr('x', LEGEND_RECT_SIZE + LEGEND_SPACING)
    .attr('y', LEGEND_RECT_SIZE - LEGEND_SPACING)
    .text((datum: d3.PieArcDatum<D3Sections>): string => {
      const { label, value } = datum.data;
      if (db.getShowData()) {
        return `${label} [${value}]`;
      }
      return label;
    });

  const longestTextWidth = Math.max(
    ...legend
      .selectAll('text')
      .nodes()
      .map((node) => (node as Element)?.getBoundingClientRect().width ?? 0)
  );

  const totalWidth = pieWidth + MARGIN + LEGEND_RECT_SIZE + LEGEND_SPACING + longestTextWidth;

  // Set viewBox
  svg.attr('viewBox', `0 0 ${totalWidth} ${height}`);
  configureSvgSize(svg, height, totalWidth, pieConfig.useMaxWidth);
};

export const renderer = { draw };
