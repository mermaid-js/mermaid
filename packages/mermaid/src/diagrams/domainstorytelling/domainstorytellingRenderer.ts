import { select } from 'd3';
import type { BaseType, Selection } from 'd3';
import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition, SVG } from '../../diagram-api/types.js';
import { getConfig, sanitizeText } from '../../diagram-api/diagramAPI.js';
import utils from '../../utils.js';
import { render, getRegisteredLayoutAlgorithm } from '../../rendering-util/render.js';
import type {
  LayoutData,
  Node as LayoutNode,
  Edge as LayoutEdge,
} from '../../rendering-util/types.js';
import { log } from '../../logger.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { getIconSVG, registerIconPacks } from '../../rendering-util/icons.js';
import { domainstorytellingIcons } from './domainstorytellingIcons.js';
import type { DomainStorytellingDb } from './domainstorytellingDb.js';

// Make the built-in Domain Storytelling notation icons available out of the
// box (same pattern as the architecture diagram's built-in pack). Prefix-less
// icon names resolve against this pack via fallbackPrefix in getIconSVG.
registerIconPacks([
  {
    name: domainstorytellingIcons.prefix,
    icons: domainstorytellingIcons,
  },
]);

interface AnnotationRenderInfo {
  id: string;
  targetId: string;
  text: string;
  kind: 'actor' | 'workobject' | 'group' | 'sentence';
  sentenceRef?: string;
}

interface Point {
  x: number;
  y: number;
}

const NODE_SIZE = { width: 80, height: 80, padding: 5 } as const;
const ANNOTATION_SIZE = { width: 160, height: 70, padding: 6 } as const;
const GROUP_PADDING = 20;
const SEQUENCE_CIRCLE_RADIUS = 12;
// Minimum empty gap between two sequence-number circles before they are nudged
// apart, so badges from several edges leaving the same actor don't stack.
const SEQUENCE_CIRCLE_MIN_GAP = 6;
// Defaults applied when a node has no icon declaration, so every actor and
// workobject renders as icon + label instead of a bare text node. Prefix-less
// names resolve against the built-in pack registered above.
const DEFAULT_ACTOR_ICON = 'person';
const DEFAULT_WORKOBJECT_ICON = 'document';
// Rendered pixel size of the Iconify icon SVG inside each node label.
const ICON_SIZE = 40;
// Arc-length distance (px) from the source end where the sequence-number circle
// is seated. A fixed distance keeps a consistent gap from the originating actor
// regardless of edge length; on short edges it is clamped to the edge midpoint.
const SEQUENCE_NUMBER_OFFSET = 12;
// Extra room on top of the layout padding so edge labels don't get clipped at the viewBox edge.
const VIEWPORT_EXTRA_PADDING = 6;

const getDomainstorytellingLayoutConfig = () => {
  const config = getConfig();
  const domainstorytelling = config.domainstorytelling;

  return {
    nodeSpacing: domainstorytelling?.nodeSpacing ?? 70,
    rankSpacing: domainstorytelling?.rankSpacing ?? 130,
    rankdir: domainstorytelling?.rankdir ?? 'LR',
    diagramPadding: domainstorytelling?.diagramPadding,
  };
};

// Build a short annotation node ID (no diagram-ID prefix — the render pipeline adds it).
const annotationNodeId = (prefix: string, reference: string) =>
  `ANNO_${prefix}_${reference.replace(/[^\w-]/g, '_')}`;

// Layout-edge ID format, defined here only: addEdges assigns these IDs, and the
// post-render passes re-derive them to find the rendered edge (the render
// pipeline prefixes the diagram ID on the SVG element).
const edgeLayoutIdPrefix = (from: string, to: string) => `L-${from}-${to}-`;
const edgeLayoutId = (from: string, to: string, index: number) =>
  `${edgeLayoutIdPrefix(from, to)}${index}`;

