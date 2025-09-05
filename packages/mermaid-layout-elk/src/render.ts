import type { InternalHelpers, LayoutData, RenderOptions, SVG, SVGGroup } from 'mermaid';
// @ts-ignore TODO: Investigate D3 issue
import { curveLinear } from 'd3';
import ELK from 'elkjs/lib/elk.bundled.js';
import { type TreeData, findCommonAncestor } from './find-common-ancestor.js';

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
      const child = node as NodeWithVertex;
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

        edgeData.style += style;
        edgeData.labelStyle += labelStyle;

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

  const intersection = (
    node: { x: any; y: any; width: number; height: number },
    outsidePoint: { x: number; y: number },
    insidePoint: { x: number; y: number }
  ) => {
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

      // Keep axis-constant special-cases but do not snap to outsidePoint when r===0
      if (R === 0) {
        // Vertical approach: x is constant
        res.x = outsidePoint.x;
      }
      if (Q === 0) {
        // Horizontal approach: y is constant
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
      const q = (Q * r) / R;
      //  OK let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x + dx - w;
      // OK let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : outsidePoint.x + r;
      let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x - R + r;
      // let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : outsidePoint.x + r;
      let _y = insidePoint.y < outsidePoint.y ? insidePoint.y + q : insidePoint.y - q;
      log.debug(`sides calc abc89, Q ${Q}, q ${q}, R ${R}, r ${r}`, { _x, _y });
      // Do not snap to outsidePoint when r===0; only handle axis-constant cases
      if (R === 0) {
        _x = outsidePoint.x;
      }
      if (Q === 0) {
        _y = outsidePoint.y;
      }

      return { x: _x, y: _y };
    }
  };
  const outsideNode = (
    node: { x: any; y: any; width: number; height: number },
    point: { x: number; y: number }
  ) => {
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

  const cutter2 = (startNode: any, endNode: any, _points: any[]) => {
    const startBounds = {
      x: startNode.offset.posX + startNode.width / 2,
      y: startNode.offset.posY + startNode.height / 2,
      width: startNode.width,
      height: startNode.height,
      padding: startNode.padding,
    };
    const endBounds = {
      x: endNode.offset.posX + endNode.width / 2,
      y: endNode.offset.posY + endNode.height / 2,
      width: endNode.width,
      height: endNode.height,
      padding: endNode.padding,
    };

    if (_points.length === 0) {
      return [];
    }

    // Copy the original points array
    const points = [..._points];

    // The first point is the center of sNode, the last point is the center of eNode
    const startCenter = points[0];
    const endCenter = points[points.length - 1];

    log.debug('UIO cutter2: startCenter:', startCenter);
    log.debug('UIO cutter2: endCenter:', endCenter);

    let firstOutsideStartIndex = -1;
    let lastOutsideEndIndex = -1;

    // Single iteration through the array
    for (const [i, point] of points.entries()) {
      // Check if this is the first point outside the start node
      if (firstOutsideStartIndex === -1 && outsideNode(startBounds, point)) {
        firstOutsideStartIndex = i;
        log.debug('UIO cutter2: First point outside start node at index', i, point);
      }

      // Check if this point is outside the end node (keep updating to find the last one)
      if (outsideNode(endBounds, point)) {
        lastOutsideEndIndex = i;
        log.debug('UIO cutter2: Point outside end node at index', i, point);
      }
    }

    log.debug(
      'UIO cutter2: firstOutsideStartIndex:',
      firstOutsideStartIndex,
      'lastOutsideEndIndex:',
      lastOutsideEndIndex
    );
    log.debug('UIO cutter2: startBounds:', startBounds);
    log.debug('UIO cutter2: endBounds:', endBounds);
    log.debug('UIO cutter2: original points:', _points);

    // Calculate intersection with start node if we found a point outside it
    if (firstOutsideStartIndex !== -1) {
      const outsidePointForStart = points[firstOutsideStartIndex];
      let actualOutsideStart = outsidePointForStart;

      // Quick check: if the point is very close to the node boundary, move it further out
      const dxStart = Math.abs(outsidePointForStart.x - startBounds.x);
      const dyStart = Math.abs(outsidePointForStart.y - startBounds.y);
      const wStart = startBounds.width / 2;
      const hStart = startBounds.height / 2;

      log.debug('UIO cutter2: Checking if start outside point is truly outside:', {
        outsidePoint: outsidePointForStart,
        dx: dxStart,
        dy: dyStart,
        w: wStart,
        h: hStart,
        isOnBoundary: Math.abs(dxStart - wStart) < 1 || Math.abs(dyStart - hStart) < 1,
      });

      // If the point is on or very close to the boundary, move it further out
      if (Math.abs(dxStart - wStart) < 1 || Math.abs(dyStart - hStart) < 1) {
        log.debug('UIO cutter2: Start outside point is on boundary, creating truly outside point');
        const directionX = outsidePointForStart.x - startBounds.x;
        const directionY = outsidePointForStart.y - startBounds.y;
        const length = Math.sqrt(directionX * directionX + directionY * directionY);

        if (length > 0) {
          // Move the point 10 pixels further out in the same direction
          actualOutsideStart = {
            x: startBounds.x + (directionX / length) * (length + 10),
            y: startBounds.y + (directionY / length) * (length + 10),
          };
          log.debug('UIO cutter2: Created truly outside start point:', actualOutsideStart);
        }
      }

      let startIntersection;

      // Try using the node's intersect method first
      if (startNode.intersect) {
        startIntersection = startNode.intersect(actualOutsideStart);
        log.debug('UIO cutter2: startNode.intersect result:', startIntersection);

        // Check if the intersection is on the wrong side of the node
        const isWrongSideStart =
          (actualOutsideStart.x < startBounds.x && startIntersection.x > startBounds.x) ||
          (actualOutsideStart.x > startBounds.x && startIntersection.x < startBounds.x);

        if (isWrongSideStart) {
          log.debug('UIO cutter2: startNode.intersect returned wrong side, setting to null');
          startIntersection = null;
        } else {
          // Check if the intersection is valid (distance > 1)
          const distanceStart = Math.sqrt(
            (actualOutsideStart.x - startIntersection.x) ** 2 +
              (actualOutsideStart.y - startIntersection.y) ** 2
          );
          log.debug(
            'UIO cutter2: Distance from start outside point to intersection:',
            distanceStart
          );
          if (distanceStart <= 1) {
            log.debug('UIO cutter2: startNode.intersect distance too small, setting to null');
            startIntersection = null;
          }
        }
      } else {
        log.debug('UIO cutter2: startNode.intersect method not available');
      }

      // Fallback to intersection function
      if (!startIntersection) {
        // Create a proper inside point that's on the correct side of the node
        // The inside point should be between the outside point and the far edge
        const isVerticalStart = Math.abs(actualOutsideStart.x - startBounds.x) < 1;
        const isHorizontalStart = Math.abs(actualOutsideStart.y - startBounds.y) < 1;
        const insidePointStart = {
          x: isVerticalStart
            ? actualOutsideStart.x
            : actualOutsideStart.x < startBounds.x
              ? startBounds.x - startBounds.width / 4
              : startBounds.x + startBounds.width / 4,
          y: isHorizontalStart ? actualOutsideStart.y : startCenter.y,
        };

        log.debug('UIO cutter2: Using fallback intersection function for start with:', {
          startBounds,
          actualOutsideStart,
          insidePoint: insidePointStart,
          startCenter,
        });
        startIntersection = intersection(startBounds, actualOutsideStart, insidePointStart);
        log.debug('UIO cutter2: Fallback start intersection result:', startIntersection);
      }

      // Replace the first point with the intersection
      if (startIntersection) {
        // Check if the intersection is the same as any existing point
        const isDuplicate = points.some(
          (p, index) =>
            index > 0 &&
            Math.abs(p.x - startIntersection.x) < 0.1 &&
            Math.abs(p.y - startIntersection.y) < 0.1
        );

        if (isDuplicate) {
          log.info(
            'UIO cutter2: Start intersection is duplicate of existing point, removing first point instead'
          );
          points.shift(); // Remove the first point instead of replacing it
        } else {
          log.info(
            'UIO cutter2: Replacing first point',
            points[0],
            'with intersection',
            startIntersection
          );
          if (Infinity === startIntersection.x || Infinity === startIntersection.y) {
            log.info('UIO cutter2: Start intersection out of bounds');
          } else {
            log.info('UIO cutter2: Replacing first point with intersection:', startIntersection);
            points[0] = startIntersection;
          }
        }
      }
    }

    // Calculate intersection with end node
    // Need to recalculate indices since we may have removed the first point
    let outsidePointForEnd = null;
    let outsideIndexForEnd = -1;

    // Find the last point that's outside the end node in the current points array
    for (let i = points.length - 1; i >= 0; i--) {
      if (outsideNode(endBounds, points[i])) {
        outsidePointForEnd = points[i];
        outsideIndexForEnd = i;
        log.debug('UIO cutter2: Found point outside end node at current index:', i, points[i]);
        break;
      }
    }

    if (!outsidePointForEnd && points.length > 1) {
      // No points outside end node, try using the second-to-last point
      log.debug('UIO cutter2: No points outside end node, trying second-to-last point');
      outsidePointForEnd = points[points.length - 2];
      outsideIndexForEnd = points.length - 2;
    }

    if (outsidePointForEnd) {
      // Check if the outside point is actually on the boundary (distance = 0 from intersection)
      // If so, we need to create a truly outside point
      let actualOutsidePoint = outsidePointForEnd;

      // Quick check: if the point is very close to the node boundary, move it further out
      const dx = Math.abs(outsidePointForEnd.x - endBounds.x);
      const dy = Math.abs(outsidePointForEnd.y - endBounds.y);
      const w = endBounds.width / 2;
      const h = endBounds.height / 2;

      log.debug('UIO cutter2: Checking if outside point is truly outside:', {
        outsidePoint: outsidePointForEnd,
        dx,
        dy,
        w,
        h,
        isOnBoundary: Math.abs(dx - w) < 1 || Math.abs(dy - h) < 1,
      });

      // If the point is on or very close to the boundary, move it further out
      if (Math.abs(dx - w) < 1 || Math.abs(dy - h) < 1) {
        log.debug('UIO cutter2: Outside point is on boundary, creating truly outside point');
        // Move the point further away from the node center
        const directionX = outsidePointForEnd.x - endBounds.x;
        const directionY = outsidePointForEnd.y - endBounds.y;
        const length = Math.sqrt(directionX * directionX + directionY * directionY);

        if (length > 0) {
          // Move the point 10 pixels further out in the same direction
          actualOutsidePoint = {
            x: endBounds.x + (directionX / length) * (length + 10),
            y: endBounds.y + (directionY / length) * (length + 10),
          };
          log.debug('UIO cutter2: Created truly outside point:', actualOutsidePoint);
        }
      }

      let endIntersection;

      // Try using the node's intersect method first
      if (endNode.intersect) {
        endIntersection = endNode.intersect(actualOutsidePoint);
        log.debug('UIO cutter2: endNode.intersect result:', endIntersection);

        // Check if the intersection is on the wrong side of the node
        const isWrongSide =
          (actualOutsidePoint.x < endBounds.x && endIntersection.x > endBounds.x) ||
          (actualOutsidePoint.x > endBounds.x && endIntersection.x < endBounds.x);

        if (isWrongSide) {
          log.debug('UIO cutter2: endNode.intersect returned wrong side, setting to null');
          endIntersection = null;
        } else {
          // Check if the intersection is valid (distance > 1)
          const distance = Math.sqrt(
            (actualOutsidePoint.x - endIntersection.x) ** 2 +
              (actualOutsidePoint.y - endIntersection.y) ** 2
          );
          log.debug('UIO cutter2: Distance from outside point to intersection:', distance);
          if (distance <= 1) {
            log.debug('UIO cutter2: endNode.intersect distance too small, setting to null');
            endIntersection = null;
          }
        }
      } else {
        log.debug('UIO cutter2: endNode.intersect method not available');
      }

      // Fallback to intersection function
      if (!endIntersection) {
        // Create a proper inside point that's on the correct side of the node
        // The inside point should be between the outside point and the far edge
        const isVerticalEnd = Math.abs(actualOutsidePoint.x - endBounds.x) < 1;
        const isHorizontalEnd = Math.abs(actualOutsidePoint.y - endBounds.y) < 1;
        const insidePoint = {
          x: isVerticalEnd
            ? actualOutsidePoint.x
            : actualOutsidePoint.x < endBounds.x
              ? endBounds.x - endBounds.width / 4
              : endBounds.x + endBounds.width / 4,
          y: isHorizontalEnd ? actualOutsidePoint.y : endCenter.y,
        };

        log.debug('UIO cutter2: Using fallback intersection function with:', {
          endBounds,
          actualOutsidePoint,
          insidePoint,
          endCenter,
        });
        endIntersection = intersection(endBounds, actualOutsidePoint, insidePoint);
        log.debug('UIO cutter2: Fallback intersection result:', endIntersection);
      }

      // Replace the last point with the intersection
      if (endIntersection) {
        // Check if the intersection is the same as any existing point
        const isDuplicate = points.some(
          (p, index) =>
            index < points.length - 1 &&
            Math.abs(p.x - endIntersection.x) < 0.1 &&
            Math.abs(p.y - endIntersection.y) < 0.1
        );

        if (isDuplicate) {
          log.debug(
            'UIO cutter2: End intersection is duplicate of existing point, removing last point instead'
          );
          points.pop(); // Remove the last point instead of replacing it
        } else {
          log.debug(
            'UIO cutter2: Replacing last point',
            points[points.length - 1],
            'with intersection',
            endIntersection,
            'using outside point at index',
            outsideIndexForEnd
          );
          points[points.length - 1] = endIntersection;
        }
      }
    } else {
      log.debug('UIO cutter2: No suitable outside point found for end node intersection');
    }

    // Final cleanup: Check if the last point is too close to the previous point
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      const secondLastPoint = points[points.length - 2];
      const distance = Math.sqrt(
        (lastPoint.x - secondLastPoint.x) ** 2 + (lastPoint.y - secondLastPoint.y) ** 2
      );

      // If the distance is very small (less than 2 pixels), remove the last point
      if (distance < 2) {
        log.debug(
          'UIO cutter2: Last point too close to previous point, removing it. Distance:',
          distance
        );
        log.debug('UIO cutter2: Removing last point:', lastPoint, 'keeping:', secondLastPoint);
        points.pop();
      }
    }

    log.debug('UIO cutter2: Final points:', points);

    // Debug: Check which side of the end node we're ending at
    if (points.length > 0) {
      const finalPoint = points[points.length - 1];
      const endNodeCenter = endBounds.x;
      const endNodeLeftEdge = endNodeCenter - endBounds.width / 2;
      const endNodeRightEdge = endNodeCenter + endBounds.width / 2;

      log.debug('UIO cutter2: End node analysis:', {
        finalPoint,
        endNodeCenter,
        endNodeLeftEdge,
        endNodeRightEdge,
        endingSide: finalPoint.x < endNodeCenter ? 'LEFT' : 'RIGHT',
        distanceFromLeftEdge: Math.abs(finalPoint.x - endNodeLeftEdge),
        distanceFromRightEdge: Math.abs(finalPoint.x - endNodeRightEdge),
      });
    }

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
      'elk.layered.crossingMinimization.forceNodeModelOrder':
        data4Layout.config.elk?.forceNodeModelOrder,
      'elk.layered.considerModelOrder.strategy': data4Layout.config.elk?.considerModelOrder,

      'elk.algorithm': algorithm,
      'nodePlacement.strategy': data4Layout.config.elk?.nodePlacementStrategy,
      'elk.layered.mergeEdges': data4Layout.config.elk?.mergeEdges,
      'elk.direction': 'DOWN',
      'spacing.baseValue': 35,
      // 'elk.layered.unnecessaryBendpoints': true,
      // 'elk.layered.cycleBreaking.strategy': data4Layout.config.elk?.cycleBreakingStrategy,
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
      'nodePlacement.favorStraightEdges': true,
      'elk.layered.nodePlacement.favorStraightEdges': true,
      'nodePlacement.feedbackEdges': true,
      'elk.layered.wrapping.multiEdge.improveCuts': true,
      'elk.layered.wrapping.multiEdge.improveWrappedEdges': true,
      'elk.layered.wrapping.strategy': 'MULTI_EDGE',
      // 'elk.layered.wrapping.strategy': 'SINGLE_EDGE',
      'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
      'elk.layered.mergeHierarchyEdges': true,

      'elk.layered.feedbackEdges': true,
      'elk.layered.crossingMinimization.semiInteractive': true,
      'elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor': 1,
      'elk.layered.edgeRouting.polyline.slopedEdgeZoneWidth': 4.0,
      'elk.layered.wrapping.validify.strategy': 'LOOK_BACK',
      'elk.insideSelfLoops.activate': true,
      'elk.separateConnectedComponents': true,
      'elk.alg.layered.options.EdgeStraighteningStrategy': 'NONE',
      // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES', // NODES_AND_EDGES
      // 'elk.layered.considerModelOrder.strategy': 'EDGES', // NODES_AND_EDGES
      'elk.layered.wrapping.cutting.strategy': 'ARD', // NODES_AND_EDGES
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
        if (startNode.shape !== 'rect33') {
          edge.points.unshift({
            x: startNode.x,
            y: startNode.y,
          });
        }
        if (endNode.shape !== 'rect33') {
          edge.points.push({
            x: endNode.x,
            y: endNode.y,
          });
        }

        log.debug('UIO cutter2: Points before cutter2:', edge.points);
        edge.points = cutter2(startNode, endNode, edge.points);
        log.debug('UIO cutter2: Points after cutter2:', edge.points);
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
