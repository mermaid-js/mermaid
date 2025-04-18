import { log } from '../logger.js';
import createLabel from './createLabel.js';
import { createText } from '../rendering-util/createText.js';
import { line, curveBasis, select } from 'd3';
import { getConfig } from '../diagram-api/diagramAPI.js';
import utils from '../utils.js';
import { evaluate } from '../diagrams/common/common.js';
import { getLineFunctionsWithOffset } from '../utils/lineWithOffset.js';
import { getSubGraphTitleMargins } from '../utils/subGraphTitleMargins.js';
import { addEdgeMarkers } from './edgeMarker.js';

let edgeLabels = {};
let terminalLabels = {};

export const clear = () => {
  edgeLabels = {};
  terminalLabels = {};
};

export const insertEdgeLabel = (elem, edge) => {
  const config = getConfig();
  const useHtmlLabels = evaluate(config.flowchart.htmlLabels);
  // Create the actual text element
  const labelElement =
    edge.labelType === 'markdown'
      ? createText(
          elem,
          edge.label,
          {
            style: edge.labelStyle,
            useHtmlLabels,
            addSvgBackground: true,
          },
          config
        )
      : createLabel(edge.label, edge.labelStyle);

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
    const startLabelElement = createLabel(edge.startLabelLeft, edge.labelStyle);
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
    const startLabelElement = createLabel(edge.startLabelRight, edge.labelStyle);
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
    const endLabelElement = createLabel(edge.endLabelLeft, edge.labelStyle);
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
    const endLabelElement = createLabel(edge.endLabelRight, edge.labelStyle);
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
  log.debug('Moving label abc88 ', edge.id, edge.label, edgeLabels[edge.id], paths);
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
      log.debug(
        'Moving label ' + edge.label + ' from (',
        x,
        ',',
        y,
        ') to (',
        pos.x,
        ',',
        pos.y,
        ') abc88'
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
    // Intersection on sides of rect
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
  log.debug('abc88 cutPathAtIntersect', _points, boundaryNode);
  let points = [];
  let lastPointOutside = _points[0];
  let isInside = false;
  _points.forEach((point) => {
    // check if point is inside the boundary rect
    if (!outsideNode(boundaryNode, point) && !isInside) {
      // First point inside the rect found
      // Calc the intersection coord between the point and the last point outside the rect
      const inter = intersection(boundaryNode, lastPointOutside, point);

      // // Check case where the intersection is the same as the last point
      let pointPresent = false;
      points.forEach((p) => {
        pointPresent = pointPresent || (p.x === inter.x && p.y === inter.y);
      });
      // // if (!pointPresent) {
      if (!points.some((e) => e.x === inter.x && e.y === inter.y)) {
        points.push(inter);
      }

      isInside = true;
    } else {
      // Outside
      lastPointOutside = point;
      // points.push(point);
      if (!isInside) {
        points.push(point);
      }
    }
  });
  return points;
};

export const insertEdge = function (elem, e, edge, clusterDb, diagramType, graph, id) {
  let points = edge.points;
  log.debug('abc88 InsertEdge: edge=', edge, 'e=', e);
  let pointsHasChanged = false;
  const tail = graph.node(e.v);
  var head = graph.node(e.w);

  if (head?.intersect && tail?.intersect) {
    points = points.slice(1, edge.points.length - 1);
    points.unshift(tail.intersect(points[0]));
    points.push(head.intersect(points[points.length - 1]));
  }

  if (edge.toCluster) {
    log.debug('to cluster abc88', clusterDb[edge.toCluster]);
    points = cutPathAtIntersect(edge.points, clusterDb[edge.toCluster].node);

    pointsHasChanged = true;
  }

  if (edge.fromCluster) {
    log.debug('from cluster abc88', clusterDb[edge.fromCluster]);
    points = cutPathAtIntersect(points.reverse(), clusterDb[edge.fromCluster].node).reverse();

    pointsHasChanged = true;
  }

  // The data for our line
  const lineData = points.filter((p) => !Number.isNaN(p.y));

  // This is the accessor function we talked about above
  let curve = curveBasis;
  // Currently only flowcharts get the curve from the settings, perhaps this should
  // be expanded to a common setting? Restricting it for now in order not to cause side-effects that
  // have not been thought through
  if (edge.curve && (diagramType === 'graph' || diagramType === 'flowchart')) {
    curve = edge.curve;
  }

  const { x, y } = getLineFunctionsWithOffset(edge);
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
  // edge.points.forEach((point) => {
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

  addEdgeMarkers(svgPath, edge, url, id, diagramType);

  let paths = {};
  if (pointsHasChanged) {
    paths.updatedPath = points;
  }
  paths.originalPath = edge.points;
  return paths;
};
