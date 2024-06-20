import { getConfig } from '$root/diagram-api/diagramAPI.js';
import { evaluate } from '$root/diagrams/common/common.js';
import { log } from '$root/logger.js';
import { createText } from '$root/rendering-util/createText.ts';
import utils from '$root/utils.js';
import { getLineFunctionsWithOffset } from '$root/utils/lineWithOffset.js';
import { getSubGraphTitleMargins } from '$root/utils/subGraphTitleMargins.js';
import { curveBasis, line, select } from 'd3';
import rough from 'roughjs';
import createLabel from './createLabel.js';
import { addEdgeMarkers } from './edgeMarker.ts';
//import type { Edge } from '$root/rendering-util/types.d.ts';

let edgeLabels = {};
let terminalLabels = {};

export const clear = () => {
  edgeLabels = {};
  terminalLabels = {};
};

export const insertEdgeLabel = async (elem, edge) => {
  const useHtmlLabels = evaluate(getConfig().flowchart.htmlLabels);
  // Create the actual text element
  const labelElement =
    edge.labelType === 'markdown'
      ? await createText(elem, edge.label, {
          style: edge.labelStyle,
          useHtmlLabels,
          addSvgBackground: true,
        })
      : await createLabel(edge.label, edge.labelStyle);
  log.info('abc82', edge, edge.labelType);

  // Create outer g, edgeLabel, this will be positioned after graph layout
  const edgeLabel = elem.insert('g').attr('class', 'edgeLabel');

  // Create inner g, label, this will be positioned now for centering the text
  const label = edgeLabel.insert('g').attr('class', 'label');
  label.node().appendChild(labelElement);

  // Center the label
  let bbox = labelElement.getBBox();
  if (useHtmlLabels) {
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

  let fo;
  if (edge.startLabelLeft) {
    // Create the actual text element
    const startLabelElement = await createLabel(edge.startLabelLeft, edge.labelStyle);
    const startEdgeLabelLeft = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = startEdgeLabelLeft.insert('g').attr('class', 'inner');
    fo = inner.node().appendChild(startLabelElement);
    const slBox = startLabelElement.getBBox();
    inner.attr('transform', 'translate(' + -slBox.width / 2 + ', ' + -slBox.height / 2 + ')');
    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].startLeft = startEdgeLabelLeft;
    setTerminalWidth(fo, edge.startLabelLeft);
  }
  if (edge.startLabelRight) {
    // Create the actual text element
    const startLabelElement = await createLabel(edge.startLabelRight, edge.labelStyle);
    const startEdgeLabelRight = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = startEdgeLabelRight.insert('g').attr('class', 'inner');
    fo = startEdgeLabelRight.node().appendChild(startLabelElement);
    inner.node().appendChild(startLabelElement);
    const slBox = startLabelElement.getBBox();
    inner.attr('transform', 'translate(' + -slBox.width / 2 + ', ' + -slBox.height / 2 + ')');

    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].startRight = startEdgeLabelRight;
    setTerminalWidth(fo, edge.startLabelRight);
  }
  if (edge.endLabelLeft) {
    // Create the actual text element
    const endLabelElement = await createLabel(edge.endLabelLeft, edge.labelStyle);
    const endEdgeLabelLeft = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = endEdgeLabelLeft.insert('g').attr('class', 'inner');
    fo = inner.node().appendChild(endLabelElement);
    const slBox = endLabelElement.getBBox();
    inner.attr('transform', 'translate(' + -slBox.width / 2 + ', ' + -slBox.height / 2 + ')');

    endEdgeLabelLeft.node().appendChild(endLabelElement);

    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].endLeft = endEdgeLabelLeft;
    setTerminalWidth(fo, edge.endLabelLeft);
  }
  if (edge.endLabelRight) {
    // Create the actual text element
    const endLabelElement = await createLabel(edge.endLabelRight, edge.labelStyle);
    const endEdgeLabelRight = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = endEdgeLabelRight.insert('g').attr('class', 'inner');

    fo = inner.node().appendChild(endLabelElement);
    const slBox = endLabelElement.getBBox();
    inner.attr('transform', 'translate(' + -slBox.width / 2 + ', ' + -slBox.height / 2 + ')');

    endEdgeLabelRight.node().appendChild(endLabelElement);
    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].endRight = endEdgeLabelRight;
    setTerminalWidth(fo, edge.endLabelRight);
  }
  return labelElement;
};

/**
 * @param {any} fo
 * @param {any} value
 */
function setTerminalWidth(fo, value) {
  if (getConfig().flowchart.htmlLabels && fo) {
    fo.style.width = value.length * 9 + 'px';
    fo.style.height = '12px';
  }
}

