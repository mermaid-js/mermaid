import { log } from '../logger.js';
import createLabel from './createLabel.js';
import { createText } from '../rendering-util/createText.js';
import { computeLabelTransform } from '../rendering-util/labelTransform.js';
import { line, curveBasis, select } from 'd3';
import type { CurveFactory } from 'd3';
import { getConfig } from '../diagram-api/diagramAPI.js';
import { getRequiredConfig } from '../diagram-api/requiredConfig.js';
import { getEffectiveHtmlLabels } from '../config.js';
import utils from '../utils.js';
import { requiredNode } from '../utils/guards.js';
import { getUrl } from '../diagrams/common/common.js';
import { getLineFunctionsWithOffset } from '../utils/lineWithOffset.js';
import { getSubGraphTitleMargins } from '../utils/subGraphTitleMargins.js';
import { addEdgeMarkers } from './edgeMarker.js';
import type { Graph } from 'dagre-d3-es/src/graphlib/index.js';
import type { SVG } from '../diagram-api/types.js';
import type { Bounds, D3Selection, EdgeData, Point } from '../types.js';
import type { ClusterInfo } from './mermaid-graphlib.js';

/**
 * The mutable edge object used by the (legacy) dagre-wrapper when rendering edges.
 *
 * See `GraphObjects.md` in this directory for a description of the properties.
 */