/** A node's laid-out position, or undefined if it is missing or not yet placed. */
const getNodePosition = (
  positions: Map<string, Point | undefined>,
  nodeId: string
): Point | undefined => positions.get(nodeId);

/**
 * Normalise an edge selection to its <path>: insertEdge sets the edge ID on the
 * path itself, but a wrapper element is tolerated too. Where SVGPathElement is
 * undefined (jsdom) the instanceof check is skipped, and callers fall back to the
 * layout points.
 */
const resolveEdgePath = (edgeElement: Element | null): SVGPathElement | null => {
  if (!edgeElement) {
    return null;
  }
  if (typeof SVGPathElement !== 'undefined' && edgeElement instanceof SVGPathElement) {
    return edgeElement;
  }
  return edgeElement.querySelector<SVGPathElement>('path');
};

/**
 * Build the HTML wrapper with the icon SVG on top and the label below. The icon
 * SVG is pre-resolved from the Iconify pack (see resolveIconSvgByName); callers pass
 * '' when a name can't be resolved, in which case only the label renders.
 *
 * centreOnIcon mirrors the label above the icon as a hidden spacer, which makes
 * the wrapper — and the node box sized from it — symmetric about the icon, so
 * edges aim at the icon rather than at the icon→label gap. See
 * .domainstorytelling-label-mirror in domainstorytellingStyles for why that is
 * limited to horizontal layouts.
 */
const renderIconWithLabel = (iconSvg: string, labelText: string, centreOnIcon: boolean): string => {
  const mirror = centreOnIcon
    ? `<div class="domainstorytelling-label domainstorytelling-label-mirror" aria-hidden="true">${labelText}</div>`
    : '';
  return `<div class="domainstorytelling-node">${mirror}<div class="domainstorytelling-icon">${iconSvg}</div><div class="domainstorytelling-label">${labelText}</div></div>`;
};

/**
 * Edges attach on the left and right borders in horizontal layouts, and on the
 * top and bottom borders in vertical ones — which decides whether the node box
 * may centre on the icon (see renderIconWithLabel).
 */
const centresNodeOnIcon = (rankdir: string) => rankdir === 'LR' || rankdir === 'RL';

const renderAnnotationLabel = (text: string): string => {
  return `<div class="domainstorytelling-annotation-content domainstorytelling-annotation-side-right">${text}</div>`;
};

const getSequencePointByRef = (
  element: Selection<BaseType, unknown, HTMLElement, unknown>,
  sentenceRef: string
): Point | undefined => {
  const sequenceGroup = element.select(
    `.sequence-number-group[data-sentence-ref="${sentenceRef}"]`
  );
  if (sequenceGroup.empty()) {
    return undefined;
  }
  const transform = sequenceGroup.attr('transform');
  if (!transform) {
    return undefined;
  }
  const match = /translate\(([\d.-]+),\s*([\d.-]+)\)/.exec(transform);
  if (!match) {
    return undefined;
  }
  return { x: Number(match[1]), y: Number(match[2]) };
};

const collectAnnotations = (db: DomainStorytellingDb): AnnotationRenderInfo[] => {
  const annotations: AnnotationRenderInfo[] = [];

  db.actorComments.forEach((comment, actorId) => {
    if (!comment) {
      return;
    }
    annotations.push({
      id: annotationNodeId('actor', actorId),
      targetId: actorId,
      text: comment,
      kind: 'actor',
    });
  });

  db.workobjectComments.forEach((comment, workobjectId) => {
    if (!comment) {
      return;
    }
    annotations.push({
      id: annotationNodeId('workobject', workobjectId),
      targetId: workobjectId,
      text: comment,
      kind: 'workobject',
    });
  });

  db.groupComments.forEach((comment, groupId) => {
    if (!comment) {
      return;
    }
    annotations.push({
      id: annotationNodeId('group', groupId),
      targetId: groupId,
      text: comment,
      kind: 'group',
    });
  });

  db.sentenceComments.forEach((comment, sentenceRef) => {
    if (!comment) {
      return;
    }
    const targetId = db.getSentenceTarget(sentenceRef);
    if (!targetId) {
      return;
    }
    annotations.push({
      id: annotationNodeId('sentence', sentenceRef),
      targetId,
      text: comment,
      kind: 'sentence',
      sentenceRef,
    });
  });

  return annotations;
};

