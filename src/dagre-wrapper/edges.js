import { log } from '../logger'; // eslint-disable-line
import createLabel from './createLabel';
// import { line, curveBasis, curveLinear, select } from 'd3';
import { line, curveBasis, select } from 'd3';
import { getConfig } from '../config';
import utils from '../utils';
import { evaluate } from '../diagrams/common/common';

let edgeLabels = {};
let terminalLabels = {};

export const clear = () => {
  edgeLabels = {};
  terminalLabels = {};
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
  if (evaluate(getConfig().flowchart.htmlLabels)) {
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

  if (edge.startLabelLeft) {
    // Create the actual text element
    const startLabelElement = createLabel(edge.startLabelLeft, edge.labelStyle);
    const startEdgeLabelLeft = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = startEdgeLabelLeft.insert('g').attr('class', 'inner');
    inner.node().appendChild(startLabelElement);
    const slBox = startLabelElement.getBBox();
    inner.attr('transform', 'translate(' + -slBox.width / 2 + ', ' + -slBox.height / 2 + ')');
    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].startLeft = startEdgeLabelLeft;
  }
  if (edge.startLabelRight) {
    // Create the actual text element
    const startLabelElement = createLabel(edge.startLabelRight, edge.labelStyle);
    const startEdgeLabelRight = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = startEdgeLabelRight.insert('g').attr('class', 'inner');
    startEdgeLabelRight.node().appendChild(startLabelElement);
    inner.node().appendChild(startLabelElement);
    const slBox = startLabelElement.getBBox();
    inner.attr('transform', 'translate(' + -slBox.width / 2 + ', ' + -slBox.height / 2 + ')');

    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].startRight = startEdgeLabelRight;
  }
  if (edge.endLabelLeft) {
    // Create the actual text element
    const endLabelElement = createLabel(edge.endLabelLeft, edge.labelStyle);
    const endEdgeLabelLeft = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = endEdgeLabelLeft.insert('g').attr('class', 'inner');
    inner.node().appendChild(endLabelElement);
    const slBox = endLabelElement.getBBox();
    inner.attr('transform', 'translate(' + -slBox.width / 2 + ', ' + -slBox.height / 2 + ')');

    endEdgeLabelLeft.node().appendChild(endLabelElement);
    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].endLeft = endEdgeLabelLeft;
  }
  if (edge.endLabelRight) {
    // Create the actual text element
    const endLabelElement = createLabel(edge.endLabelRight, edge.labelStyle);
    const endEdgeLabelRight = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = endEdgeLabelRight.insert('g').attr('class', 'inner');

    inner.node().appendChild(endLabelElement);
    const slBox = endLabelElement.getBBox();
    inner.attr('transform', 'translate(' + -slBox.width / 2 + ', ' + -slBox.height / 2 + ')');

    endEdgeLabelRight.node().appendChild(endLabelElement);
    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].endRight = endEdgeLabelRight;
  }
};

