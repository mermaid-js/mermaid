import { logger } from '../logger'; // eslint-disable-line
import createLabel from './createLabel';
import * as d3 from 'd3';
import { getConfig } from '../config';

const edgeLabels = {};

export const insertEdgeLabel = (elem, edge) => {
  // Create the actual text element
  const labelElement = createLabel(edge.label, edge.labelStyle);

  // Create outer g, edgeLabel, this will be positioned after graph layout
  const edgeLabel = elem.insert('g').attr('class', 'edgeLabel');

  // Create inner g, label, this will be positioned now for centering the text
  const label = edgeLabel.insert('g').attr('class', 'label');
  label.node().appendChild(labelElement);

  // Center the label
  const bbox = labelElement.getBBox();
  label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');

  // Make element accessible by id for positioning
  edgeLabels[edge.id] = edgeLabel;

  // Update the abstract data of the edge with the new information about its width and height
  edge.width = bbox.width;
  edge.height = bbox.height;
};

export const positionEdgeLabel = edge => {
  const el = edgeLabels[edge.id];
  logger.info(edge.id, el);
  el.attr('transform', 'translate(' + edge.x + ', ' + edge.y + ')');
};

const getRelationType = function(type) {
  switch (type) {
    case stateDb.relationType.AGGREGATION:
      return 'aggregation';
    case stateDb.relationType.EXTENSION:
      return 'extension';
    case stateDb.relationType.COMPOSITION:
      return 'composition';
    case stateDb.relationType.DEPENDENCY:
      return 'dependency';
  }
};

export const insertEdge = function(elem, edge) {
  // The data for our line
  const lineData = edge.points.filter(p => !Number.isNaN(p.y));

  // This is the accessor function we talked about above
  const lineFunction = d3
    .line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    })
    .curve(d3.curveBasis);

  const svgPath = elem
    .append('path')
    .attr('d', lineFunction(lineData))
    .attr('id', edge.id)
    .attr('class', 'transition');
  let url = '';
  if (getConfig().state.arrowMarkerAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  svgPath.attr('marker-end', 'url(' + url + '#' + 'extensionEnd' + ')');
  svgPath.attr('marker-start', 'url(' + url + '#' + 'extensionStart' + ')');
};