export const positionEdgeLabel = (edge, paths) => {
  log.info('Moving label abc78 ', edge.id, edge.label, edgeLabels[edge.id]);
  let path = paths.updatedPath ? paths.updatedPath : paths.originalPath;
  const siteConfig = getConfig();
  const { subGraphTitleTotalMargin } = getSubGraphTitleMargins(siteConfig);
  if (edge.label) {
    const el = edgeLabels[edge.id];
    let x = edge.x;
    let y = edge.y;
    if (path) {
      //   // debugger;
      const pos = utils.calcLabelPosition(path);
      log.info(
        'Moving label ' + edge?.id + ' from (',
        x,
        ',',
        y,
        ') to (',
        pos.x,
        ',',
        pos.y,
        ') abc78'
      );
      if (paths.updatedPath) {
        x = pos.x;
        y = pos.y;
      }
    }
    el.attr('transform', `translate(${x}, ${y + subGraphTitleTotalMargin / 2})`);
  }

  //let path = paths.updatedPath ? paths.updatedPath : paths.originalPath;
  if (edge.startLabelLeft) {
    const el = terminalLabels[edge.id].startLeft;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(edge.arrowTypeStart ? 10 : 0, 'start_left', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
  if (edge.startLabelRight) {
    const el = terminalLabels[edge.id].startRight;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(
        edge.arrowTypeStart ? 10 : 0,
        'start_right',
        path
      );
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
  if (edge.endLabelLeft) {
    const el = terminalLabels[edge.id].endLeft;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(edge.arrowTypeEnd ? 10 : 0, 'end_left', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
  if (edge.endLabelRight) {
    const el = terminalLabels[edge.id].endRight;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(edge.arrowTypeEnd ? 10 : 0, 'end_right', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
};

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
  log.debug(`intersection calc abc89:
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

  const Q = Math.abs(outsidePoint.y - insidePoint.y);
  const R = Math.abs(outsidePoint.x - insidePoint.x);

  if (Math.abs(y - outsidePoint.y) * w > Math.abs(x - outsidePoint.x) * h) {
    // Intersection is top or bottom of rect.
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

    log.debug(`abc89 topp/bott calc, Q ${Q}, q ${q}, R ${R}, r ${r}`, res); // cspell: disable-line

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
    log.debug(`sides calc abc89, Q ${Q}, q ${q}, R ${R}, r ${r}`, { _x, _y });
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
 *
 * @param {Array} _points
 * @param {any} boundaryNode
 * @returns {Array} Points
 */
const cutPathAtIntersect = (_points, boundaryNode) => {
  log.warn('abc88 cutPathAtIntersect', _points, boundaryNode);
  let points = [];
  let lastPointOutside = _points[0];
  let isInside = false;
  _points.forEach((point) => {
    // const node = clusterDb[edge.toCluster].node;
    log.info('abc88 checking point', point, boundaryNode);

    // check if point is inside the boundary rect
    if (!outsideNode(boundaryNode, point) && !isInside) {
      // First point inside the rect found
      // Calc the intersection coord between the point anf the last point outside the rect
      const inter = intersection(boundaryNode, lastPointOutside, point);
      log.debug('abc88 inside', point, lastPointOutside, inter);
      log.debug('abc88 intersection', inter, boundaryNode);

      // // Check case where the intersection is the same as the last point
      let pointPresent = false;
      points.forEach((p) => {
        pointPresent = pointPresent || (p.x === inter.x && p.y === inter.y);
      });
      // // if (!pointPresent) {
      if (!points.some((e) => e.x === inter.x && e.y === inter.y)) {
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
      if (!isInside) {
        points.push(point);
      }
    }
  });
  log.debug('returning points', points);
  return points;
};

/**
 * Given an edge, this function will return the corner points of the edge. This is defined as:
 * one point that has a previous point and a next point such as the angle between the previous
 * point and the next point is 90 degrees. Meaning that the previous point has the same x coordinate
 * as the center point and at the same time the next point has the same y coordinate or vice versa.
 * @param points
 */
function extractCornerPoints(points) {
  const cornerPoints = [];
  const cornerPointPositions = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    if (
      prev.x === curr.x &&
      curr.y === next.y &&
      Math.abs(curr.x - next.x) > 5 &&
      Math.abs(curr.y - prev.y) > 5
    ) {
      cornerPoints.push(curr);
      cornerPointPositions.push(i);
    } else if (
      prev.y === curr.y &&
      curr.x === next.x &&
      Math.abs(curr.x - prev.x) > 5 &&
      Math.abs(curr.y - next.y) > 5
    ) {
      cornerPoints.push(curr);
      cornerPointPositions.push(i);
    }
  }
  return { cornerPoints, cornerPointPositions };
}

const findAdjacentPoint = function (pointA, pointB, distance) {
  const xDiff = pointB.x - pointA.x;
  const yDiff = pointB.y - pointA.y;
  const length = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  const ratio = distance / length;
  return { x: pointB.x - ratio * xDiff, y: pointB.y - ratio * yDiff };
};

/**
 * Given an array of points, this function will return a new array of points where the corners have been removed and replaced with
 * adjacent points in each direction. SO a corder will be replaced with a point before and the point after the corner.
 */

const fixCorners = function (lineData) {
  const { cornerPoints, cornerPointPositions } = extractCornerPoints(lineData);
  const newLineData = [];
  let lastCorner = 0;
  for (let i = 0; i < lineData.length; i++) {
    if (cornerPointPositions.includes(i)) {
      const prevPoint = lineData[i - 1];
      const nextPoint = lineData[i + 1];
      const cornerPoint = lineData[i];

      // Find a new point on the line point 5 points back and push it to the new array
      const newPrevPoint = findAdjacentPoint(prevPoint, cornerPoint, 5);
      const newNextPoint = findAdjacentPoint(nextPoint, cornerPoint, 5);

      const xDiff = newNextPoint.x - newPrevPoint.x;
      const yDiff = newNextPoint.y - newPrevPoint.y;
      newLineData.push(newPrevPoint);

      const a = Math.sqrt(2) * 2;
      let newCornerPoint = { x: cornerPoint.x, y: cornerPoint.y };
      if (Math.abs(nextPoint.x - prevPoint.x) > 10 && Math.abs(nextPoint.y - prevPoint.y) >= 10) {
        log.debug(
          'Corner point fixing',
          Math.abs(nextPoint.x - prevPoint.x),
          Math.abs(nextPoint.y - prevPoint.y)
        );
        const r = 5;
        if (cornerPoint.x === newPrevPoint.x) {
          newCornerPoint = {
            x: xDiff < 0 ? newPrevPoint.x - r + a : newPrevPoint.x + r - a,
            y: yDiff < 0 ? newPrevPoint.y - a : newPrevPoint.y + a,
          };
        } else {
          newCornerPoint = {
            x: xDiff < 0 ? newPrevPoint.x - a : newPrevPoint.x + a,
            y: yDiff < 0 ? newPrevPoint.y - r + a : newPrevPoint.y + r - a,
          };
        }
      } else {
        log.debug(
          'Corner point skipping fixing',
          Math.abs(nextPoint.x - prevPoint.x),
          Math.abs(nextPoint.y - prevPoint.y)
        );
      }
      newLineData.push(newCornerPoint, newNextPoint);
    } else {
      newLineData.push(lineData[i]);
    }
  }
  return newLineData;
};

export const insertEdge = function (elem, edge, clusterDb, diagramType, startNode, endNode, id) {
  const { handdrawnSeed } = getConfig();
  let points = edge.points;
  let pointsHasChanged = false;
  const tail = startNode;
  var head = endNode;

  log.info(
    'abc88 InsertEdge Start: ',
    edge.start,
    '-->',
    edge.end,
    JSON.stringify(points, null, 2)
  );
  if (head.intersect && tail.intersect) {
    // log.info('abc88 InsertEdge: 0.5', edge.start, '-->', edge.end, JSON.stringify(points));
    points = points.slice(1, edge.points.length - 1);
    // log.info('abc88 InsertEdge APA12: 0.7', edge.start, '-->', edge.end,   JSON.stringify(points));
    points.unshift(tail.intersect(points[0]));
    log.debug(
      'Last point APA12',
      edge.start,
      '-->',
      edge.end,
      points[points.length - 1],
      head,
      head.intersect(points[points.length - 1])
    );
    points.push(head.intersect(points[points.length - 1]));
  }
  // log.info('abc88 InsertEdge 2 SPLIT: ', points);
  if (edge.toCluster) {
    log.info('to cluster abc88', clusterDb[edge.toCluster]);
    points = cutPathAtIntersect(edge.points, clusterDb[edge.toCluster].node);

    pointsHasChanged = true;
  }

  if (edge.fromCluster) {
    log.debug('from cluster abc88', clusterDb[edge.fromCluster], JSON.stringify(points, null, 2));
    points = cutPathAtIntersect(points.reverse(), clusterDb[edge.fromCluster].node).reverse();
    // log.info('from cluster abc88 fixed', JSON.stringify(points, null, 2));

    pointsHasChanged = true;
  }

  // The data for our line
  let lineData = points.filter((p) => !Number.isNaN(p.y));
  // const { cornerPoints, cornerPointPositions } = extractCornerPoints(lineData);
  lineData = fixCorners(lineData);
  let lastPoint = lineData[lineData.length - 1];
  if (lineData.length > 1) {
    lastPoint = lineData[lineData.length - 1];
    const secondLastPoint = lineData[lineData.length - 2];
    // Calculate the mid point of the last two points
    const diffX = (lastPoint.x - secondLastPoint.x) / 2;
    const diffY = (lastPoint.y - secondLastPoint.y) / 2;
    const midPoint = { x: secondLastPoint.x + diffX, y: secondLastPoint.y + diffY };
    lineData.splice(-1, 0, midPoint);
  }
  // This is the accessor function we talked about above
  let curve;
  curve = curveBasis;
  // curve = curveCardinal;
  // curve = curveLinear;
  // curve = curveNatural;
  // curve = curveCatmullRom.alpha(0.5);
  // curve = curveCatmullRom;
  // curve = curveCardinal.tension(0.7);
  // curve = curveMonotoneY;
  // let curve = interpolateToCurve([5], curveNatural, 0.01, 10);
  // Currently only flowcharts get the curve from the settings, perhaps this should
  // be expanded to a common setting? Restricting it for now in order not to cause side-effects that
  // have not been thought through
  if (edge.curve) {
    curve = edge.curve;
  }

  const { x, y } = getLineFunctionsWithOffset(edge);
  // const lineFunction = edge.curve ? line().x(x).y(y).curve(curve) : roundedCornersLine;
  const lineFunction = line().x(x).y(y).curve(curve);

  // Construct stroke classes based on properties
  let strokeClasses;
  switch (edge.thickness) {
    case 'normal':
      strokeClasses = 'edge-thickness-normal';
      break;
    case 'thick':
      strokeClasses = 'edge-thickness-thick';
      break;
    case 'invisible':
      strokeClasses = 'edge-thickness-thick';
      break;
    default:
      strokeClasses = 'edge-thickness-normal';
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
    default:
      strokeClasses += ' edge-pattern-solid';
  }
  let svgPath;
  let linePath = lineFunction(lineData);
  if (edge.look === 'handdrawn') {
    const rc = rough.svg(elem);
    Object.assign([], lineData);
    // const svgPathNode = rc.path(lineFunction(ld.splice(0, ld.length-1)), {
    // const svgPathNode = rc.path(lineFunction(ld), {
    //   roughness: 0.3,
    //   seed: handdrawnSeed,
    // });
    const svgPathNode = rc.path(linePath, {
      roughness: 0.3,
      seed: handdrawnSeed,
    });

    strokeClasses += ' transition';

    svgPath = select(svgPathNode)
      .select('path')
      // .attr('d', lineFunction(lineData))
      .attr('id', edge.id)
      .attr('class', ' ' + strokeClasses + (edge.classes ? ' ' + edge.classes : ''))
      .attr('style', edge.style);
    let d = svgPath.attr('d');
    svgPath.attr('d', d);
    elem.node().appendChild(svgPath.node());
  } else {
    svgPath = elem
      .append('path')
      .attr('d', linePath)
      .attr('id', edge.id)
      .attr('class', ' ' + strokeClasses + (edge.classes ? ' ' + edge.classes : ''))
      .attr('style', edge.style);
  }
  // DEBUG code, adds a red circle at each edge coordinate
  // cornerPoints.forEach((point) => {
  //   elem
  //     .append('circle')
  //     .style('stroke', 'blue')
  //     .style('fill', 'blue')
  //     .attr('r', 3)
  //     .attr('cx', point.x)
  //     .attr('cy', point.y);
  // });

  // lineData.forEach((point) => {
  //   elem
  //     .append('circle')
  //     .style('stroke', 'red')
  //     .style('fill', 'red')
  //     .attr('r', 1)
  //     .attr('cx', point.x)
  //     .attr('cy', point.y);
  // });

  let url = '';
  // // TODO: Can we load this config only from the rendered graph type?
  if (getConfig().flowchart.arrowMarkerAbsolute || getConfig().state.arrowMarkerAbsolute) {
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

  addEdgeMarkers(svgPath, edge, url, id, diagramType);

  let paths = {};
  if (pointsHasChanged) {
    paths.updatedPath = points;
  }
  paths.originalPath = edge.points;
  return paths;
};