/**
 * Build the node-ID → group-ID lookup once so addGroups and addEdges can share
 * it instead of each re-walking db.actors/db.workobjects. Nodes with no group
 * map to undefined; both consumers treat that the same as a missing key.
 */
const buildNodeToGroup = (db: DomainStorytellingDb): Map<string, string | undefined> => {
  const nodeToGroup = new Map<string, string | undefined>();
  db.actors.forEach((actor) => nodeToGroup.set(actor.id, actor.group));
  db.workobjects.forEach((workobject) => nodeToGroup.set(workobject.id, workobject.group));
  return nodeToGroup;
};

/**
 * Add group nodes and parent relationships to the nodes array.
 * Called after addVertices so that actor nodes already exist.
 */
const addGroups = function (
  nodes: LayoutNode[],
  db: DomainStorytellingDb,
  annotations: AnnotationRenderInfo[],
  nodeToGroup: Map<string, string | undefined>
) {
  const groups = db.getGroups();
  if (groups.length === 0) {
    return;
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Create a cluster node for each group
  groups.forEach((group) => {
    nodes.push({
      id: group.id,
      label: sanitizeText(group.title ?? ''),
      shape: 'rect',
      isGroup: true,
      cssClasses: 'domainstorytelling-group',
      rx: 4,
      ry: 4,
      padding: GROUP_PADDING,
    } as LayoutNode);
    nodeById.set(group.id, nodes[nodes.length - 1]);
  });

  // Nest group nodes inside their parent groups
  groups.forEach((group) => {
    if (group.parentId) {
      const groupNode = nodeById.get(group.id);
      if (groupNode) {
        groupNode.parentId = group.parentId;
      }
    }
  });

  // Assign actors to their groups
  db.actors.forEach((actor) => {
    if (actor.group) {
      const actorNode = nodeById.get(actor.id);
      if (actorNode) {
        actorNode.parentId = actor.group;
      }
    }
  });

  // Assign workobjects to their groups
  db.workobjects.forEach((workobject) => {
    if (workobject.group) {
      const workobjectNode = nodeById.get(workobject.id);
      if (workobjectNode) {
        workobjectNode.parentId = workobject.group;
      }
    }
  });

  // Keep non-group annotations inside the same group cluster as their target node.
  annotations.forEach((annotation) => {
    if (annotation.kind === 'group') {
      return;
    }

    const groupId = nodeToGroup.get(annotation.targetId);
    if (
      groupId &&
      nodeById.has(annotation.id) &&
      nodeById.has(annotation.targetId) &&
      nodeById.has(groupId)
    ) {
      const annotationNode = nodeById.get(annotation.id);
      if (annotationNode) {
        annotationNode.parentId = groupId;
      }
    }
  });
};

/**
 * Resolve every icon referenced by actors/workobjects (falling back to the
 * defaults) to an Iconify SVG string once, so addVertices can build labels
 * synchronously. Prefix-less names resolve against the built-in
 * mermaid-domainstorytelling pack; names whose pack isn't registered resolve
 * to the Iconify placeholder icon (getIconSVG never throws).
 */
const resolveIconSvgByName = async (db: DomainStorytellingDb): Promise<Map<string, string>> => {
  const names = new Set<string>();
  db.actors.forEach((actor) => names.add(actor.icon ?? DEFAULT_ACTOR_ICON));
  db.workobjects.forEach((workobject) => names.add(workobject.icon ?? DEFAULT_WORKOBJECT_ICON));
  const entries = await Promise.all(
    [...names].map(
      async (name) =>
        [
          name,
          await getIconSVG(name, {
            width: ICON_SIZE,
            height: ICON_SIZE,
            fallbackPrefix: domainstorytellingIcons.prefix,
          }),
        ] as const
    )
  );
  return new Map(entries);
};

/** Add one node per actor, workobject, and annotation to the nodes array. */
const addVertices = function (
  nodes: LayoutNode[],
  db: DomainStorytellingDb,
  annotations: AnnotationRenderInfo[],
  iconSvgByName: Map<string, string>,
  centreOnIcon: boolean
) {
  // HTML labels are styled entirely via CSS; labelStyle is only for the SVG
  // <text> fallback. Do NOT include fill here — styles2String routes fill to
  // nodeStyles (not labelStyles), which makes it land as an inline style on the
  // shape's <rect> and overpowers any CSS transparency rules.
  const nodeLabelStyle = `font-size:14px;text-align:center;`;
  const annotationLabelStyle = `font-size:12px;text-align:left;`;

  // Add actors (icon and label)
  db.actors.forEach((actor) => {
    const safeLabel = sanitizeText(actor.label || actor.id);
    const iconSvg = iconSvgByName.get(actor.icon ?? DEFAULT_ACTOR_ICON) ?? '';
    const labelWithIcon = renderIconWithLabel(iconSvg, safeLabel, centreOnIcon);

    nodes.push({
      id: actor.id,
      label: labelWithIcon,
      useHtmlLabels: true,
      labelStyle: nodeLabelStyle,
      shape: 'rect',
      isGroup: false,
      cssClasses: 'actor domainstorytelling-node-container',
      width: NODE_SIZE.width,
      height: NODE_SIZE.height,
      padding: NODE_SIZE.padding,
    } as LayoutNode);
  });

  // Add workobjects (icon and label)
  db.workobjects.forEach((workobject) => {
    const safeLabel = sanitizeText(workobject.label || workobject.id);
    const iconSvg = iconSvgByName.get(workobject.icon ?? DEFAULT_WORKOBJECT_ICON) ?? '';
    const labelWithIcon = renderIconWithLabel(iconSvg, safeLabel, centreOnIcon);

    nodes.push({
      id: workobject.id,
      label: labelWithIcon,
      useHtmlLabels: true,
      labelStyle: nodeLabelStyle,
      shape: 'rect',
      isGroup: false,
      cssClasses: 'workobject domainstorytelling-node-container',
      width: NODE_SIZE.width,
      height: NODE_SIZE.height,
      padding: NODE_SIZE.padding,
    } as LayoutNode);
  });

  annotations.forEach((annotation) => {
    const safeText = sanitizeText(annotation.text);

    nodes.push({
      id: annotation.id,
      label: renderAnnotationLabel(safeText),
      useHtmlLabels: true,
      labelStyle: annotationLabelStyle,
      shape: 'rect',
      isGroup: false,
      cssClasses: 'domainstorytelling-annotation-node',
      width: ANNOTATION_SIZE.width,
      height: ANNOTATION_SIZE.height,
      padding: ANNOTATION_SIZE.padding,
    } as LayoutNode);
  });
};

/** Add one edge per activity, plus a dashed link per annotation. */
const addEdges = function (
  edges: LayoutEdge[],
  db: DomainStorytellingDb,
  annotations: AnnotationRenderInfo[],
  nodeToGroup: Map<string, string | undefined>
) {
  let cnt = 0;

  db.edges.forEach((edge) => {
    cnt++;
    const fromGroup = nodeToGroup.get(edge.from);
    const toGroup = nodeToGroup.get(edge.to);
    const isCrossGroup = Boolean(fromGroup && toGroup && fromGroup !== toGroup);

    // prepareLayoutForDagre spreads the whole edge object into the dagre edge
    // label, which is where dagre reads weight/minlen from.
    const edgeExtras = {
      weight: edge.noOfSeq ? (isCrossGroup ? 2 : 4) : isCrossGroup ? 1 : 2,
      minlen: isCrossGroup ? 2 : 1,
    };

    edges.push({
      id: edgeLayoutId(edge.from, edge.to, cnt),
      start: edge.from,
      end: edge.to,
      arrowhead: 'normal',
      arrowTypeStart: 'arrow_open',
      arrowTypeEnd: 'arrow_point',
      label: edge.label,
      labelpos: 'c',
      thickness: 'normal',
      pattern: 'solid',
      classes: 'domainstorytelling-link',
      ...edgeExtras,
    } as LayoutEdge);
  });

  let annotationEdgeCount = cnt;
  annotations.forEach((annotation) => {
    annotationEdgeCount++;
    edges.push({
      id: edgeLayoutId(annotation.id, annotation.targetId, annotationEdgeCount),
      start: annotation.id,
      end: annotation.targetId,
      arrowhead: 'none',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'none',
      arrowheadStyle: '',
      thickness: 'normal',
      pattern: 'dashed',
      classes: 'domainstorytelling-annotation-link',
      ...{ weight: 0, minlen: 1 },
    } as LayoutEdge);
  });
};

const applyAnnotationBracketOrientation = function (
  positions: Map<string, Point | undefined>,
  element: Selection<BaseType, unknown, HTMLElement, unknown>,
  diagramId: string,
  annotations: AnnotationRenderInfo[]
) {
  annotations.forEach((annotation) => {
    const annotationPosition = getNodePosition(positions, annotation.id);
    if (!annotationPosition) {
      return;
    }

    const sequencePoint =
      annotation.kind === 'sentence' && annotation.sentenceRef
        ? getSequencePointByRef(element, annotation.sentenceRef)
        : undefined;
    const targetPosition = sequencePoint ?? getNodePosition(positions, annotation.targetId);
    if (!targetPosition) {
      return;
    }

    const dx = targetPosition.x - annotationPosition.x;
    const dy = targetPosition.y - annotationPosition.y;
    const side =
      Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'bottom' : 'top';

    // domId = diagramId + '-' + annotation.id (prefixed by the render pipeline)
    const annotationLabel = element.select(
      `#${diagramId}-${annotation.id} .domainstorytelling-annotation-content`
    );
    if (annotationLabel.empty()) {
      return;
    }

    annotationLabel
      .classed('domainstorytelling-annotation-side-right', false)
      .classed('domainstorytelling-annotation-side-left', false)
      .classed('domainstorytelling-annotation-side-top', false)
      .classed('domainstorytelling-annotation-side-bottom', false)
      .classed(`domainstorytelling-annotation-side-${side}`, true);
  });
};

const routeSentenceAnnotationLinksToSequenceNumbers = function (
  positions: Map<string, Point | undefined>,
  element: Selection<BaseType, unknown, HTMLElement, unknown>,
  diagramId: string,
  annotations: AnnotationRenderInfo[]
) {
  annotations
    .filter((annotation) => annotation.kind === 'sentence' && annotation.sentenceRef)
    .forEach((annotation) => {
      if (!annotation.sentenceRef) {
        return;
      }
      const annotationPosition = getNodePosition(positions, annotation.id);
      if (!annotationPosition) {
        return;
      }
      const targetPoint = getSequencePointByRef(element, annotation.sentenceRef);
      if (!targetPoint) {
        return;
      }

      // Edge SVG element ID = diagramId + '-' + edge.id (set by insertEdge in edges.js)
      const edgeContainer = element.select(
        `[id^="${diagramId}-${edgeLayoutIdPrefix(annotation.id, annotation.targetId)}"]`
      );
      if (edgeContainer.empty()) {
        return;
      }

      const edgePathElement = resolveEdgePath(edgeContainer.node() as Element | null);
      if (!edgePathElement) {
        return;
      }

      // Anchor at the node CENTER on purpose: the visible annotation box is an
      // HTML div whose rendered size isn't known here (foreignObject layout),
      // so instead of intersecting a guessed boundary, the line runs under the
      // box and the div's opaque background (.domainstorytelling-annotation-content)
      // masks it — it emerges exactly at the visible box edge, on the side
      // facing the target (same dominant-axis rule as the bracket orientation).
      select(edgePathElement).attr(
        'd',
        `M ${annotationPosition.x},${annotationPosition.y} L ${targetPoint.x},${targetPoint.y}`
      );
    });
};

/**
 * After sequence-number circles exist in the DOM, redirect sentence-annotation
 * links to those circles and re-apply bracket orientation. Re-routing changes
 * which targets the orientation step needs to consider, so the two operations
 * are intentionally bundled — call sites should treat them as one step.
 */
const routeSentenceAnnotationsAndReorient = (
  positions: Map<string, Point | undefined>,
  element: Selection<BaseType, unknown, HTMLElement, unknown>,
  diagramId: string,
  annotations: AnnotationRenderInfo[]
) => {
  routeSentenceAnnotationLinksToSequenceNumbers(positions, element, diagramId, annotations);
  applyAnnotationBracketOrientation(positions, element, diagramId, annotations);
};

/** Total Euclidean length of a polyline (sum of its segment lengths). */
const polylineLength = (points: Point[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
};

const pointAtRatioOnPolyline = (points: Point[], ratio: number): Point | undefined => {
  if (points.length === 0) {
    return undefined;
  }
  if (points.length === 1) {
    return points[0];
  }

  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const length = Math.hypot(dx, dy);
    segmentLengths.push(length);
    totalLength += length;
  }

  if (totalLength === 0) {
    return points[0];
  }

  const targetLength = totalLength * ratio;
  let traversed = 0;

  for (const [i, segmentLength] of segmentLengths.entries()) {
    if (traversed + segmentLength >= targetLength) {
      const localRatio = (targetLength - traversed) / segmentLength;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * localRatio,
        y: points[i].y + (points[i + 1].y - points[i].y) * localRatio,
      };
    }
    traversed += segmentLength;
  }

  return points[points.length - 1];
};

