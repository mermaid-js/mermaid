import type d3 from 'd3';
import { arc, pie as d3pie, scaleOrdinal } from 'd3';
import type { MermaidConfig, PieDiagramConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DrawDefinition, SVG, SVGGroup } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { cleanAndMerge, parseFontSize } from '../../utils.js';
import type { D3Section, PieDB, Sections } from './pieTypes.js';

const createPieArcs = (sections: Sections): d3.PieArcDatum<D3Section>[] => {
  const pieData: D3Section[] = [...sections.entries()]
    .map(
      (element: [string, number]): D3Section => ({
        label: element[0],
        value: element[1],
      })
    )
    .sort((a: D3Section, b: D3Section): number => b.value - a.value);
  const pie: d3.Pie<unknown, D3Section> = d3pie<D3Section>().value(
    (d3Section: D3Section): number => d3Section.value
  );
  return pie(pieData);
};

export const draw: DrawDefinition = (text, id, _version, diagObj) => {
  log.debug('Rendering pie chart\n' + text);
  const db = diagObj.db as PieDB;
  const globalConfig: MermaidConfig = getConfig();
  const pieConfig: Required<PieDiagramConfig> = cleanAndMerge(db.getConfig(), globalConfig.pie);

  const MARGIN = 40;
  const LEGEND_RECT_SIZE = 18;
  const LEGEND_SPACING = 4;
  const height = 450;
  const pieWidth: number = height;

  const svg: SVG = selectSvgElement(id);
  const group: SVGGroup = svg.append('g');
  group.attr('transform', 'translate(' + pieWidth / 2 + ',' + height / 2 + ')');

  const { themeVariables } = globalConfig;
  let [outerStrokeWidth] = parseFontSize(themeVariables.pieOuterStrokeWidth);
  outerStrokeWidth ??= 2;

  const textPosition: number = pieConfig.textPosition;
  const radius: number = Math.min(pieWidth, height) / 2 - MARGIN;

  const arcGenerator: d3.Arc<unknown, d3.PieArcDatum<D3Section>> = arc<d3.PieArcDatum<D3Section>>()
    .innerRadius(0)
    .outerRadius(radius);
  const labelArcGenerator: d3.Arc<unknown, d3.PieArcDatum<D3Section>> = arc<
    d3.PieArcDatum<D3Section>
  >()
    .innerRadius(radius * textPosition)
    .outerRadius(radius * textPosition);

  group
    .append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', radius + outerStrokeWidth / 2)
    .attr('class', 'pieOuterCircle');

  const sections: Sections = db.getSections();
  const arcs: d3.PieArcDatum<D3Section>[] = createPieArcs(sections);

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

  const color: d3.ScaleOrdinal<string, 12, never> = scaleOrdinal(myGeneratedColors);

  group
    .selectAll('mySlices')
    .data(arcs)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (datum: d3.PieArcDatum<D3Section>) => color(datum.data.label))
    .attr('class', 'pieCircle');

  let sum = 0;
  sections.forEach((section) => {
    sum += section;
  });

  group
    .selectAll('mySlices')
    .data(arcs)
    .enter()
    .append('text')
    .text((datum: d3.PieArcDatum<D3Section>): string => {
      // Calculate the percentage and ensure it is returned as a string
      return `${((datum.data.value / sum) * 100).toFixed(0)}%`;
    })
    .attr('transform', (datum: d3.PieArcDatum<D3Section>): string => {
      // Safely deconstruct coordinates and use template literals for the transform attribute
      const [x, y] = labelArcGenerator.centroid(datum);
      return `translate(${x}, ${y})`;
    })
    .style('text-anchor', 'middle')
    .attr('class', 'slice');

  const titleGroup = group.append('g');
  const titleText = db.getDiagramTitle();

  // Adjust title font size dynamically
  let fontSize = 25; // Start with a larger font size
  const minFontSize = 8; // Set a minimum font size
  const maxAvailableWidth = pieWidth - MARGIN;

  const titleElement = titleGroup
    .append('text')
    .text(titleText)
    .attr('x', 0)
    .attr('y', -(height - 50) / 2)
    .attr('class', 'pieTitleText')
    .style('text-anchor', 'middle');

  // Reduce font size dynamically until it fits
  while (
    (titleElement.node() as SVGGraphicsElement)?.getBBox()?.width > maxAvailableWidth &&
    fontSize > minFontSize
  ) {
    fontSize -= 1;
    titleElement.style('font-size', `${fontSize}px`);
  }

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
    .text((datum: d3.PieArcDatum<D3Section>): string => {
      const { label, value } = datum.data;
      return db.getShowData() ? `${label} [${value}]` : label;
    });

  const longestTextWidth = Math.max(
    ...legend
      .selectAll('text')
      .nodes()
      .map((node) => (node as Element)?.getBoundingClientRect().width ?? 0)
  );

  const totalWidth = pieWidth + MARGIN + LEGEND_RECT_SIZE + LEGEND_SPACING + longestTextWidth;

  svg.attr('viewBox', `0 0 ${totalWidth} ${height}`);
  configureSvgSize(svg, height, totalWidth, pieConfig.useMaxWidth);
};

export const renderer = { draw };