export interface Edge {
  id: string;
  label?: string;
  labelType?: string;
  labelStyle?: string;
  startLabelLeft?: string;
  startLabelRight?: string;
  endLabelLeft?: string;
  endLabelRight?: string;
  arrowTypeStart?: string;
  arrowTypeEnd?: string;
  style?: string;
  classes?: string;
  pattern?: string;
  thickness?: string;
  curve?: CurveFactory;
  points?: Point[];
  /** Id of the cluster that the edge (visually) points to. */
  toCluster?: string;
  /** Id of the cluster that the edge (visually) comes from. */
  fromCluster?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/** The paths that an edge was rendered with, returned by {@link insertEdge}. */
export interface Paths {
  updatedPath?: Point[];
  originalPath?: Point[];
}

type LabelElement = Awaited<ReturnType<typeof createLabel>>;

interface TerminalLabels {
  startLeft?: D3Selection<SVGGElement>;
  startRight?: D3Selection<SVGGElement>;
  endLeft?: D3Selection<SVGGElement>;
  endRight?: D3Selection<SVGGElement>;
}

let edgeLabels: Record<string, D3Selection<SVGGElement>> = {};
let terminalLabels: Record<string, TerminalLabels> = {};

/**
 * Returns a terminal label inserted earlier by {@link insertEdgeLabel},
 * throwing a descriptive error if the invariant is broken.
 */
const requiredTerminalLabel = (
  edgeId: string,
  side: keyof TerminalLabels
): D3Selection<SVGGElement> => {
  const el = terminalLabels[edgeId]?.[side];
  if (!el) {
    throw new Error(`Expected ${side} terminal label of edge "${edgeId}" to have been inserted`);
  }
  return el;
};

export const clear = () => {
  edgeLabels = {};
  terminalLabels = {};
};

export const insertEdgeLabel = async (elem: D3Selection<SVGGElement>, edge: Edge) => {
  const config = getConfig();
  const useHtmlLabels = getEffectiveHtmlLabels(config);

  // Create outer g, edgeLabel, this will be positioned after graph layout
  const edgeLabel = elem.insert('g').attr('class', 'edgeLabel');

  // Create inner g, label, this will be positioned now for centering the text
  const label = edgeLabel.insert('g').attr('class', 'label');

  // Create the actual text element
  const isMarkdown = edge.labelType === 'markdown';
  const labelElement = await createText(
    elem,
    edge.label,
    {
      style: edge.labelStyle,
      useHtmlLabels,
      // TODO: The old code only set addSvgBackground when using markdown, but
      // this function is only used by block diagrams which never use markdown.
      addSvgBackground: isMarkdown,
      isNode: false,
      markdown: isMarkdown,
      // If using markdown, wrap using default width
      width: isMarkdown ? undefined : Number.POSITIVE_INFINITY,
    },
    config
  );

  requiredNode(label, 'edge label group').appendChild(labelElement);

  let bbox = labelElement.getBBox();
  let transformBbox = bbox;
  if (useHtmlLabels) {
    const div = labelElement.children[0];
    const dv = select(labelElement);
    bbox = div.getBoundingClientRect();
    transformBbox = bbox;
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  } else {
    const textEl = select(labelElement).select<SVGTextElement>('text').node();
    if (textEl && typeof textEl.getBBox === 'function') {
      transformBbox = textEl.getBBox();
    }
  }
  label.attr('transform', computeLabelTransform(transformBbox, useHtmlLabels));

  // Make element accessible by id for positioning
  edgeLabels[edge.id] = edgeLabel;

  // Update the abstract data of the edge with the new information about its width and height
  edge.width = bbox.width;
  edge.height = bbox.height;

  let fo;
  if (edge.startLabelLeft) {
    // Create the actual text element
    const startEdgeLabelLeft = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = startEdgeLabelLeft.insert('g').attr('class', 'inner');
    const startLabelElement = await createLabel(inner, edge.startLabelLeft, edge.labelStyle);
    fo = startLabelElement;
    let slBox = startLabelElement.getBBox();
    if (useHtmlLabels) {
      const div = startLabelElement.children[0];
      const dv = select(startLabelElement);
      slBox = div.getBoundingClientRect();
      dv.attr('width', slBox.width);
      dv.attr('height', slBox.height);
    }
    inner.attr('transform', computeLabelTransform(slBox, useHtmlLabels));
    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].startLeft = startEdgeLabelLeft;
    setTerminalWidth(fo, edge.startLabelLeft);
  }
  if (edge.startLabelRight) {
    const startEdgeLabelRight = elem.insert('g').attr('class', 'edgeTerminals');
    const inner = startEdgeLabelRight.insert('g').attr('class', 'inner');
    const startLabelElement = await createLabel(inner, edge.startLabelRight, edge.labelStyle);
    fo = startLabelElement;
    let slBox = startLabelElement.getBBox();
    if (useHtmlLabels) {
      const div = startLabelElement.children[0];
      const dv = select(startLabelElement);
      slBox = div.getBoundingClientRect();
      dv.attr('width', slBox.width);
      dv.attr('height', slBox.height);
    }
    inner.attr('transform', computeLabelTransform(slBox, useHtmlLabels));

    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].startRight = startEdgeLabelRight;
    setTerminalWidth(fo, edge.startLabelRight);
  }
  if (edge.endLabelLeft) {
    const endEdgeLabelLeft = elem.insert('g').attr('class', 'edgeTerminals');
    // TODO: Remove? `inner` is not used
    const inner = endEdgeLabelLeft.insert('g').attr('class', 'inner');
    const endLabelElement = await createLabel(endEdgeLabelLeft, edge.endLabelLeft, edge.labelStyle);
    fo = endLabelElement;
    let slBox = endLabelElement.getBBox();
    if (useHtmlLabels) {
      const div = endLabelElement.children[0];
      const dv = select(endLabelElement);
      slBox = div.getBoundingClientRect();
      dv.attr('width', slBox.width);
      dv.attr('height', slBox.height);
    }
    inner.attr('transform', computeLabelTransform(slBox, useHtmlLabels));

    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].endLeft = endEdgeLabelLeft;
    setTerminalWidth(fo, edge.endLabelLeft);
  }
  if (edge.endLabelRight) {
    const endEdgeLabelRight = elem.insert('g').attr('class', 'edgeTerminals');
    // TODO: Remove? `inner` is not used
    const inner = endEdgeLabelRight.insert('g').attr('class', 'inner');
    const endLabelElement = await createLabel(
      endEdgeLabelRight,
      edge.endLabelRight,
      edge.labelStyle
    );
    fo = endLabelElement;
    let slBox = endLabelElement.getBBox();
    if (useHtmlLabels) {
      const div = endLabelElement.children[0];
      const dv = select(endLabelElement);
      slBox = div.getBoundingClientRect();
      dv.attr('width', slBox.width);
      dv.attr('height', slBox.height);
    }
    inner.attr('transform', computeLabelTransform(slBox, useHtmlLabels));

    if (!terminalLabels[edge.id]) {
      terminalLabels[edge.id] = {};
    }
    terminalLabels[edge.id].endRight = endEdgeLabelRight;
    setTerminalWidth(fo, edge.endLabelRight);
  }
  return labelElement;
};

function setTerminalWidth(fo: LabelElement | undefined, value: string) {
  if (getEffectiveHtmlLabels(getConfig()) && fo) {
    fo.style.width = value.length * 9 + 'px';
    fo.style.height = '12px';
  }
}