/**
 * Add sequence number circles to edges.
 *
 * Each numbered edge gets a circle a fixed distance from its source. When
 * several numbered edges leave the same actor their circles would collide, so
 * a circle overlapping an already-placed one is slid further along its own edge
 * until it clears — keeping every badge on its connector rather than floating.
 */
const addSequenceNumberCircles = function (
  layoutEdges: LayoutEdge[],
  element: Selection<BaseType, unknown, HTMLElement, unknown>,
  diagramId: string,
  db: DomainStorytellingDb
) {
  // Index layout edges by id once so the per-edge lookup below stays O(1).
  const layoutEdgeById = new Map(layoutEdges.map((e) => [e.id, e]));

  // Phase 1: for each numbered edge capture a sampler that returns the point at
  // an arc-length distance along that edge, plus its base/max distances. No DOM
  // writes yet, so a circle can be re-sampled along its edge before it's drawn.
  const placements: {
    sampleAt: (distance: number) => Point;
    baseDistance: number;
    maxDistance: number;
    point: Point;
    containerNode: Element | null;
    noOfSeq: number;
    sentenceRef?: string;
  }[] = [];

  let edgeIndex = 0;
  db.edges.forEach((edge) => {
    edgeIndex++;

    if (!edge.noOfSeq) {
      return;
    }

    // Edge SVG element ID = diagramId + '-' + edge.id (set by insertEdge in edges.js)
    const layoutEdgeId = edgeLayoutId(edge.from, edge.to, edgeIndex);
    const resolvedEdgeId = `${diagramId}-${layoutEdgeId}`;
    const edgeNode =
      (element.select(`#${resolvedEdgeId}`).node() as Element | null) ??
      (element.select(`[id^="${resolvedEdgeId}-"]`).node() as Element | null) ??
      (element
        .select(`[id^="${diagramId}-${edgeLayoutIdPrefix(edge.from, edge.to)}"]`)
        .node() as Element | null);

    const pathElement = resolveEdgePath(edgeNode);

    // Prefer the rendered path's arc-length geometry; fall back to the dagre
    // polyline (e.g. in jsdom, where getPointAtLength is unavailable).
    let sampleAt: ((distance: number) => Point) | undefined;
    let totalLength = 0;
    // Runtime guard: jsdom doesn't implement these SVG geometry methods even
    // though the types say they're always present.
    if (
      pathElement &&
      typeof pathElement.getTotalLength === 'function' &&
      typeof pathElement.getPointAtLength === 'function'
    ) {
      const pathEl = pathElement;
      totalLength = pathEl.getTotalLength();
      const total = totalLength;
      sampleAt = (distance) => {
        const p = pathEl.getPointAtLength(Math.max(0, Math.min(distance, total)));
        return { x: p.x, y: p.y };
      };
    } else {
      const layoutPoints = layoutEdgeById.get(layoutEdgeId)?.points as Point[] | undefined;
      if (layoutPoints?.length) {
        totalLength = polylineLength(layoutPoints);
        const total = totalLength;
        sampleAt = (distance) => {
          const ratio = total === 0 ? 0 : Math.max(0, Math.min(distance, total)) / total;
          return pointAtRatioOnPolyline(layoutPoints, ratio) ?? layoutPoints[0];
        };
      }
    }

    if (!sampleAt) {
      return;
    }

    const baseDistance = Math.min(SEQUENCE_NUMBER_OFFSET, totalLength / 2);
    // Cap sliding so the circle stays on the edge and clear of the target node.
    const maxDistance = Math.max(
      baseDistance,
      totalLength - (SEQUENCE_CIRCLE_RADIUS + SEQUENCE_CIRCLE_MIN_GAP)
    );

    const containerNode = pathElement?.parentElement ?? null;

    placements.push({
      sampleAt,
      baseDistance,
      maxDistance,
      point: sampleAt(baseDistance),
      containerNode,
      noOfSeq: edge.noOfSeq,
      sentenceRef: edge.sentenceRef,
    });
  });

  // Phase 2: slide any circle overlapping an already-placed one further along
  // its own edge until it clears. Positions only share a coordinate system
  // within the same container, so track placed circles per container.
  const minDist = 2 * SEQUENCE_CIRCLE_RADIUS + SEQUENCE_CIRCLE_MIN_GAP;
  const slideStep = SEQUENCE_CIRCLE_RADIUS;
  const placedByContainer = new Map<Element | null, Point[]>();
  for (const placement of placements) {
    const placed = placedByContainer.get(placement.containerNode) ?? [];
    const collides = (p: Point) => placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < minDist);

    let distance = placement.baseDistance;
    while (collides(placement.point) && distance < placement.maxDistance) {
      distance = Math.min(distance + slideStep, placement.maxDistance);
      placement.point = placement.sampleAt(distance);
    }

    placed.push(placement.point);
    placedByContainer.set(placement.containerNode, placed);
  }

  // Phase 3: draw each circle in an overlay group appended after the
  // edgePaths/edgeLabels/nodes siblings (same coordinate space, later in
  // document order) so a circle that lands on an edge label is drawn on top of
  // it. One overlay per root group keeps nested cluster edges in their own space.
  const overlayByParent = new Map<Element, Selection<SVGGElement, unknown, null, undefined>>();
  const getOverlay = (parentNode: Element) => {
    const existing = overlayByParent.get(parentNode);
    if (existing) {
      return existing;
    }
    const overlay = select(parentNode).append('g').attr('class', 'sequence-number-overlay');
    overlayByParent.set(parentNode, overlay);
    return overlay;
  };

  for (const placement of placements) {
    // edgePaths and edgeLabels are siblings under a shared root group; append
    // the circle to that root (after the labels) so it wins the z-order.
    const overlayParent = placement.containerNode?.parentElement ?? (element.node() as Element);
    const circleGroup = getOverlay(overlayParent)
      .append('g')
      .attr('class', 'sequence-number-group')
      .attr('transform', `translate(${placement.point.x}, ${placement.point.y})`);

    if (placement.sentenceRef) {
      circleGroup.attr('data-sentence-ref', placement.sentenceRef);
    }

    circleGroup
      .append('circle')
      .attr('r', SEQUENCE_CIRCLE_RADIUS)
      .attr('class', 'sequence-number-circle');

    circleGroup
      .append('text')
      .attr('class', 'sequence-number-text')
      .text(placement.noOfSeq.toString());
  }
};