export const positionEdgeLabel = (edge, paths) => {
  log.info('Moving label abc78 ', edge.id, edge.label, edgeLabels[edge.id]);
  let path = paths.updatedPath ? paths.updatedPath : paths.originalPath;
  if (edge.label) {
    const el = edgeLabels[edge.id];
    let x = edge.x;
    let y = edge.y;
    if (path) {
      //   // debugger;
      const pos = utils.calcLabelPosition(path);
      log.info('Moving label from (', x, ',', y, ') to (', pos.x, ',', pos.y, ') abc78');
      // x = pos.x;
      // y = pos.y;
    }
    el.attr('transform', 'translate(' + x + ', ' + y + ')');
  }

  //let path = paths.updatedPath ? paths.updatedPath : paths.originalPath;
  if (edge.startLabelLeft) {
    const el = terminalLabels[edge.id].startLeft;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(0, 'start_left', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', 'translate(' + x + ', ' + y + ')');
  }
  if (edge.startLabelRight) {
    const el = terminalLabels[edge.id].startRight;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(0, 'start_right', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', 'translate(' + x + ', ' + y + ')');
  }
  if (edge.endLabelLeft) {
    const el = terminalLabels[edge.id].endLeft;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(0, 'end_left', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', 'translate(' + x + ', ' + y + ')');
  }
  if (edge.endLabelRight) {
    const el = terminalLabels[edge.id].endRight;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(0, 'end_right', path);
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
  // log.warn('Checking bounds ', node, point);
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
  log.warn(`intersection calc abc89:
  outsidePoint: ${JSON.stringify(outsidePoint)}
  insidePoint : ${JSON.stringify(insidePoint)}
  node        : x:${node.x} y:${node.y} w:${node.width} h:${node.height}`);
  const x = node.x;
  const y = node.y;

  const dx = Math.abs(x - insidePoint.x);
  // const dy = Math.abs(y - insidePoint.y);
  const w = node.width / 2;
  let r = insidePoint.x < outsidePoint.x ? w - dx : w + dx;
  const h = node.height / 2;

  // const edges = {
  //   x1: x - w,
  //   x2: x + w,
  //   y1: y - h,
  //   y2: y + h
  // };

  // if (
  //   outsidePoint.x === edges.x1 ||
  //   outsidePoint.x === edges.x2 ||
  //   outsidePoint.y === edges.y1 ||
  //   outsidePoint.y === edges.y2
  // ) {
  //   log.warn('abc89 calc equals on edge', outsidePoint, edges);
  //   return outsidePoint;
  // }

  const Q = Math.abs(outsidePoint.y - insidePoint.y);
  const R = Math.abs(outsidePoint.x - insidePoint.x);
  // log.warn();
  if (Math.abs(y - outsidePoint.y) * w > Math.abs(x - outsidePoint.x) * h) { // eslint-disable-line
    // Intersection is top or bottom of rect.
    // let q = insidePoint.y < outsidePoint.y ? outsidePoint.y - h - y : y - h - outsidePoint.y;
    let q = insidePoint.y < outsidePoint.y ? outsidePoint.y - h - y : y - h - outsidePoint.y;
    r = (R * q) / Q;
    const res = {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + r : insidePoint.x - R + r,
      y: insidePoint.y < outsidePoint.y ? insidePoint.y + Q - q : insidePoint.y - Q + q,
    };

    if (r === 0) {
      res.x = outsidePoint.x;
      res.y = outsidePoint.y;
    }
    if (R === 0) {
      res.x = outsidePoint.x;
    }
    if (Q === 0) {
      res.y = outsidePoint.y;
    }

    log.warn(`abc89 topp/bott calc, Q ${Q}, q ${q}, R ${R}, r ${r}`, res);

    return res;
  } else {
    // Intersection onn sides of rect
    if (insidePoint.x < outsidePoint.x) {
      r = outsidePoint.x - w - x;
    } else {
      // r = outsidePoint.x - w - x;
      r = x - w - outsidePoint.x;
    }
    let q = (Q * r) / R;
    //  OK let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x + dx - w;
    // OK let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : outsidePoint.x + r;
    let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x - R + r;
    // let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : outsidePoint.x + r;
    let _y = insidePoint.y < outsidePoint.y ? insidePoint.y + q : insidePoint.y - q;
    log.warn(`sides calc abc89, Q ${Q}, q ${q}, R ${R}, r ${r}`, { _x, _y });
    if (r === 0) {
      _x = outsidePoint.x;
      _y = outsidePoint.y;
    }
    if (R === 0) {
      _x = outsidePoint.x;
    }
    if (Q === 0) {
      _y = outsidePoint.y;
    }

    return { x: _x, y: _y };
  }
};
/**
 * This function will page a path and node where the last point(s) in the path is inside the node
 * and return an update path ending by the border of the node.
 * @param {*} points
 * @param {*} boundryNode
 * @returns
 */
const cutPathAtIntersect = (_points, boundryNode) => {
  log.warn('abc88 cutPathAtIntersect', _points, boundryNode);
  let points = [];
  let lastPointOutside = _points[0];
  let isInside = false;
  _points.forEach((point) => {
    // const node = clusterDb[edge.toCluster].node;
    log.info('abc88 checking point', point, boundryNode);

    // check if point is inside the boundry rect
    if (!outsideNode(boundryNode, point) && !isInside) {
      // First point inside the rect found
      // Calc the intersection coord between the point anf the last opint ouside the rect
      const inter = intersection(boundryNode, lastPointOutside, point);
      log.warn('abc88 inside', point, lastPointOutside, inter);
      log.warn('abc88 intersection', inter);

      // // Check case where the intersection is the same as the last point
      let pointPresent = false;
      points.forEach((p) => {
        pointPresent = pointPresent || (p.x === inter.x && p.y === inter.y);
      });
      // // if (!pointPresent) {
      if (!points.find((e) => e.x === inter.x && e.y === inter.y)) {
        points.push(inter);
      } else {
        log.warn('abc88 no intersect', inter, points);
      }
      // points.push(inter);
      isInside = true;
    } else {
      // Outside
      log.warn('abc88 outside', point, lastPointOutside);
      lastPointOutside = point;
      // points.push(point);
      if (!isInside) points.push(point);
    }
  });
  log.warn('abc88 returning points', points);
  return points;
};

//(edgePaths, e, edge, clusterDb, diagramtype, graph)
export const insertEdge = function (elem, e, edge, clusterDb, diagramType, graph) {
  let points = edge.points;
  let pointsHasChanged = false;
  const tail = graph.node(e.v);
  var head = graph.node(e.w);

  log.info('abc88 InsertEdge: ', edge);
  if (head.intersect && tail.intersect) {
    points = points.slice(1, edge.points.length - 1);
    points.unshift(tail.intersect(points[0]));
    log.info(
      'Last point',
      points[points.length - 1],
      head,
      head.intersect(points[points.length - 1])
    );
    points.push(head.intersect(points[points.length - 1]));
  }
  if (edge.toCluster) {
    log.info('to cluster abc88', clusterDb[edge.toCluster]);
    points = cutPathAtIntersect(edge.points, clusterDb[edge.toCluster].node);
    // log.trace('edge', edge);
    // points = [];
    // let lastPointOutside; // = edge.points[0];
    // let isInside = false;
    // edge.points.forEach(point => {
    //   const node = clusterDb[edge.toCluster].node;
    //   log.warn('checking from', edge.fromCluster, point, node);

    //   if (!outsideNode(node, point) && !isInside) {
    //     log.trace('inside', edge.toCluster, point, lastPointOutside);

    //     // First point inside the rect
    //     const inter = intersection(node, lastPointOutside, point);

    //     let pointPresent = false;
    //     points.forEach(p => {
    //       pointPresent = pointPresent || (p.x === inter.x && p.y === inter.y);
    //     });
    //     // if (!pointPresent) {
    //     if (!points.find(e => e.x === inter.x && e.y === inter.y)) {
    //       points.push(inter);
    //     } else {
    //       log.warn('no intersect', inter, points);
    //     }
    //     isInside = true;
    // } else {
    //   // outtside
    //   lastPointOutside = point;
    //   if (!isInside) points.push(point);
    // }
    // });
    pointsHasChanged = true;
  }

  if (edge.fromCluster) {
    log.info('from cluster abc88', clusterDb[edge.fromCluster]);
    points = cutPathAtIntersect(points.reverse(), clusterDb[edge.fromCluster].node).reverse();
    // log.warn('edge', edge);
    // log.warn('from cluster', clusterDb[edge.fromCluster], points);
    // const updatedPoints = [];
    // let lastPointOutside = edge.points[edge.points.length - 1];
    // let isInside = false;
    // for (let i = points.length - 1; i >= 0; i--) {
    //   const point = points[i];
    //   const node = clusterDb[edge.fromCluster].node;
    //   log.warn('checking to', edge.fromCluster, point, node);

    //   if (!outsideNode(node, point) && !isInside) {
    //     log.warn('inside', edge.fromCluster, point, node);

    //     // First point inside the rect
    //     const inter = intersection(node, lastPointOutside, point);
    //     log.warn('intersect', intersection(node, lastPointOutside, point));
    //     let pointPresent = false;
    //     points.forEach(p => {
    //       pointPresent = pointPresent || (p.x === inter.x && p.y === inter.y);
    //     });
    //     // if (!pointPresent) {
    //     if (!points.find(e => e.x === inter.x && e.y === inter.y)) {
    //       updatedPoints.unshift(inter);
    //       log.warn('Adding point -updated = ', updatedPoints);
    //     } else {
    //       log.warn('no intersect', inter, points);
    //     }
    //     // points.push(insterection);
    //     isInside = true;
    //   } else {
    //     // at the outside
    //     // if (!isInside) updatedPoints.unshift(point);
    //     updatedPoints.unshift(point);
    //     log.warn('Outside point', point, updatedPoints);
    //   }
    //   lastPointOutside = point;
    // }
    // points = updatedPoints;
    // points = edge.points;
    pointsHasChanged = true;
  }

  // The data for our line
  const lineData = points.filter((p) => !Number.isNaN(p.y));

  // This is the accessor function we talked about above
  let curve;
  // Currently only flowcharts get the curve from the settings, perhaps this should
  // be expanded to a common setting? Restricting it for now in order not to cause side-effects that
  // have not been thought through
  if (diagramType === 'graph' || diagramType === 'flowchart') {
    curve = edge.curve || curveBasis;
  } else {
    curve = curveBasis;
  }
  // curve = curveLinear;
  const lineFunction = line()
    .x(function (d) {
      return d.x;
    })
    .y(function (d) {
      return d.y;
    })
    .curve(curve);

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
    .attr('class', ' ' + strokeClasses + (edge.classes ? ' ' + edge.classes : ''))
    .attr('style', edge.style);

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
  log.info('arrowTypeStart', edge.arrowTypeStart);
  log.info('arrowTypeEnd', edge.arrowTypeEnd);

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
  let paths = {};
  if (pointsHasChanged) {
    paths.updatedPath = points;
  }
  paths.originalPath = edge.points;
  return paths;
};
