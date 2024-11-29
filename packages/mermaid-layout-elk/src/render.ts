import { curveLinear } from 'd3';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { InternalHelpers, LayoutData, RenderOptions, SVG, SVGGroup } from 'mermaid';
import { type TreeData, findCommonAncestor } from './find-common-ancestor.js';

type Node = LayoutData['nodes'][number];
// Used to calculate distances in order to avoid floating number rounding issues when comparing floating numbers
const epsilon = 0.0001;
interface LabelData {
  width: number;
  height: number;
  wrappingWidth?: number;
  labelNode?: SVGGElement | null;
}

interface NodeWithVertex extends Omit<Node, 'domId'> {
  children?: unknown[];
  labelData?: LabelData;
  domId?: Node['domId'] | SVGGroup | d3.Selection<SVGAElement, unknown, Element | null, unknown>;
}
interface Point {
  x: number;
  y: number;
}
function distance(p1?: Point, p2?: Point): number {
  if (!p1 || !p2) {
    return 0;
  }
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
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
      const child: NodeWithVertex = {
        ...node,
      };
      graph.children.push(child);
      nodeDb[node.id] = child;

      const childNodeEl = await insertNode(nodeEl, node, { config, dir: node.dir });
      const boundingBox = childNodeEl.node()!.getBBox();
      child.domId = childNodeEl;
      child.calcIntersect = node.calcIntersect;
      child.width = boundingBox.width;
      child.height = boundingBox.height;
    } else {
      // A subgraph
      const child: NodeWithVertex & { children: NodeWithVertex[] } = {
        ...node,
        children: [],
      };
      graph.children.push(child);
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
          nodeDb[node.id] = node;
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

    subgraphs.forEach(function (subgraph: { id: string | number }) {
      const data: any = { id: subgraph.id };
      if (parentLookupDb.parentById[subgraph.id] !== undefined) {
        data.parent = parentLookupDb.parentById[subgraph.id];
      }
    });
    return parentLookupDb;
  };

  const getEdgeStartEndPoint = (edge: any) => {
    const source: any = edge.start;
    const target: any = edge.end;

    // Save the original source and target
    const sourceId = source;
    const targetId = target;

    const startNode = nodeDb[edge.start.id];
    const endNode = nodeDb[edge.end.id];

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
    const dir = dataForLayout.direction || 'DOWN';
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
        const linkId = linkIdBase + '_' + linkIdCnt[linkIdBase];
        edge.id = linkId;
        log.info('abc78 new link id to be used is', linkIdBase, linkId, linkIdCnt[linkIdBase]);
        const linkNameStart = 'LS_' + edge.start;
        const linkNameEnd = 'LE_' + edge.end;

        const edgeData: any = { style: '', labelStyle: '' };
        edgeData.minlen = edge.length || 1;
        edge.text = edge.label;
        // Set link type for rendering
        if (edge.type === 'arrow_open') {
          edgeData.arrowhead = 'none';
        } else {
          edgeData.arrowhead = 'normal';
        }

        // Check of arrow types, placed here in order not to break old rendering
        edgeData.arrowTypeStart = 'arrow_open';
        edgeData.arrowTypeEnd = 'arrow_open';

        /* eslint-disable no-fallthrough */
        switch (edge.type) {
          case 'double_arrow_cross':
            edgeData.arrowTypeStart = 'arrow_cross';
          case 'arrow_cross':
            edgeData.arrowTypeEnd = 'arrow_cross';
            break;
          case 'double_arrow_point':
            edgeData.arrowTypeStart = 'arrow_point';
          case 'arrow_point':
            edgeData.arrowTypeEnd = 'arrow_point';
            break;
          case 'double_arrow_circle':
            edgeData.arrowTypeStart = 'arrow_circle';
          case 'arrow_circle':
            edgeData.arrowTypeEnd = 'arrow_circle';
            break;
        }

        let style = '';
        let labelStyle = '';

        edgeData.startLabelRight = edge.startLabelRight;
        edgeData.endLabelLeft = edge.endLabelLeft;

        switch (edge.stroke) {
          case 'normal':
            style = 'fill:none;';
            if (defaultStyle !== undefined) {
              style = defaultStyle;
            }
            if (defaultLabelStyle !== undefined) {
              labelStyle = defaultLabelStyle;
            }
            edgeData.thickness = 'normal';
            edgeData.pattern = 'solid';
            break;
          case 'dotted':
            edgeData.thickness = 'normal';
            edgeData.pattern = 'dotted';
            edgeData.style = 'fill:none;stroke-width:2px;stroke-dasharray:3;';
            break;
          case 'thick':
            edgeData.thickness = 'thick';
            edgeData.pattern = 'solid';
            edgeData.style = 'stroke-width: 3.5px;fill:none;';
            break;
        }

        edgeData.style = edgeData.style += style;
        edgeData.labelStyle = edgeData.labelStyle += labelStyle;

        const conf = getConfig();
        if (edge.interpolate !== undefined) {
          edgeData.curve = interpolateToCurve(edge.interpolate, curveLinear);
        } else if (edges.defaultInterpolate !== undefined) {
          edgeData.curve = interpolateToCurve(edges.defaultInterpolate, curveLinear);
        } else {
          // @ts-ignore TODO: fix this
          edgeData.curve = interpolateToCurve(conf.curve, curveLinear);
        }

        if (edge.text === undefined) {
          if (edge.style !== undefined) {
            edgeData.arrowheadStyle = 'fill: #333';
          }
        } else {
          edgeData.arrowheadStyle = 'fill: #333';
          edgeData.labelpos = 'c';
        }

        edgeData.labelType = edge.labelType;
        edgeData.label = (edge?.text || '').replace(common.lineBreakRegex, '\n');

        if (edge.style === undefined) {
          edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none;';
        }

        edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');

        edgeData.id = linkId;
        edgeData.classes = 'flowchart-link ' + linkNameStart + ' ' + linkNameEnd;

        const labelEl = await insertEdgeLabel(labelsEl, edgeData);

        // calculate start and end points of the edge, note that the source and target
        // can be modified for shapes that have ports
        // @ts-ignore TODO: fix this
        const { source, target, sourceId, targetId } = getEdgeStartEndPoint(edge, dir);
        log.debug('abc78 source and target', source, target);
        // Add the edge to the graph
        graph.edges.push({
          // @ts-ignore TODO: fix this
          id: 'e' + edge.start + edge.end,
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
      'spacing.baseValue': 35,
      'elk.layered.unnecessaryBendpoints': true,
      'elk.layered.cycleBreaking.strategy': data4Layout.config.elk?.cycleBreakingStrategy,
      // 'spacing.nodeNode': 20,
      // 'spacing.nodeNodeBetweenLayers': 25,
      // 'spacing.edgeNode': 20,
      // 'spacing.edgeNodeBetweenLayers': 10,
      // 'spacing.edgeEdge': 10,
      // 'spacing.edgeEdgeBetweenLayers': 20,
      // 'spacing.nodeSelfLoop': 20,

      // Tweaking options
      // 'elk.layered.nodePlacement.favorStraightEdges': true,
      // 'nodePlacement.feedbackEdges': true,
      // 'elk.layered.wrapping.multiEdge.improveCuts': true,
      // 'elk.layered.wrapping.multiEdge.improveWrappedEdges': true,
      // 'elk.layered.wrapping.strategy': 'MULTI_EDGE',
      // 'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
      // 'elk.layered.mergeHierarchyEdges': true,
      // 'elk.layered.feedbackEdges': true,
      // 'elk.layered.crossingMinimization.semiInteractive': true,
      // 'elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor': 1,
      // 'elk.layered.edgeRouting.polyline.slopedEdgeZoneWidth': 4.0,
      // 'elk.layered.wrapping.validify.strategy': 'LOOK_BACK',
      // 'elk.insideSelfLoops.activate': true,
      // 'elk.alg.layered.options.EdgeStraighteningStrategy': 'NONE',
      // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES', // NODES_AND_EDGES
      // 'elk.layered.wrapping.cutting.strategy': 'ARD', // NODES_AND_EDGES
    },
    children: [],
    edges: [],
  };

  log.info('Drawing flowchart using v4 renderer', elk);

  // Set the direction of the graph based on the parsed information
  const dir = data4Layout.direction || 'DOWN';
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
      node.labels = [
        {
          text: node.label,
          width: node?.labelData?.width || 50,
          height: node?.labelData?.height || 50,
        },
        (node.width = node.width + 2 * node.padding),
        log.debug('UIO node label', node?.labelData?.width, node.padding),
      ];
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
  elkGraph.edges.forEach((edge: any) => {
    const source = edge.sources[0];
    const target = edge.targets[0];

    if (nodeDb[source].parentId !== nodeDb[target].parentId) {
      const ancestorId = findCommonAncestor(source, target, parentLookupDb);
      // an edge that breaks a subgraph has been identified, set configuration accordingly
      setIncludeChildrenPolicy(source, ancestorId);
      setIncludeChildrenPolicy(target, ancestorId);
    }
  });

  const g = await elk.layout(elkGraph);

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
          log.debug(
            'UIO width',
            startNode.id,
            startNode.with,
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
            startNode.with,
            bbox.width,
            'EW = ',
            ew,
            'HTML:',
            startNode.innerHTML
          );
        }

        if (startNode.calcIntersect) {
          const intersection = startNode.calcIntersect(
            {
              x: startNode.offset.posX + startNode.width / 2,
              y: startNode.offset.posY + startNode.height / 2,
              width: startNode.width,
              height: startNode.height,
            },
            edge.points[0]
          );

          if (distance(intersection, edge.points[0]) > epsilon) {
            edge.points.unshift(intersection);
          }
        }
        if (endNode.calcIntersect) {
          const intersection = endNode.calcIntersect(
            {
              x: endNode.offset.posX + endNode.width / 2,
              y: endNode.offset.posY + endNode.height / 2,
              width: endNode.width,
              height: endNode.height,
            },
            edge.points[edge.points.length - 1]
          );

          if (distance(intersection, edge.points[edge.points.length - 1]) > epsilon) {
            edge.points.push(intersection);
          }
        }

        const paths = insertEdge(
          edgesEl,
          edge,
          clusterDb,
          data4Layout.type,
          startNode,
          endNode,
          data4Layout.diagramId
        );

        edge.x = edge.labels[0].x + offset.x + edge.labels[0].width / 2;
        edge.y = edge.labels[0].y + offset.y + edge.labels[0].height / 2;
        positionEdgeLabel(edge, paths);
      }
    }
  );
};