const draw: DrawDefinition = async (_text, id, _version, diagObj: Diagram) => {
  log.info('Drawing domainstorytelling');

  const db = diagObj.db as DomainStorytellingDb;
  const layoutConfig = getDomainstorytellingLayoutConfig();
  const config = getConfig();

  // Collect annotations and the node→group lookup once so downstream helpers
  // don't re-walk the db. Icons resolve to SVG up front (async) so addVertices
  // can build the HTML labels synchronously.
  const annotations = collectAnnotations(db);
  const nodeToGroup = buildNodeToGroup(db);
  const iconSvgByName = await resolveIconSvgByName(db);

  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  addVertices(nodes, db, annotations, iconSvgByName, centresNodeOnIcon(layoutConfig.rankdir));
  addGroups(nodes, db, annotations, nodeToGroup);
  addEdges(edges, db, annotations, nodeToGroup);

  const data4Layout: LayoutData = {
    nodes,
    edges,
    config,
    // Honor the global `layout` config (e.g. `layout: elk`) like flowchart/class/state do.
    // Falls back to dagre when the requested algorithm (e.g. ELK) isn't registered.
    layoutAlgorithm: getRegisteredLayoutAlgorithm(config.layout),
    direction: layoutConfig.rankdir,
    nodeSpacing: layoutConfig.nodeSpacing,
    rankSpacing: layoutConfig.rankSpacing,
    markers: ['point', 'circle', 'cross'],
    diagramId: id,
    type: 'domainstorytelling',
  };

  const svg: SVG = selectSvgElement(id);

  // Run the renderer — this lays out the graph and draws all nodes, edges, and markers.
  await render(data4Layout, svg);

  // Build a node position lookup from the layout results (positions populated by render).
  const positions = new Map<string, Point | undefined>(
    data4Layout.nodes.map((n) => [
      n.id,
      n.x !== undefined && n.y !== undefined ? { x: n.x, y: n.y } : undefined,
    ])
  );

  // For DOM queries we need a D3 selection of the SVG container.
  const element = svg as unknown as Selection<BaseType, unknown, HTMLElement, unknown>;

  // Add sequence number circles after rendering
  addSequenceNumberCircles(data4Layout.edges, element, id, db);

  // Re-route sentence annotations to the seq-number circles and re-orient
  // the brackets together — the latter depends on the former.
  routeSentenceAnnotationsAndReorient(positions, element, id, annotations);

  utils.insertTitle(svg, 'domainstorytellingTitleText', 20, db.getDiagramTitle?.() ?? '');

  const padding = (layoutConfig.diagramPadding ?? 8) + VIEWPORT_EXTRA_PADDING;
  setupViewPortForSVG(
    svg,
    padding,
    'domainstorytellingClass',
    config.domainstorytelling?.useMaxWidth ?? true
  );
};

export const renderer: DiagramRenderer = { draw };
