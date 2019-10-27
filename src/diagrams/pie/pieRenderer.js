/**
 * Created by AshishJ on 11-09-2019.
 */
import * as d3 from 'd3';
import pieData from './pieDb';
import pieParser from './parser/pie';
import { logger } from '../../logger';

const conf = {};
export const setConf = function(cnf) {
  const keys = Object.keys(cnf);

  keys.forEach(function(key) {
    conf[key] = cnf[key];
  });
};

/**
 * Draws a Pie Chart with the data given in text.
 * @param text
 * @param id
 */
let w;
export const draw = (txt, id) => {
  try {
    const parser = pieParser.parser;
    parser.yy = pieData;
    logger.debug('Rendering info diagram\n' + txt);
    // Parse the Pie Chart definition
    parser.yy.clear();
    parser.parse(txt);
    logger.debug('Parsed info diagram');
    const elem = document.getElementById(id);
    w = elem.parentElement.offsetWidth;

    if (typeof w === 'undefined') {
      w = 1200;
    }

    if (typeof conf.useWidth !== 'undefined') {
      w = conf.useWidth;
    }
    const h = 450;
    elem.setAttribute('height', '100%');
    // Set viewBox
    elem.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    // Fetch the default direction, use TD if none was found

    var width = w; // 450
    var height = 450;
    var margin = 40;
    var legendRectSize = 18;
    var legendSpacing = 4;

    var radius = Math.min(width, height) / 2 - margin;

    var svg = d3
      .select('#' + id)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    var data = pieData.getSections();
    var sum = 0;
    Object.keys(data).forEach(function(key) {
      sum += data[key];
    });
    logger.info(data);

    // set the color scale
    var color = d3
      .scaleOrdinal()
      .domain(data)
      .range(d3.schemeSet2);

    // Compute the position of each group on the pie:
    var pie = d3.pie().value(function(d) {
      return d.value;
    });
    var dataReady = pie(d3.entries(data));

    // shape helper to build arcs:
    var arcGenerator = d3
      .arc()
      .innerRadius(0)
      .outerRadius(radius);

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
      .selectAll('mySlices')
      .data(dataReady)
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      .attr('fill', function(d) {
        return color(d.data.key);
      })
      .attr('stroke', 'black')
      .style('stroke-width', '2px')
      .style('opacity', 0.7);

    // Now add the Percentage. Use the centroid method to get the best coordinates
    svg
      .selectAll('mySlices')
      .data(dataReady)
      .enter()
      .append('text')
      .text(function(d) {
        return ((d.data.value / sum) * 100).toFixed(0) + '%';
      })
      .attr('transform', function(d) {
        return 'translate(' + arcGenerator.centroid(d) + ')';
      })
      .style('text-anchor', 'middle')
      .attr('class', 'slice')
      .style('font-size', 17);

    svg
      .append('text')
      .text(parser.yy.getTitle())
      .attr('x', 0)
      .attr('y', -(h - 50) / 2)
      .attr('class', 'pieTitleText');

    //Add the slegend/annotations for each section
    var legend = svg
      .selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function(d, i) {
        var height = legendRectSize + legendSpacing;
        var offset = (height * color.domain().length) / 2;
        var horz = 12 * legendRectSize;
        var vert = i * height - offset;
        return 'translate(' + horz + ',' + vert + ')';
      });

    legend
      .append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .style('fill', color)
      .style('stroke', color);

    legend
      .append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      .text(function(d) {
        return d;
      });
  } catch (e) {
    logger.error('Error while rendering info diagram');
    logger.error(e.message);
  }
};

export default {
  setConf,
  draw
};
