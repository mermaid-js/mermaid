import type { InternalHelpers, LayoutData, RenderOptions, SVG, SVGGroup } from 'mermaid';
// @ts-ignore TODO: Investigate D3 issue
import { curveLinear } from 'd3';
import ELK from 'elkjs/lib/elk.bundled.js';
import { type TreeData, findCommonAncestor } from './find-common-ancestor.js';

import {
  type P,
  type RectLike,
  outsideNode,
  computeNodeIntersection,
  replaceEndpoint,
  onBorder,
} from './geometry.js';

type Node = LayoutData['nodes'][number];

// Minimal structural type to avoid depending on d3 Selection typings
interface D3Selection<T extends Element> {
  node(): T | null;
  attr(name: string, value: string): D3Selection<T>;
}

interface LabelData {
  width: number;
  height: number;
  wrappingWidth?: number;
  labelNode?: SVGGElement | null;
}

interface NodeWithVertex extends Omit<Node, 'domId'> {
  children?: LayoutData['nodes'];
  labelData?: LabelData;
  domId?: D3Selection<SVGAElement | SVGGElement>;
}

export const render = async (
  data4Layout: LayoutData,
  svg: SVG,
  {
    common,
    getConfig,
    insertCluster,
    insertEdge,
    insertEdgeLabel,
    insertMarkers,
    insertNode,
    interpolateToCurve,
    labelHelper,
    log,
    positionEdgeLabel,
  }: InternalHelpers,
  { algorithm }: RenderOptions
) => {
  const nodeDb: Record<string, any> = {};
  const clusterDb: Record<string, any> = {};

  const addVertex = async (
    nodeEl: SVGGroup,
    graph: { children: NodeWithVertex[] },
    nodeArr: Node[],
    node: Node
  ) => {
    const labelData: LabelData = { width: 0, height: 0 };

    const config = getConfig();

    // Add the element to the DOM
    if (!node.isGroup) {
      // const child = node as NodeWithVertex;
      const child: NodeWithVertex = {
        id: node.id,
        width: node.width,
        height: node.height,
        // Store the original node data for later use
        label: node.label,
        isGroup: node.isGroup,
        shape: node.shape,
        padding: node.padding,
        cssClasses: node.cssClasses,
        cssStyles: node.cssStyles,
        look: node.look,
        // Include parentId for subgraph processing
        parentId: node.parentId,
      };
      graph.children.push(child);
      nodeDb[node.id] = node;

      const childNodeEl = await insertNode(nodeEl, node, { config, dir: node.dir });
      const boundingBox = childNodeEl.node()!.getBBox();
      // Store the domId separately for rendering, not in the ELK graph
      child.domId = childNodeEl;
      child.width = boundingBox.width;
      child.height = boundingBox.height;
    } else {
      // A subgraph
      const child: NodeWithVertex & { children: NodeWithVertex[] } = {
        ...node,
        domId: undefined,
        children: [],
      };
      // Let elk render with the copy
      graph.children.push(child);
      // Save the original containing the intersection function
      nodeDb[node.id] = child;
      await addVertices(nodeEl, nodeArr, child, node.id);

      if (node.label) {
        // @ts-ignore TODO: fix this
        const { shapeSvg, bbox } = await labelHelper(nodeEl, node, undefined, true);
        labelData.width = bbox.width;
        labelData.wrappingWidth = config.flowchart!.wrappingWidth;
        // Give some padding for elk
        labelData.height = bbox.height - 2;
        labelData.labelNode = shapeSvg.node();
        // We need the label hight to be able to size the subgraph;
        shapeSvg.remove();
      } else {
        // Subgraph without label
        labelData.width = 0;
        labelData.height = 0;
      }
      child.labelData = labelData;
      child.domId = nodeEl;
    }
  };

  const addVertices = async function (
    nodeEl: SVGGroup,
    nodeArr: Node[],
    graph: { children: NodeWithVertex[] },
    parentId?: string
  ) {
    const siblings = nodeArr.filter((node) => node?.parentId === parentId);
    log.info('addVertices APA12', siblings, parentId);
    // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
    await Promise.all(
      siblings.map(async (node) => {
        await addVertex(nodeEl, graph, nodeArr, node);
      })
    );
    return graph;
  };

  const drawNodes = async (
    relX: number,
    relY: number,
    nodeArray: any[],
    svg: any,
    subgraphsEl: SVGGroup,
    depth: number
  ) => {
    await Promise.all(
      nodeArray.map(async function (node: {
        id: string | number;
        x: any;
        y: any;
        width: number;
        labels: { width: any }[];
        height: number;
        isGroup: any;
        labelData: any;
        offset: { posX: number; posY: number };
        shape: any;
        domId: { node: () => any; attr: (arg0: string, arg1: string) => void };
      }) {
        if (node) {
          nodeDb[node.id] ??= {};
          nodeDb[node.id].offset = {
            posX: node.x + relX,
            posY: node.y + relY,
            x: relX,
            y: relY,
            depth,
            width: Math.max(node.width, node.labels ? node.labels[0]?.width || 0 : 0),
            height: node.height,
          };
          if (node.isGroup) {
            log.debug('Id abc88 subgraph = ', node.id, node.x, node.y, node.labelData);
            const subgraphEl = subgraphsEl.insert('g').attr('class', 'subgraph');
            // TODO use faster way of cloning
            const clusterNode = JSON.parse(JSON.stringify(node));
            clusterNode.x = node.offset.posX + node.width / 2;
            clusterNode.y = node.offset.posY + node.height / 2;
            clusterNode.width = Math.max(clusterNode.width, node.labelData.width);
            await insertCluster(subgraphEl, clusterNode);

            log.debug('Id (UIO)= ', node.id, node.width, node.shape, node.labels);
          } else {
            log.info(
              'Id NODE = ',
              node.id,
              node.x,
              node.y,
              relX,
              relY,
              node.domId.node(),
              `translate(${node.x + relX + node.width / 2}, ${node.y + relY + node.height / 2})`
            );
            node.domId.attr(
              'transform',
              `translate(${node.x + relX + node.width / 2}, ${node.y + relY + node.height / 2})`
            );
          }
        }
      })
    );

    await Promise.all(
      nodeArray.map(async function (node: { isGroup: any; x: any; y: any; children: any }) {
        if (node?.isGroup) {
          await drawNodes(relX + node.x, relY + node.y, node.children, svg, subgraphsEl, depth + 1);
        }
      })
    );
  };

  const addSubGraphs = (nodeArr: any[]): TreeData => {
    const parentLookupDb: TreeData = { parentById: {}, childrenById: {} };
    const subgraphs = nodeArr.filter((node: { isGroup: any }) => node.isGroup);
    log.info('Subgraphs - ', subgraphs);
    subgraphs.forEach((subgraph: { id: string }) => {
      const children = nodeArr.filter((node: { parentId: any }) => node.parentId === subgraph.id);
      children.forEach((node: any) => {
        parentLookupDb.parentById[node.id] = subgraph.id;
        if (parentLookupDb.childrenById[subgraph.id] === undefined) {
          parentLookupDb.childrenById[subgraph.id] = [];
        }
        parentLookupDb.childrenById[subgraph.id].push(node);
      });
    });

    return parentLookupDb;
  };

  const getEdgeStartEndPoint = (edge: any) => {
    // edge.start and edge.end are IDs (string/number) in our layout data
    const sourceId: string | number = edge.start;
    const targetId: string | number = edge.end;

    const source = sourceId;
    const target = targetId;

    const startNode = nodeDb[sourceId];
    const endNode = nodeDb[targetId];

    if (!startNode || !endNode) {
      return { source, target };
    }

    // Add the edge to the graph
    return { source, target, sourceId, targetId };
  };

  const calcOffset = function (src: string, dest: string, parentLookupDb: TreeData) {
    const ancestor = findCommonAncestor(src, dest, parentLookupDb);
    if (ancestor === undefined || ancestor === 'root') {
      return { x: 0, y: 0 };
    }

    const ancestorOffset = nodeDb[ancestor].offset;
    return { x: ancestorOffset.posX, y: ancestorOffset.posY };
  };

  /**
   * Add edges to graph based on parsed graph definition
   */
  // Edge helper maps and utilities (de-duplicated)
  const ARROW_MAP: Record<string, [string, string]> = {
    arrow_open: ['arrow_open', 'arrow_open'],
    arrow_cross: ['arrow_open', 'arrow_cross'],
    double_arrow_cross: ['arrow_cross', 'arrow_cross'],
    arrow_point: ['arrow_open', 'arrow_point'],
    double_arrow_point: ['arrow_point', 'arrow_point'],
    arrow_circle: ['arrow_open', 'arrow_circle'],
    double_arrow_circle: ['arrow_circle', 'arrow_circle'],
  };

  const computeStroke = (
    stroke: string | undefined,
    defaultStyle?: string,
    defaultLabelStyle?: string
  ) => {
    // Defaults correspond to 'normal'
    let thickness = 'normal';
    let pattern = 'solid';
    let style = '';
    let labelStyle = '';

    if (stroke === 'dotted') {
      pattern = 'dotted';
      style = 'fill:none;stroke-width:2px;stroke-dasharray:3;';
    } else if (stroke === 'thick') {
      thickness = 'thick';
      style = 'stroke-width: 3.5px;fill:none;';
    } else {
      // normal
      style = defaultStyle ?? 'fill:none;';
      if (defaultLabelStyle !== undefined) {
        labelStyle = defaultLabelStyle;
      }
    }
    return { thickness, pattern, style, labelStyle };
  };

  const getCurve = (edgeInterpolate: any, edgesDefaultInterpolate: any, confCurve: any) => {
    if (edgeInterpolate !== undefined) {
      return interpolateToCurve(edgeInterpolate, curveLinear);
    }
    if (edgesDefaultInterpolate !== undefined) {
      return interpolateToCurve(edgesDefaultInterpolate, curveLinear);
    }
    // @ts-ignore TODO: fix this
    return interpolateToCurve(confCurve, curveLinear);
  };
  const buildEdgeData = (
    edge: any,
    defaults: {
      defaultStyle?: string;
      defaultLabelStyle?: string;
      defaultInterpolate?: any;
      confCurve: any;
    },
    common: any
  ) => {
    const edgeData: any = { style: '', labelStyle: '' };
    edgeData.minlen = edge.length || 1;
    // maintain legacy behavior
    edge.text = edge.label;

    // Arrowhead fill vs none
    edgeData.arrowhead = edge.type === 'arrow_open' ? 'none' : 'normal';

    // Arrow types
    const arrowMap = ARROW_MAP[edge.type] ?? ARROW_MAP.arrow_open;
    edgeData.arrowTypeStart = arrowMap[0];
    edgeData.arrowTypeEnd = arrowMap[1];

    // Optional edge label positioning flags
    edgeData.startLabelRight = edge.startLabelRight;
    edgeData.endLabelLeft = edge.endLabelLeft;

    // Stroke
    const strokeRes = computeStroke(edge.stroke, defaults.defaultStyle, defaults.defaultLabelStyle);
    edgeData.thickness = strokeRes.thickness;
    edgeData.pattern = strokeRes.pattern;
    edgeData.style = (edgeData.style || '') + (strokeRes.style || '');
    edgeData.labelStyle = (edgeData.labelStyle || '') + (strokeRes.labelStyle || '');

    // Curve
    // @ts-ignore - defaults.confCurve is present at runtime but missing in type
    edgeData.curve = getCurve(edge.interpolate, defaults.defaultInterpolate, defaults.confCurve);

    // Arrowhead style + labelpos when we have label text
    const hasText = (edge?.text ?? '') !== '';
    if (hasText) {
      edgeData.arrowheadStyle = 'fill: #333';
      edgeData.labelpos = 'c';
    } else if (edge.style !== undefined) {
      edgeData.arrowheadStyle = 'fill: #333';
    }

    edgeData.labelType = edge.labelType;
    edgeData.label = (edge?.text ?? '').replace(common.lineBreakRegex, '\n');

    if (edge.style === undefined) {
      edgeData.style = edgeData.style ?? 'stroke: #333; stroke-width: 1.5px;fill:none;';
    }

    edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');
    return edgeData;
  };

  const addEdges = async function (
    dataForLayout: { edges: any; direction?: string },
    graph: {
      id?: string;
      layoutOptions?: {
        'elk.hierarchyHandling': string;
        'elk.algorithm': any;
        'nodePlacement.strategy': any;
        'elk.layered.mergeEdges': any;
        'elk.direction': string;
        'spacing.baseValue': number;
      };
      children?: never[];
      edges: any;
    },
    svg: SVG
  ) {
    log.info('abc78 DAGA edges = ', dataForLayout);
    const edges = dataForLayout.edges;
    const labelsEl = svg.insert('g').attr('class', 'edgeLabels');
    const linkIdCnt: any = {};
    let defaultStyle: string | undefined;
    let defaultLabelStyle: string | undefined;

    await Promise.all(
      edges.map(async function (edge: {
        id: string;
        start: string;
        end: string;
        length: number;
        text: undefined;
        label: any;
        type: string;
        stroke: any;
        interpolate: undefined;
        style: undefined;
        labelType: any;
        startLabelRight?: string;
        endLabelLeft?: string;
      }) {
        // Identify Link
        const linkIdBase = edge.id; // 'L-' + edge.start + '-' + edge.end;
        // count the links from+to the same node to give unique id
        if (linkIdCnt[linkIdBase] === undefined) {
          linkIdCnt[linkIdBase] = 0;
          log.info('abc78 new entry', linkIdBase, linkIdCnt[linkIdBase]);
        } else {
          linkIdCnt[linkIdBase]++;
          log.info('abc78 new entry', linkIdBase, linkIdCnt[linkIdBase]);
        }
        const linkId = linkIdBase; // + '_' + linkIdCnt[linkIdBase];
        edge.id = linkId;
        log.info('abc78 new link id to be used is', linkIdBase, linkId, linkIdCnt[linkIdBase]);
        const linkNameStart = 'LS_' + edge.start;
        const linkNameEnd = 'LE_' + edge.end;

        const conf = getConfig();
        const edgeData = buildEdgeData(
          edge,
          {
            defaultStyle,
            defaultLabelStyle,
            defaultInterpolate: edges.defaultInterpolate,
            // @ts-ignore - conf.curve exists at runtime but is missing from typing
            confCurve: conf.curve,
          },
          common
        );

        edgeData.id = linkId;
        edgeData.classes = 'flowchart-link ' + linkNameStart + ' ' + linkNameEnd;

        const labelEl = await insertEdgeLabel(labelsEl, edgeData);

        // calculate start and end points of the edge, note that the source and target
        // can be modified for shapes that have ports

        const { source, target, sourceId, targetId } = getEdgeStartEndPoint(edge);
        log.debug('abc78 source and target', source, target);
        // Add the edge to the graph
        graph.edges.push({
          ...edge,
          sources: [source],
          targets: [target],
          sourceId,
          targetId,
          labelEl: labelEl,
          labels: [
            {
              width: edgeData.width,
              height: edgeData.height,
              orgWidth: edgeData.width,
              orgHeight: edgeData.height,
              text: edgeData.label,
              layoutOptions: {
                'edgeLabels.inline': 'true',
                'edgeLabels.placement': 'CENTER',
              },
            },
          ],
          edgeData,
        });
      })
    );
    return graph;
  };

  function dir2ElkDirection(dir: any) {
    switch (dir) {
      case 'LR':
        return 'RIGHT';
      case 'RL':
        return 'LEFT';
      case 'TB':
      case 'TD': // TD is an alias for TB in Mermaid
        return 'DOWN';
      case 'BT':
        return 'UP';
      default:
        return 'DOWN';
    }
  }

  function setIncludeChildrenPolicy(nodeId: string, ancestorId: string) {
    const node = nodeDb[nodeId];

    if (!node) {
      return;
    }
    if (node?.layoutOptions === undefined) {
      node.layoutOptions = {};
    }
    node.layoutOptions['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
    if (node.id !== ancestorId) {
      setIncludeChildrenPolicy(node.parentId, ancestorId);
    }
  }

  // Node bounds helpers (global)
  const getEffectiveGroupWidth = (node: any): number => {
    const labelW = node?.labels?.[0]?.width ?? 0;
    const padding = node?.padding ?? 0;
    return Math.max(node.width ?? 0, labelW + padding);
  };

  const boundsFor = (node: any): RectLike => {
    const width = node?.isGroup ? getEffectiveGroupWidth(node) : node.width;
    return {
      x: node.offset.posX + node.width / 2,
      y: node.offset.posY + node.height / 2,
      width,
      height: node.height,
      padding: node.padding,
    };
  };
  // Helper utilities for endpoint handling around cutter2
  type Side = 'start' | 'end';
  const approxEq = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;
  const isCenterApprox = (pt: P, node: { x: number; y: number }) =>
    approxEq(pt.x, node.x) && approxEq(pt.y, node.y);

  const getCandidateBorderPoint = (
    points: P[],
    node: any,
    side: Side
  ): { candidate: P; centerApprox: boolean } => {
    if (!points?.length) {
      return { candidate: { x: node.x, y: node.y } as P, centerApprox: true };
    }
    if (side === 'start') {
      const first = points[0];
      const centerApprox = isCenterApprox(first, node);
      const candidate = centerApprox && points.length > 1 ? points[1] : first;
      return { candidate, centerApprox };
    } else {
      const last = points[points.length - 1];
      const centerApprox = isCenterApprox(last, node);
      const candidate = centerApprox && points.length > 1 ? points[points.length - 2] : last;
      return { candidate, centerApprox };
    }
  };

  const dropAutoCenterPoint = (points: P[], side: Side, doDrop: boolean) => {
    if (!doDrop) {
      return;
    }
    if (side === 'start') {
      if (points.length > 0) {
        points.shift();
      }
    } else {
      if (points.length > 0) {
        points.pop();
      }
    }
  };

  const applyStartIntersectionIfNeeded = (points: P[], startNode: any, startBounds: RectLike) => {
    let firstOutsideStartIndex = -1;
    for (const [i, p] of points.entries()) {
      if (outsideNode(startBounds, p)) {
        firstOutsideStartIndex = i;
        break;
      }
    }
    if (firstOutsideStartIndex !== -1) {
      const outsidePointForStart = points[firstOutsideStartIndex];
      const startCenter = points[0];
      const startIntersection = computeNodeIntersection(
        startNode,
        startBounds,
        outsidePointForStart,
        startCenter
      );
      replaceEndpoint(points, 'start', startIntersection);
      log.debug('UIO cutter2: start-only intersection applied', { startIntersection });
    }
  };

  const applyEndIntersectionIfNeeded = (points: P[], endNode: any, endBounds: RectLike) => {
    let outsideIndexForEnd = -1;
    for (let i = points.length - 1; i >= 0; i--) {
      if (outsideNode(endBounds, points[i])) {
        outsideIndexForEnd = i;
        break;
      }
    }
    if (outsideIndexForEnd !== -1) {
      const outsidePointForEnd = points[outsideIndexForEnd];
      const endCenter = points[points.length - 1];
      const endIntersection = computeNodeIntersection(
        endNode,
        endBounds,
        outsidePointForEnd,
        endCenter
      );
      replaceEndpoint(points, 'end', endIntersection);
      log.debug('UIO cutter2: end-only intersection applied', { endIntersection });
    }
  };

  const cutter2 = (startNode: any, endNode: any, _points: any[]) => {
    const startBounds = boundsFor(startNode);
    const endBounds = boundsFor(endNode);

    if (_points.length === 0) {
      return [];
    }

    // Copy the original points array
    const points: P[] = [..._points] as P[];

    // The first point is the center of sNode, the last point is the center of eNode
    const startCenter = points[0];
    const endCenter = points[points.length - 1];

    // Minimal, structured logging for diagnostics
    log.debug('PPP cutter2: bounds', { startBounds, endBounds });
    log.debug('PPP cutter2: original points', _points);

    let firstOutsideStartIndex = -1;

    // Single iteration through the array
    for (const [i, point] of points.entries()) {
      if (firstOutsideStartIndex === -1 && outsideNode(startBounds, point)) {
        firstOutsideStartIndex = i;
      }
      if (outsideNode(endBounds, point)) {
        // keep scanning; we'll also scan from the end for the last outside point
      }
    }

    // Calculate intersection with start node if we found a point outside it
    if (firstOutsideStartIndex !== -1) {
      const outsidePointForStart = points[firstOutsideStartIndex];
      const startIntersection = computeNodeIntersection(
        startNode,
        startBounds,
        outsidePointForStart,
        startCenter
      );
      log.debug('UIO cutter2: start intersection', startIntersection);
      replaceEndpoint(points, 'start', startIntersection);
    }

    // Calculate intersection with end node
    let outsidePointForEnd = null;
    let outsideIndexForEnd = -1;

    for (let i = points.length - 1; i >= 0; i--) {
      if (outsideNode(endBounds, points[i])) {
        outsidePointForEnd = points[i];
        outsideIndexForEnd = i;
        break;
      }
    }

    if (!outsidePointForEnd && points.length > 1) {
      outsidePointForEnd = points[points.length - 2];
      outsideIndexForEnd = points.length - 2;
    }

    if (outsidePointForEnd) {
      const endIntersection = computeNodeIntersection(
        endNode,
        endBounds,
        outsidePointForEnd,
        endCenter
      );
      log.debug('UIO cutter2: end intersection', { endIntersection, outsideIndexForEnd });
      replaceEndpoint(points, 'end', endIntersection);
    }

    // Final cleanup: Check if the last point is too close to the previous point
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      const secondLastPoint = points[points.length - 2];
      const distance = Math.sqrt(
        (lastPoint.x - secondLastPoint.x) ** 2 + (lastPoint.y - secondLastPoint.y) ** 2
      );
      if (distance < 2) {
        log.debug('UIO cutter2: trimming tail point (too close)', {
          distance,
          lastPoint,
          secondLastPoint,
        });
        points.pop();
      }
    }

    log.debug('UIO cutter2: final points', points);

    return points;
  };

  // @ts-ignore - ELK is not typed
  const elk = new ELK();
  const element = svg.select('g');
  // Add the arrowheads to the svg
  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);

  // Setup the graph with the layout options and the data for the layout
  let elkGraph: any = {
    id: 'root',
    layoutOptions: {
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.algorithm': algorithm,
      'nodePlacement.strategy': data4Layout.config.elk?.nodePlacementStrategy,
      'elk.layered.mergeEdges': data4Layout.config.elk?.mergeEdges,
      'elk.direction': 'DOWN',
      'spacing.baseValue': 40,
      'elk.layered.crossingMinimization.forceNodeModelOrder':
        data4Layout.config.elk?.forceNodeModelOrder,
      'elk.layered.considerModelOrder.strategy': data4Layout.config.elk?.considerModelOrder,
      'elk.layered.unnecessaryBendpoints': true,
      'elk.layered.cycleBreaking.strategy': data4Layout.config.elk?.cycleBreakingStrategy,

      // 'elk.layered.cycleBreaking.strategy': 'GREEDY_MODEL_ORDER',
      // 'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
      // 'spacing.nodeNode': 20,
      // 'spacing.nodeNodeBetweenLayers': 25,
      // 'spacing.edgeNode': 20,
      // 'spacing.edgeNodeBetweenLayers': 10,
      // 'spacing.edgeEdge': 10,
      // 'spacing.edgeEdgeBetweenLayers': 20,
      // 'spacing.nodeSelfLoop': 20,

      // Tweaking options
      // 'nodePlacement.favorStraightEdges': true,
      // 'elk.layered.nodePlacement.favorStraightEdges': true,
      // 'nodePlacement.feedbackEdges': true,
      'elk.layered.wrapping.multiEdge.improveCuts': true,
      'elk.layered.wrapping.multiEdge.improveWrappedEdges': true,
      // 'elk.layered.wrapping.strategy': 'MULTI_EDGE',
      // 'elk.layered.wrapping.strategy': 'SINGLE_EDGE',
      'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
      'elk.layered.mergeHierarchyEdges': true,

      // 'elk.layered.feedbackEdges': true,
      // 'elk.layered.crossingMinimization.semiInteractive': true,
      // 'elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor': 1,
      // 'elk.layered.edgeRouting.polyline.slopedEdgeZoneWidth': 4.0,
      // 'elk.layered.wrapping.validify.strategy': 'LOOK_BACK',
      // 'elk.insideSelfLoops.activate': true,
      // 'elk.separateConnectedComponents': true,
      // 'elk.alg.layered.options.EdgeStraighteningStrategy': 'NONE',
      // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES', // NODES_AND_EDGES
      // 'elk.layered.considerModelOrder.strategy': 'EDGES', // NODES_AND_EDGES
      // 'elk.layered.wrapping.cutting.strategy': 'ARD', // NODES_AND_EDGES
    },
    children: [],
    edges: [],
  };

  log.info('Drawing flowchart using v4 renderer', elk);

  // Set the direction of the graph based on the parsed information
  const dir = data4Layout.direction ?? 'DOWN';
  elkGraph.layoutOptions['elk.direction'] = dir2ElkDirection(dir);

  // Create the lookup db for the subgraphs and their children to used when creating
  // the tree structured graph
  const parentLookupDb: any = addSubGraphs(data4Layout.nodes);

  // Add elements in the svg to be used to hold the subgraphs container
  // elements and the nodes
  const subGraphsEl = svg.insert('g').attr('class', 'subgraphs');

  const nodeEl = svg.insert('g').attr('class', 'nodes');

  // Add the nodes to the graph, this will entail creating the actual nodes
  // in order to get the size of the node. You can't get the size of a node
  // that is not in the dom so we need to add it to the dom, get the size
  // we will position the nodes when we get the layout from elkjs
  elkGraph = await addVertices(nodeEl, data4Layout.nodes, elkGraph);
  // Time for the edges, we start with adding an element in the node to hold the edges
  const edgesEl = svg.insert('g').attr('class', 'edges edgePaths');

  // Add the edges to the elk graph, this will entail creating the actual edges
  elkGraph = await addEdges(data4Layout, elkGraph, svg);

  // Iterate through all nodes and add the top level nodes to the graph
  const nodes = data4Layout.nodes;
  nodes.forEach((n: { id: string | number }) => {
    const node = nodeDb[n.id];

    // Subgraph
    if (parentLookupDb.childrenById[node.id] !== undefined) {
      // Set label and adjust node width separately (avoid side effects in labels array)
      node.labels = [
        {
          text: node.label,
          width: node?.labelData?.width ?? 50,
          height: node?.labelData?.height ?? 50,
        },
      ];
      node.width = node.width + 2 * node.padding;
      log.debug('UIO node label', node?.labelData?.width, node.padding);
      node.layoutOptions = {
        'spacing.baseValue': 30,
        'nodeLabels.placement': '[H_CENTER V_TOP, INSIDE]',
      };
      if (node.dir) {
        node.layoutOptions = {
          ...node.layoutOptions,
          'elk.algorithm': algorithm,
          'elk.direction': dir2ElkDirection(node.dir),
          'nodePlacement.strategy': data4Layout.config.elk?.nodePlacementStrategy,
          'elk.layered.mergeEdges': data4Layout.config.elk?.mergeEdges,
          'elk.hierarchyHandling': 'SEPARATE_CHILDREN',
        };
      }
      delete node.x;
      delete node.y;
      delete node.width;
      delete node.height;
    }
  });
  log.debug('APA01 processing edges, count:', elkGraph.edges.length);
  elkGraph.edges.forEach((edge: any, index: number) => {
    log.debug('APA01 processing edge', index, ':', edge);
    const source = edge.sources[0];
    const target = edge.targets[0];
    log.debug('APA01 source:', source, 'target:', target);
    log.debug('APA01 nodeDb[source]:', nodeDb[source]);
    log.debug('APA01 nodeDb[target]:', nodeDb[target]);

    if (nodeDb[source] && nodeDb[target] && nodeDb[source].parentId !== nodeDb[target].parentId) {
      const ancestorId = findCommonAncestor(source, target, parentLookupDb);
      // an edge that breaks a subgraph has been identified, set configuration accordingly
      setIncludeChildrenPolicy(source, ancestorId);
      setIncludeChildrenPolicy(target, ancestorId);
    }
  });

  log.debug('APA01 before');
  log.debug('APA01 elkGraph structure:', JSON.stringify(elkGraph, null, 2));
  log.debug('APA01 elkGraph.children length:', elkGraph.children?.length);
  log.debug('APA01 elkGraph.edges length:', elkGraph.edges?.length);

  // Validate that all edge references exist as nodes
  elkGraph.edges?.forEach((edge: any, index: number) => {
    log.debug(`APA01 validating edge ${index}:`, edge);
    if (edge.sources) {
      edge.sources.forEach((sourceId: any) => {
        const sourceExists = elkGraph.children?.some((child: any) => child.id === sourceId);
        log.debug(`APA01 source ${sourceId} exists:`, sourceExists);
      });
    }
    if (edge.targets) {
      edge.targets.forEach((targetId: any) => {
        const targetExists = elkGraph.children?.some((child: any) => child.id === targetId);
        log.debug(`APA01 target ${targetId} exists:`, targetExists);
      });
    }
  });

  let g;
  try {
    g = await elk.layout(elkGraph);
    log.debug('APA01 after - success');
    log.info('APA01 layout result:', JSON.stringify(g, null, 2));
  } catch (error) {
    log.error('APA01 ELK layout error:', error);
    log.error('APA01 elkGraph that caused error:', JSON.stringify(elkGraph, null, 2));
    throw error;
  }

  // debugger;
  await drawNodes(0, 0, g.children, svg, subGraphsEl, 0);

  g.edges?.map(
    (edge: {
      sources: (string | number)[];
      targets: (string | number)[];
      start: any;
      end: any;
      sections: { startPoint: any; endPoint: any; bendPoints: any }[];
      points: any[];
      x: any;
      labels: { height: number; width: number; x: number; y: number }[];
      y: any;
    }) => {
      // (elem, edge, clusterDb, diagramType, graph, id)
      const startNode = nodeDb[edge.sources[0]];
      const startCluster = parentLookupDb[edge.sources[0]];
      const endNode = nodeDb[edge.targets[0]];
      const sourceId = edge.start;
      const targetId = edge.end;

      const offset = calcOffset(sourceId, targetId, parentLookupDb);
      log.debug(
        'APA18 offset',
        offset,
        sourceId,
        ' ==> ',
        targetId,
        'edge:',
        edge,
        'cluster:',
        startCluster,
        startNode
      );
      if (edge.sections) {
        const src = edge.sections[0].startPoint;
        const dest = edge.sections[0].endPoint;
        const segments = edge.sections[0].bendPoints ? edge.sections[0].bendPoints : [];

        const segPoints = segments.map((segment: { x: any; y: any }) => {
          return { x: segment.x + offset.x, y: segment.y + offset.y };
        });
        edge.points = [
          { x: src.x + offset.x, y: src.y + offset.y },
          ...segPoints,
          { x: dest.x + offset.x, y: dest.y + offset.y },
        ];

        let sw = startNode.width;
        let ew = endNode.width;
        if (startNode.isGroup) {
          const bbox = startNode.domId.node().getBBox();
          // sw = Math.max(bbox.width, startNode.width, startNode.labels[0].width);
          sw = Math.max(startNode.width, startNode.labels[0].width + startNode.padding);
          // sw = startNode.width;
          log.info(
            'UIO width',
            startNode.id,
            startNode.width,
            'bbox.width=',
            bbox.width,
            'lw=',
            startNode.labels[0].width,
            'node:',
            startNode.width,
            'SW = ',
            sw
            // 'HTML:',
            // startNode.domId.node().innerHTML
          );
        }
        if (endNode.isGroup) {
          const bbox = endNode.domId.node().getBBox();
          ew = Math.max(endNode.width, endNode.labels[0].width + endNode.padding);

          log.debug(
            'UIO width',
            startNode.id,
            startNode.width,
            bbox.width,
            'EW = ',
            ew,
            'HTML:',
            startNode.innerHTML
          );
        }
        startNode.x = startNode.offset.posX + startNode.width / 2;
        startNode.y = startNode.offset.posY + startNode.height / 2;
        endNode.x = endNode.offset.posX + endNode.width / 2;
        endNode.y = endNode.offset.posY + endNode.height / 2;

        // Only add center points for non-subgraph nodes or when the edge path doesn't already end near the target
        const shouldAddStartCenter = startNode.shape !== 'rect33';
        const shouldAddEndCenter = endNode.shape !== 'rect33';

        if (shouldAddStartCenter) {
          edge.points.unshift({
            x: startNode.x,
            y: startNode.y,
          });
        }

        if (shouldAddEndCenter) {
          edge.points.push({
            x: endNode.x,
            y: endNode.y,
          });
        }

        // Debug and sanitize points around cutter2
        const prevPoints = Array.isArray(edge.points) ? [...edge.points] : [];
        const endBounds = boundsFor(endNode);
        log.debug(
          'PPP cutter2: Points before cutter2:',
          JSON.stringify(edge.points),
          'endBounds:',
          endBounds,
          onBorder(endBounds, edge.points[edge.points.length - 1])
        );
        // Block for reducing variable scope and guardrails for the cutter function
        {
          const startBounds = boundsFor(startNode);
          const endBounds = boundsFor(endNode);

          const startIsGroup = !!startNode?.isGroup;
          const endIsGroup = !!endNode?.isGroup;

          const { candidate: startCandidate, centerApprox: startCenterApprox } =
            getCandidateBorderPoint(prevPoints as P[], startNode, 'start');
          const { candidate: endCandidate, centerApprox: endCenterApprox } =
            getCandidateBorderPoint(prevPoints as P[], endNode, 'end');

          const skipStart = startIsGroup && onBorder(startBounds, startCandidate);
          const skipEnd = endIsGroup && onBorder(endBounds, endCandidate);

          dropAutoCenterPoint(prevPoints as P[], 'start', skipStart && startCenterApprox);
          dropAutoCenterPoint(prevPoints as P[], 'end', skipEnd && endCenterApprox);

          if (skipStart || skipEnd) {
            if (!skipStart) {
              applyStartIntersectionIfNeeded(prevPoints as P[], startNode, startBounds);
            }
            if (!skipEnd) {
              applyEndIntersectionIfNeeded(prevPoints as P[], endNode, endBounds);
            }

            log.debug('PPP cutter2: skipping cutter2 due to on-border group endpoint(s)', {
              skipStart,
              skipEnd,
              startCenterApprox,
              endCenterApprox,
              startCandidate,
              endCandidate,
            });
            edge.points = prevPoints;
          } else {
            edge.points = cutter2(startNode, endNode, prevPoints);
          }
        }
        log.debug('PPP cutter2: Points after cutter2:', JSON.stringify(edge.points));
        const hasNaN = (pts: { x: number; y: number }[]) =>
          pts?.some((p) => !Number.isFinite(p?.x) || !Number.isFinite(p?.y));
        if (!Array.isArray(edge.points) || edge.points.length < 2 || hasNaN(edge.points)) {
          log.warn(
            'POI cutter2: Invalid points from cutter2, falling back to prevPoints',
            edge.points
          );
          // Fallback to previous points and strip any invalid ones just in case
          const cleaned = prevPoints.filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
          edge.points = cleaned.length >= 2 ? cleaned : prevPoints;
        }
        log.debug('UIO cutter2: Points after cutter2 (sanitized):', edge.points);
        // Remove consecutive duplicate points to avoid zero-length segments in path builders
        const deduped = edge.points.filter(
          (p: { x: number; y: number }, i: number, arr: { x: number; y: number }[]) => {
            if (i === 0) {
              return true;
            }
            const prev = arr[i - 1];
            return Math.abs(p.x - prev.x) > 1e-6 || Math.abs(p.y - prev.y) > 1e-6;
          }
        );
        if (deduped.length !== edge.points.length) {
          log.debug('UIO cutter2: removed consecutive duplicate points', {
            before: edge.points,
            after: deduped,
          });
        }
        edge.points = deduped;
        const paths = insertEdge(
          edgesEl,
          edge,
          clusterDb,
          data4Layout.type,
          startNode,
          endNode,
          data4Layout.diagramId,
          true
        );
        log.info('APA12 edge points after insert', JSON.stringify(edge.points));

        edge.x = edge.labels[0].x + offset.x + edge.labels[0].width / 2;
        edge.y = edge.labels[0].y + offset.y + edge.labels[0].height / 2;
        positionEdgeLabel(edge, paths);
      }
    }
  );
};
