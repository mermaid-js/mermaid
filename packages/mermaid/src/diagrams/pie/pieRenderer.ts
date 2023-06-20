// @ts-nocheck - placeholder to be handled
import d3, { select, scaleOrdinal, pie as d3pie, arc } from 'd3';
import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { getConfig } from '../../config.js';
import { parseFontSize } from '../../utils.js';
import type { DrawDefinition, HTML } from '../../diagram-api/types.js';
import type { D3Sections, PieDB, PieDiagramConfig, Sections } from './pieTypes.js';
import { MermaidConfig } from '../../config.type.js';

/**
 * Draws a Pie Chart with the data given in text.
 *
 * @param text - pie chart code
 * @param id - diagram id
 */
export const draw: DrawDefinition = (txt, id, _version, diagramObject) => {
  try {
    log.debug('rendering pie chart\n' + txt);
    const db: PieDB = diagramObject.db as PieDB;
    db.clear();
    const globalConfig: MermaidConfig = getConfig();
    const config: Required<PieDiagramConfig> = db.getConfig();

    const height = 450;
    const { securityLevel } = globalConfig;
    // handle root and document for when rendering in sandbox mode
    let sandboxElement: HTML | undefined;
    if (securityLevel === 'sandbox') {
      sandboxElement = select('#i' + id);
    }
    const root =
      securityLevel === 'sandbox'
        ? select(sandboxElement?.node()?.contentDocument?.body as HTMLIFrameElement)
        : select('body');
    const doc = securityLevel === 'sandbox' ? sandboxElement?.nodes()[0].contentDocument : document;
    const elem = doc?.getElementById(id);
    const width: number = elem?.parentElement?.offsetWidth ?? config.useWidth;

    // parse the pie chart definition
    log.debug('parsing pie chart');
    diagramObject.parser.parse(txt);

    const diagram = root.select('#' + id);
    // TODO: use global `useMaxWidth` until making setConfig update pie setConfig
    configureSvgSize(diagram, height, width, globalConfig?.pie?.useMaxWidth ?? true);

    // Set viewBox
    elem?.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    const margin = 40;
    const legendRectSize = 18;
    const legendSpacing = 4;

    const radius: number = Math.min(width, height) / 2 - margin;

    const svg = diagram
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    const sections: Sections = db.getSections();
    let sum = 1;
    Object.keys(sections).forEach((key: string): void => {
      sum += sections[key];
    });

    const { themeVariables } = globalConfig;
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

    const textPosition: number = config.textPosition;
    let [outerStrokeWidth] = parseFontSize(themeVariables.pieOuterStrokeWidth);
    outerStrokeWidth ??= 2;

    // Set the color scale
    const color: d3.ScaleOrdinal<string, unknown, never> = scaleOrdinal().range(myGeneratedColors);

    // Compute the position of each group on the pie:
    const pieData: D3Sections[] = Object.entries(sections)
      .map((element: [string, number], index: number): D3Sections => {
        return {
          order: index,
          label: element[0],
          value: element[1],
        };
      })
      .sort((a: D3Sections, b: D3Sections): number => {
        // Sort slices in clockwise direction
        return a.order - b.order;
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pie = d3pie().value((d: any): number => d.value);
    // @ts-ignore - figure out how to assign D3Section[] to PieArcDatum
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
      .attr('fill', (datum: { data: D3Sections }) => {
        return color(datum.data.label);
      })
      .attr('class', 'pieCircle');

    // Now add the percentage.
    // Use the centroid method to get the best coordinates.
    svg
      .selectAll('mySlices')
      .data(dataReady)
      .enter()
      .append('text')
      .text((datum: { data: D3Sections }): string => {
        return ((datum.data.value / sum) * 100).toFixed(0) + '%';
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('transform', (datum: any): string => {
        return 'translate(' + labelArcGenerator.centroid(datum) + ')';
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
      .attr('transform', (_datum: D3Sections, index: number): string => {
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
      .text((datum: { data: D3Sections }): string => {
        if (db.getShowData()) {
          return datum.data.label + ' [' + datum.data.value + ']';
        } else {
          return datum.data.label;
        }
      });
  } catch (e) {
    log.error('error while rendering pie chart\n', e);
  }
};

export const renderer = { draw };