export const positionEdgeLabel = (
  edge: Pick<
    Edge,
    | 'id'
    | 'label'
    | 'x'
    | 'y'
    | 'startLabelLeft'
    | 'startLabelRight'
    | 'endLabelLeft'
    | 'endLabelRight'
    | 'arrowTypeStart'
    | 'arrowTypeEnd'
  >,
  paths: Paths
) => {
  log.debug('Moving label abc88 ', edge.id, edge.label, edgeLabels[edge.id], paths);
  const path = paths.updatedPath ? paths.updatedPath : paths.originalPath;
  const { subGraphTitleTotalMargin } = getSubGraphTitleMargins({
    flowchart: getRequiredConfig('flowchart'),
  });
  // edge.x and edge.y are set by the dagre layout before labels are positioned.
  const edgeX = edge.x!;
  const edgeY = edge.y!;
  if (edge.label) {
    const el = edgeLabels[edge.id];
    let x = edgeX;
    let y = edgeY;
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
    const el = requiredTerminalLabel(edge.id, 'startLeft');
    let x = edgeX;
    let y = edgeY;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(edge.arrowTypeStart ? 10 : 0, 'start_left', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
  if (edge.startLabelRight) {
    const el = requiredTerminalLabel(edge.id, 'startRight');
    let x = edgeX;
    let y = edgeY;
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
    const el = requiredTerminalLabel(edge.id, 'endLeft');
    let x = edgeX;
    let y = edgeY;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(edge.arrowTypeEnd ? 10 : 0, 'end_left', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
  if (edge.endLabelRight) {
    const el = requiredTerminalLabel(edge.id, 'endRight');
    let x = edgeX;
    let y = edgeY;
    if (path) {
      // debugger;
      const pos = utils.calcTerminalLabelPosition(edge.arrowTypeEnd ? 10 : 0, 'end_right', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
};

const outsideNode = (node: Bounds, point: Point) => {
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

export const intersection = (node: Bounds, outsidePoint: Point, insidePoint: Point): Point => {
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
    const q = insidePoint.y < outsidePoint.y ? outsidePoint.y - h - y : y - h - outsidePoint.y;
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
    const q = (Q * r) / R;
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
 * @returns Points
 */
const cutPathAtIntersect = (_points: Point[], boundaryNode: Bounds): Point[] => {
  log.debug('abc88 cutPathAtIntersect', _points, boundaryNode);
  const points: Point[] = [];
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

/**
 * Returns the positioned node of a cluster that an edge points to/from,
 * throwing a descriptive error if the cluster was never registered.
 */
const requiredClusterNode = (
  clusterDb: Record<string, ClusterInfo> | undefined,
  clusterId: string
): NonNullable<ClusterInfo['node']> => {
  const node = clusterDb?.[clusterId]?.node;
  if (!node) {
    throw new Error(`Expected cluster "${clusterId}" to have a positioned node`);
  }
  return node;
};

export const insertEdge = function (
  elem: D3Selection<SVGGElement>,
  e: { v: string; w: string; name?: string | number },
  edge: Edge,
  clusterDb: Record<string, ClusterInfo> | undefined,
  diagramType: string,
  graph: Graph,
  id: string
) {
  // edge.points is set by the dagre layout before edges are inserted.
  const originalPoints = edge.points!;
  let points = originalPoints;
  log.debug('abc88 InsertEdge: edge=', edge, 'e=', e);
  let pointsHasChanged = false;
  const tail = graph.node(e.v);
  const head = graph.node(e.w);

  if (head?.intersect && tail?.intersect) {
    points = points.slice(1, originalPoints.length - 1);
    points.unshift(tail.intersect(points[0]));
    points.push(head.intersect(points[points.length - 1]));
  }

  if (edge.toCluster) {
    log.debug('to cluster abc88', clusterDb?.[edge.toCluster]);
    points = cutPathAtIntersect(originalPoints, requiredClusterNode(clusterDb, edge.toCluster));

    pointsHasChanged = true;
  }

  if (edge.fromCluster) {
    log.debug('from cluster abc88', clusterDb?.[edge.fromCluster]);
    points = cutPathAtIntersect(
      points.reverse(),
      requiredClusterNode(clusterDb, edge.fromCluster)
    ).reverse();

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

  const { x, y } = getLineFunctionsWithOffset(
    edge as Pick<EdgeData, 'arrowTypeStart' | 'arrowTypeEnd'>
  );
  const lineFunction = line<Point>().x(x).y(y).curve(curve);

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
    .attr('style', edge.style ?? null);

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
  if (
    getRequiredConfig('flowchart').arrowMarkerAbsolute ||
    getRequiredConfig('state').arrowMarkerAbsolute
  ) {
    url = getUrl(true);
  }

  addEdgeMarkers(
    svgPath as unknown as SVG,
    edge as Pick<EdgeData, 'arrowTypeStart' | 'arrowTypeEnd'>,
    url,
    id,
    diagramType
  );

  const paths: Paths = {};
  if (pointsHasChanged) {
    paths.updatedPath = points;
  }
  paths.originalPath = edge.points;
  return paths;
};
