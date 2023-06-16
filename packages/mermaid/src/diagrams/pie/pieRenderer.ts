// @ts-nocheck - placeholder to be handled
import { select, scaleOrdinal, pie as d3pie, arc } from 'd3';
import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { getConfig } from '../../config.js';
import { parseFontSize } from '../../utils.js';
import type { DrawDefinition, HTML, SVG } from '../../diagram-api/types.js';
import type { PieDb, Sections } from './pieTypes.js';

/**
 * Draws a Pie Chart with the data given in text.
 *
 * @param text - pie chart code
 * @param id - diagram id
 */
const draw: DrawDefinition = (txt, id, _version, diagObj) => {
  try {
    log.debug('rendering pie chart\n' + txt);

    const config = getConfig();
    let width: number | undefined = config.pie?.useWidth;
    const height = 450;

    const { securityLevel } = config;
    // handle root and document for when rendering in sandbox mode
    let sandboxElement: HTML | undefined;
    let document: Document | null | undefined;
    if (securityLevel === 'sandbox') {
      sandboxElement = select('#i' + id);
      document = sandboxElement.nodes()[0].contentDocument;
      width = document?.parentElement?.offsetWidth;
    }

    // @ts-ignore - figure out how to assign HTML to document type
    const root: HTML =
      sandboxElement !== undefined && document !== undefined && document !== null
        ? select(document)
        : select('body');

    // parse the Pie Chart definition
    const db = diagObj.db as PieDb;
    db.clear();
    log.debug('parsing pie chart');
    diagObj.parser.parse(txt);

    if (width === undefined) {
      width = 1200;
    }

    const diagram: SVG = root.select('#' + id);
    configureSvgSize(diagram, height, width, config.pie?.useMaxWidth || true);

    // set viewBox
    document?.parentElement?.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    // fetch the default direction, use TD if none was found
    const margin = 40;
    const legendRectSize = 18;
    const legendSpacing = 4;

    const radius = Math.min(width, height) / 2 - margin;

    const svg = diagram
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    const themeVariables = config.themeVariables;
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

    const textPosition = config.pie?.textPosition ?? 0.75;
    let [outerStrokeWidth] = parseFontSize(themeVariables.pieOuterStrokeWidth);
    outerStrokeWidth ??= 2;

    // Set the color scale
    const color = scaleOrdinal().range(myGeneratedColors);

    const sections: Sections = db.getSections();
    let sum = 0;
    Object.keys(sections).forEach((key: string) => {
      sum += sections[key];
    });

    // compute the position of each group on the pie:
    const pieData = Object.entries(sections).map((el: [string, number], index: number) => {
      return {
        order: index,
        name: el[0],
        value: el[1],
      };
    });
    const pie = d3pie()
      // @ts-ignore: TODO Fix ts errors
      .value((d) => {
        return d;
      })
      .sort((a, b) => {
        // Sort slices in clockwise direction
        return a.order - b.order;
      });
    const dataReady = pie(pieData);

    // Shape helper to build arcs:
    const arcGenerator = arc().innerRadius(0).outerRadius(radius);
    const labelArcGenerator = arc()
      .innerRadius(radius * textPosition)
      .outerRadius(radius * textPosition);

    svg
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', radius + outerStrokeWidth / 2)
      .attr('class', 'pieOuterCircle');

    // Build the pie chart: each part of the pie is a path that we build using the arc function.
    svg
      .selectAll('mySlices')
      .data(dataReady)
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      // @ts-ignore: TODO Fix ts errors
      .attr('fill', (d) => {
        return color(d.data.name);
      })
      .attr('class', 'pieCircle');

    // Now add the percentage.
    // Use the centroid method to get the best coordinates.
    svg
      .selectAll('mySlices')
      .data(dataReady)
      .enter()
      .append('text')
      // @ts-ignore: TODO Fix ts errors
      .text((d) => {
        return ((d.data.value / sum) * 100).toFixed(0) + '%';
      })
      // @ts-ignore: TODO Fix ts errors
      .attr('transform', (d) => {
        return 'translate(' + labelArcGenerator.centroid(d) + ')';
      })
      .style('text-anchor', 'middle')
      .attr('class', 'slice');

    svg
      .append('text')
      .text(db.getDiagramTitle())
      .attr('x', 0)
      .attr('y', -(height - 50) / 2)
      .attr('class', 'pieTitleText');

    // Add the legends/annotations for each section
    const legend = svg
      .selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      // @ts-ignore: TODO Fix ts errors
      .attr('transform', (d, index: number) => {
        const height = legendRectSize + legendSpacing;
        const offset = (height * color.domain().length) / 2;
        const horizontal = 12 * legendRectSize;
        const vertical = index * height - offset;
        return 'translate(' + horizontal + ',' + vertical + ')';
      });

    legend
      .append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .style('fill', color)
      .style('stroke', color);

    legend
      .data(dataReady)
      .append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      // @ts-ignore: TODO Fix ts errors
      .text((d) => {
        if (db.getShowData()) {
          return d.data.name + ' [' + d.data.value + ']';
        } else {
          return d.data.name;
        }
      });
  } catch (e) {
    log.error('error while rendering pie chart', e);
  }
};

export const renderer = { draw };
