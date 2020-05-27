import { logger } from '../logger'; // eslint-disable-line
import createLabel from './createLabel';
import { line, curveBasis, select } from 'd3';
import { getConfig } from '../config';

let edgeLabels = {};

export const clear = () => {
  edgeLabels = {};
};

export const insertEdgeLabel = (elem, edge) => {
  // Create the actual text element
  const labelElement = createLabel(edge.label, edge.labelStyle);

  // Create outer g, edgeLabel, this will be positioned after graph layout
  const edgeLabel = elem.insert('g').attr('class', 'edgeLabel');

  // Create inner g, label, this will be positioned now for centering the text
  const label = edgeLabel.insert('g').attr('class', 'label');
  label.node().appendChild(labelElement);

  // Center the label
  let bbox = labelElement.getBBox();
  if (getConfig().flowchart.htmlLabels) {
    const div = labelElement.children[0];
    const dv = select(labelElement);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }
  label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');

  // Make element accessible by id for positioning
  edgeLabels[edge.id] = edgeLabel;

  // Update the abstract data of the edge with the new information about its width and height
  edge.width = bbox.width;
  edge.height = bbox.height;
};

export const positionEdgeLabel = edge => {
  logger.info('Moving label', edge.id, edge.label, edgeLabels[edge.id]);
  if (edge.label) {
    const el = edgeLabels[edge.id];
    el.attr('transform', 'translate(' + edge.x + ', ' + edge.y + ')');
  }
};

// const getRelationType = function(type) {
//   switch (type) {
//     case stateDb.relationType.AGGREGATION:
//       return 'aggregation';
//     case stateDb.relationType.EXTENSION:
//       return 'extension';
//     case stateDb.relationType.COMPOSITION:
//       return 'composition';
//     case stateDb.relationType.DEPENDENCY:
//       return 'dependency';
//   }
// };

const outsideNode = (node, point) => {
  const x = node.x;
  const y = node.y;
  const dx = Math.abs(point.x - x);
  const dy = Math.abs(point.y - y);
  const w = node.width / 2;
  const h = node.height / 2;
  if (dx > w || dy > h) {
    return true;
  }
  return false;
};

const intersection = (node, outsidePoint, insidePoint) => {
  logger.trace('intersection o:', outsidePoint, ' i:', insidePoint, node);
  const x = node.x;
  const y = node.y;

  const dx = Math.abs(x - insidePoint.x);
  const w = node.width / 2;
  let r = insidePoint.x < outsidePoint.x ? w - dx : w + dx;
  const dy = Math.abs(y - insidePoint.y);
  const h = node.height / 2;
  let q = insidePoint.y < outsidePoint.y ? h - dy : h - dy;

  const Q = Math.abs(outsidePoint.y - insidePoint.y);
  const R = Math.abs(outsidePoint.x - insidePoint.x);
  if (Math.abs(y - outsidePoint.y) * w > Math.abs(x - outsidePoint.x) * h || false) { // eslint-disable-line
    // Intersection is top or bottom of rect.

    r = (R * q) / Q;

    return {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + r : insidePoint.x - r,
      y: insidePoint.y + q
    };
  } else {
    q = (Q * r) / R;
    r = (R * q) / Q;

    return {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + r : insidePoint.x + dx - w,
      y: insidePoint.y < outsidePoint.y ? insidePoint.y + q : insidePoint.y - q
    };
  }
};

export const insertEdge = function(elem, edge, clusterDb, diagramType) {
  let points = edge.points;
  if (edge.toCluster) {
    logger.trace('edge', edge);
    logger.trace('to cluster', clusterDb[edge.toCluster]);
    points = [];
    let lastPointOutside;
    let isInside = false;
    edge.points.forEach(point => {
      const node = clusterDb[edge.toCluster].node;

      if (!outsideNode(node, point) && !isInside) {
        logger.trace('inside', edge.toCluster, point, lastPointOutside);

        // First point inside the rect
        const insterection = intersection(node, lastPointOutside, point);
        logger.trace('intersect', insterection);
        points.push(insterection);
        isInside = true;
      } else {
        if (!isInside) points.push(point);
      }
      lastPointOutside = point;
    });
  }

  if (edge.fromCluster) {
    logger.trace('edge', edge);
    logger.trace('from cluster', clusterDb[edge.toCluster]);
    const updatedPoints = [];
    let lastPointOutside;
    let isInside = false;
    for (let i = points.length - 1; i >= 0; i--) {
      const point = points[i];
      const node = clusterDb[edge.fromCluster].node;

      if (!outsideNode(node, point) && !isInside) {
        logger.trace('inside', edge.toCluster, point);

        // First point inside the rect
        const insterection = intersection(node, lastPointOutside, point);
        // logger.trace('intersect', intersection(node, lastPointOutside, point));
        updatedPoints.unshift(insterection);
        // points.push(insterection);
        isInside = true;
      } else {
        // at the outside
        logger.trace('Outside point', point);
        if (!isInside) updatedPoints.unshift(point);
      }
      lastPointOutside = point;
    }
    points = updatedPoints;
  }

  // The data for our line
  const lineData = points.filter(p => !Number.isNaN(p.y));

  // This is the accessor function we talked about above
  const lineFunction = line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    })
    .curve(curveBasis);

  const svgPath = elem
    .append('path')
    .attr('d', lineFunction(lineData))
    .attr('id', edge.id)
    .attr('class', 'transition' + (edge.classes ? ' ' + edge.classes : ''));

  // DEBUG code, adds a red circle at each edge coordinate
  // edge.points.forEach(point => {
  //   elem
  //     .append('circle')
  //     .style('stroke', 'red')
  //     .style('fill', 'red')
  //     .attr('r', 1)
  //     .attr('cx', point.x)
  //     .attr('cy', point.y);
  // });

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
  logger.info('arrowType', edge.arrowType);
  switch (edge.arrowType) {
    case 'arrow_cross':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-crossEnd' + ')');
      break;
    case 'double_arrow_cross':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-crossEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-crossStart' + ')');
      break;
    case 'arrow_point':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-pointEnd' + ')');
      break;
    case 'double_arrow_point':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-pointEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-pointStart' + ')');
      break;
    case 'arrow_barb':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-barbEnd' + ')');
      break;
    case 'double_arrow_barb':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-barnEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-barbStart' + ')');
      break;
    case 'arrow_circle':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-circleEnd' + ')');
      break;
    case 'double_arrow_circle':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-circleEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-circleStart' + ')');
      break;
    default:
  }
};
