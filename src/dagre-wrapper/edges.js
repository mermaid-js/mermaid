import { logger } from '../logger'; // eslint-disable-line
import createLabel from './createLabel';
import * as d3 from 'd3';
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
  el.attr('transform', 'translate(' + edge.x + ', ' + edge.y + ')');
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

// const intersection = (node, outsidePoint, insidePoint) => {
//   const x = node.x;
//   const y = node.y;

//   const dx = Math.abs(x - insidePoint.x);
//   const w = node.width / 2;
//   let r = w - dx;
//   const dy = Math.abs(y - insidePoint.y);
//   const h = node.height / 2;
//   const q = h - dy;

//   const Q = Math.abs(outsidePoint.y - insidePoint.y);
//   const R = Math.abs(outsidePoint.x - insidePoint.x);
//   r = (R * q) / Q;

//   return { x: insidePoint.x + r, y: insidePoint.y + q };
// };
const intersection = (node, outsidePoint, insidePoint) => {
  // logger.info('intersection', outsidePoint, insidePoint, node);
  const x = node.x;
  const y = node.y;

  const dx = Math.abs(x - insidePoint.x);
  const w = node.width / 2;
  let r = w - dx;
  const dy = Math.abs(y - insidePoint.y);
  const h = node.height / 2;
  let q = h - dy;

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

    return {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + r : insidePoint.x - r,
      y: insidePoint.y < outsidePoint.y ? insidePoint.y + q : insidePoint.y - q
    };
  }
};

export const insertEdge = function(elem, edge, clusterDb) {
  logger.info('\n\n\n\n');
  let points = edge.points;
  if (edge.toCluster) {
    // logger.info('edge', edge);
    // logger.info('to cluster', clusterDb[edge.toCluster]);
    points = [];
    let lastPointOutside;
    let isInside = false;
    edge.points.forEach(point => {
      const node = clusterDb[edge.toCluster].node;

      if (!outsideNode(node, point) && !isInside) {
        // logger.info('inside', edge.toCluster, point);

        // First point inside the rect
        const insterection = intersection(node, lastPointOutside, point);
        // logger.info('intersect', inter.rect(node, lastPointOutside));
        points.push(insterection);
        // points.push(insterection);
        isInside = true;
      } else {
        if (!isInside) points.push(point);
      }
      lastPointOutside = point;
    });
  }

  if (edge.fromCluster) {
    // logger.info('edge', edge);
    // logger.info('from cluster', clusterDb[edge.toCluster]);
    const updatedPoints = [];
    let lastPointOutside;
    let isInside = false;
    for (let i = points.length - 1; i >= 0; i--) {
      const point = points[i];
      const node = clusterDb[edge.fromCluster].node;

      if (!outsideNode(node, point) && !isInside) {
        // logger.info('inside', edge.toCluster, point);

        // First point inside the rect
        const insterection = intersection(node, lastPointOutside, point);
        // logger.info('intersect', intersection(node, lastPointOutside, point));
        updatedPoints.unshift(insterection);
        // points.push(insterection);
        isInside = true;
      } else {
        // at the outside
        // logger.info('Outside point', point);
        if (!isInside) updatedPoints.unshift(point);
      }
      lastPointOutside = point;
    }
    points = updatedPoints;
  }

  // logger.info('Poibts', points);

  // logger.info('Edge', edge);

  // The data for our line
  const lineData = points.filter(p => !Number.isNaN(p.y));

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
  // logger.info('arrowType', edge.arrowType);
  switch (edge.arrowType) {
    case 'arrow_cross':
      svgPath.attr('marker-end', 'url(' + url + '#' + 'crossEnd' + ')');
      break;
    case 'double_arrow_cross':
      svgPath.attr('marker-end', 'url(' + url + '#' + 'crossEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + 'crossStart' + ')');
      break;
    case 'arrow_point':
      svgPath.attr('marker-end', 'url(' + url + '#' + 'pointEnd' + ')');
      break;
    case 'double_arrow_point':
      svgPath.attr('marker-end', 'url(' + url + '#' + 'pointEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + 'pointStart' + ')');
      break;
    case 'arrow_circle':
      svgPath.attr('marker-end', 'url(' + url + '#' + 'circleEnd' + ')');
      break;
    case 'double_arrow_circle':
      svgPath.attr('marker-end', 'url(' + url + '#' + 'circleEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + 'circleStart' + ')');
      break;
    default:
  }
};
