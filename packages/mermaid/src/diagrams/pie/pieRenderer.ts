// @ts-nocheck - placeholder to be handled
import { select, scaleOrdinal, pie as d3pie, arc } from 'd3';
import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { getConfig } from '../../config.js';
import { parseFontSize } from '../../utils.js';
import { DrawDefinition, HTML } from '../../diagram-api/types.js';
import { PieDb, Sections } from './pieTypes.js';

/**
 * Draws a Pie Chart with the data given in text.
 *
 * @param text - pie chart code
 * @param id - diagram id
 */
export const draw: DrawDefinition = (txt, id, _version, diagramObject) => {
  try {
    log.debug('rendering pie chart\n' + txt);

    let width: number | undefined;
    const height = 450;
    const config = getConfig();
    const { securityLevel } = config;
    // handle root and document for when rendering in sandbox mode
    let sandboxElement: HTML | undefined;
    if (securityLevel === 'sandbox') {
      sandboxElement = select('#i' + id);
    }
    const root =
      securityLevel === 'sandbox'
        ? select(sandboxElement.nodes()[0].contentDocument.body)
        : select('body');
    const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;
    const elem = doc?.getElementById(id);
    width = elem?.parentElement?.offsetWidth;

    // Parse the Pie Chart definition
    const db = diagramObject.db as PieDb;
    db.clear();

    log.debug('parsing pie chart');
    diagramObject.parser.parse(txt);

    if (width === undefined) {
      width = 1200;
    }
    if (config.pie?.useWidth !== undefined) {
      width = config.pie.useWidth;
    }

    const diagram = root.select('#' + id);
    configureSvgSize(diagram, height, width, config.pie?.useMaxWidth ?? true);

    // Set viewBox
    elem?.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    const margin = 40;
    const legendRectSize = 18;
    const legendSpacing = 4;

    const radius = Math.min(width, height) / 2 - margin;

    const svg = diagram
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    const sections: Sections = db.getSections();
    let sum = 0;
    Object.keys(sections).forEach((key: string): void => {
      sum += sections[key];
    });

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

    // Compute the position of each group on the pie:
    const pieData = Object.entries(sections).map(function (el, idx) {
      return {
        order: idx,
        name: el[0],
        value: el[1],
      };
    });
    const pie = d3pie()
      .value((d): number => {
        return d.value;
      })
      .sort((a, b): number => {
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
      .text((d): string => {
        return ((d.data.value / sum) * 100).toFixed(0) + '%';
      })
      .attr('transform', (d): string => {
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
      .attr('transform', (d, index: number): string => {
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
      .text((d): string => {
        if (db.getShowData()) {
          return d.data.name + ' [' + d.data.value + ']';
        } else {
          return d.data.name;
        }
      });
  } catch (e) {
    log.error('error while rendering pie chart\n', e);
  }
};

export const renderer = { draw };
