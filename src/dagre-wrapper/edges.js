import { logger } from '../logger'; // eslint-disable-line
import createLabel from './createLabel';
import { line, curveBasis, select } from 'd3';
import { getConfig } from '../config';
import utils from '../utils';
// import { calcLabelPosition } from '../utils';

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

export const positionEdgeLabel = (edge, points) => {
  logger.info('Moving label', edge.id, edge.label, edgeLabels[edge.id]);
  if (edge.label) {
    const el = edgeLabels[edge.id];
    let x = edge.x;
    let y = edge.y;
    if (points) {
      // debugger;
      const pos = utils.calcLabelPosition(points);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', 'translate(' + x + ', ' + y + ')');
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
  // logger.warn('Checking bounds ', node, point);
  const x = node.x;
  const y = node.y;
  const dx = Math.abs(point.x - x);
  const dy = Math.abs(point.y - y);
  const w = node.width / 2;
  const h = node.height / 2;
  if (dx >= w || dy >= h) {
    return true;
  }
  return false;
};

export const intersection = (node, outsidePoint, insidePoint) => {
  logger.warn('intersection calc o:', outsidePoint, ' i:', insidePoint, node);
  const x = node.x;
  const y = node.y;

  const dx = Math.abs(x - insidePoint.x);
  const w = node.width / 2;
  let r = insidePoint.x < outsidePoint.x ? w - dx : w + dx;
  const h = node.height / 2;

  const edges = {
    x1: x - w,
    x2: x + w,
    y1: y - h,
    y2: y + h
  };

  if (
    outsidePoint.x === edges.x1 ||
    outsidePoint.x === edges.x2 ||
    outsidePoint.y === edges.y1 ||
    outsidePoint.y === edges.y2
  ) {
    logger.warn('calc equals on edge');
    return outsidePoint;
  }

  const Q = Math.abs(outsidePoint.y - insidePoint.y);
  const R = Math.abs(outsidePoint.x - insidePoint.x);
  // log.warn();
  if (Math.abs(y - outsidePoint.y) * w > Math.abs(x - outsidePoint.x) * h) { // eslint-disable-line
    // Intersection is top or bottom of rect.
    // let q = insidePoint.y < outsidePoint.y ? outsidePoint.y - h - y : y - h - outsidePoint.y;
    let q = insidePoint.y < outsidePoint.y ? outsidePoint.y - h - y : y - h - outsidePoint.y;
    r = (R * q) / Q;
    const res = {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x - r,
      y: outsidePoint.y + q
    };
    logger.warn(`topp/bott calc, Q ${Q}, q ${q}, R ${R}, r ${r}`, res);

    return res;
  } else {
    // Intersection onn sides of rect
    // q = (Q * r) / R;
    // q = 2;
    // r = (R * q) / Q;
    if (insidePoint.x < outsidePoint.x) {
      r = outsidePoint.x - w - x;
    } else {
      // r = outsidePoint.x - w - x;
      r = x - w - outsidePoint.x;
    }
    let q = (q = (Q * r) / R);
    logger.warn(`sides calc, Q ${Q}, q ${q}, R ${R}, r ${r}`, {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x + dx - w,
      y: insidePoint.y < outsidePoint.y ? insidePoint.y + q : insidePoint.y - q
    });

    return {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x + dx - w,
      y: insidePoint.y < outsidePoint.y ? insidePoint.y + q : insidePoint.y - q
    };
  }
};

//(edgePaths, e, edge, clusterDb, diagramtype, graph)
export const insertEdge = function(elem, e, edge, clusterDb, diagramType, graph) {
  let points = edge.points;
  let pointsHasChanged = false;
  const tail = graph.node(e.v);
  var head = graph.node(e.w);

  if (head.intersect && tail.intersect) {
    points = points.slice(1, edge.points.length - 1);
    points.unshift(tail.intersect(points[0]));
    logger.info(
      'Last point',
      points[points.length - 1],
      head,
      head.intersect(points[points.length - 1])
    );
    points.push(head.intersect(points[points.length - 1]));
  }
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
        const inter = intersection(node, lastPointOutside, point);

        let pointPresent = false;
        points.forEach(p => {
          pointPresent = pointPresent || (p.x === inter.x && p.y === inter.y);
        });
        // if (!pointPresent) {
        if (!points.find(e => e.x === inter.x && e.y === inter.y)) {
          points.push(inter);
        } else {
          logger.warn('no intersect', inter, points);
        }
        isInside = true;
      } else {
        if (!isInside) points.push(point);
      }
      lastPointOutside = point;
    });
    pointsHasChanged = true;
  }

  if (edge.fromCluster) {
    logger.trace('edge', edge);
    logger.warn('from cluster', clusterDb[edge.fromCluster]);
    const updatedPoints = [];
    let lastPointOutside;
    let isInside = false;
    for (let i = points.length - 1; i >= 0; i--) {
      const point = points[i];
      const node = clusterDb[edge.fromCluster].node;

      if (!outsideNode(node, point) && !isInside) {
        logger.warn('inside', edge.fromCluster, point, node);

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
    pointsHasChanged = true;
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

  // Contruct stroke classes based on properties
  let strokeClasses;
  switch (edge.thickness) {
    case 'normal':
      strokeClasses = 'edge-thickness-normal';
      break;
    case 'thick':
      strokeClasses = 'edge-thickness-thick';
      break;
    default:
      strokeClasses = '';
  }
  switch (edge.pattern) {
    case 'solid':
      strokeClasses += ' edge-pattern-solid';
      break;
    case 'dotted':
      strokeClasses += ' edge-pattern-dotted';
      break;
    case 'dashed':
      strokeClasses += ' edge-pattern-dashed';
      break;
  }

  const svgPath = elem
    .append('path')
    .attr('d', lineFunction(lineData))
    .attr('id', edge.id)
    .attr('class', ' ' + strokeClasses + (edge.classes ? ' ' + edge.classes : ''));

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
  logger.info('arrowTypeStart', edge.arrowTypeStart);
  logger.info('arrowTypeEnd', edge.arrowTypeEnd);

  switch (edge.arrowTypeStart) {
    case 'arrow_cross':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-crossStart' + ')');
      break;
    case 'arrow_point':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-pointStart' + ')');
      break;
    case 'arrow_barb':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-barbStart' + ')');
      break;
    case 'arrow_circle':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-circleStart' + ')');
      break;
    case 'aggregation':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-aggregationStart' + ')');
      break;
    case 'extension':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-extensionStart' + ')');
      break;
    case 'composition':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-compositionStart' + ')');
      break;
    case 'dependency':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-dependencyStart' + ')');
      break;
    default:
  }
  switch (edge.arrowTypeEnd) {
    case 'arrow_cross':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-crossEnd' + ')');
      break;
    case 'arrow_point':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-pointEnd' + ')');
      break;
    case 'arrow_barb':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-barbEnd' + ')');
      break;
    case 'arrow_circle':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-circleEnd' + ')');
      break;
    case 'aggregation':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-aggregationEnd' + ')');
      break;
    case 'extension':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-extensionEnd' + ')');
      break;
    case 'composition':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-compositionEnd' + ')');
      break;
    case 'dependency':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-dependencyEnd' + ')');
      break;
    default:
  }

  if (pointsHasChanged) {
    return points;
  }
};
