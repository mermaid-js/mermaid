import type { EdgeModel, ScannedNode } from './types.js';

interface EdgeParts {
  edgeId: string;
  pathElement: SVGPathElement;
  classAttr: string;
  sourceAttr: string | null;
  targetAttr: string | null;
}

/**
 * Extracts the user-defined node ID from LS_xxx / LS-xxx or LE_xxx / LE-xxx
 * class markers.
 *
 * Common rendered class forms:
 *   - "flowchart-link LS_A LE_B"
 *   - "flowchart-link LS-A LE-B"
 *   - "flowchart-link LS_A-0 LE_B-0"
 *
 * The trailing counter suffix is a Mermaid internal number and must be
 * stripped to recover the user-defined node ID.
 */
export function extractEdgeNodeId(rawId: string): string | null {
  if (!rawId) {
    return null;
  }

  const lastDash = rawId.lastIndexOf('-');
  if (lastDash === -1) {
    return rawId;
  }

  const suffix = rawId.slice(lastDash + 1);
  if (/^\d+$/.test(suffix)) {
    return rawId.slice(0, lastDash);
  }

  return rawId;
}

/**
 * Calculates the intersection point of an edge with the bounding box of a
 * node.
 *
 * Uses a ray from the node center toward the target center and performs a
 * lightweight intersection with the node's rectangular bounds.  No
 * obstacle avoidance; does not depend on the Mermaid layout engine.
 */
export function getConnectionPoint(
  from: { x: number; y: number; nodeWidth: number; nodeHeight: number },
  to: { x: number; y: number }
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const halfW = Math.max(from.nodeWidth / 2, 1);
  const halfH = Math.max(from.nodeHeight / 2, 1);

  if (dx === 0 && dy === 0) {
    return { x: from.x, y: from.y };
  }

  if (Math.abs(dx) / halfW > Math.abs(dy) / halfH) {
    return {
      x: from.x + Math.sign(dx || 1) * halfW,
      y: from.y + dy * (halfW / Math.max(Math.abs(dx), 1)),
    };
  }

  return {
    x: from.x + dx * (halfH / Math.max(Math.abs(dy), 1)),
    y: from.y + Math.sign(dy || 1) * halfH,
  };
}

function buildEdgePathData(
  start: { x: number; y: number },
  end: { x: number; y: number },
  sourceCenter: { x: number; y: number },
  targetCenter: { x: number; y: number }
): string {
  const edgeDx = end.x - start.x;
  const edgeDy = end.y - start.y;
  const edgeDist = Math.hypot(edgeDx, edgeDy);
  if (edgeDist < 1) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  const ux = edgeDx / edgeDist;
  const uy = edgeDy / edgeDist;

  // Control point distance along the edge direction (~1/3 edge length)
  const cpDist = edgeDist * 0.35;

  // Determine curve direction from center-to-center vector cross product
  const ccDx = targetCenter.x - sourceCenter.x;
  const ccDy = targetCenter.y - sourceCenter.y;
  const cross = ux * ccDy - uy * ccDx;
  const sign = cross >= 0 ? 1 : -1;

  // Slight arc offset perpendicular to the edge direction
  const curveOffset = Math.min(edgeDist * 0.1, 10) * sign;
  const px = -uy;
  const py = ux;

  const cp1x = start.x + ux * cpDist + px * curveOffset;
  const cp1y = start.y + uy * cpDist + py * curveOffset;
  const cp2x = end.x - ux * cpDist + px * curveOffset;
  const cp2y = end.y - uy * cpDist + py * curveOffset;

  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
}

function buildFallbackEdgeId(
  candidate: Element,
  pathElement: SVGPathElement,
  index: number
): string {
  const edgeId =
    pathElement.getAttribute('data-id') ??
    candidate.getAttribute('data-id') ??
    pathElement.getAttribute('id') ??
    candidate.getAttribute('id');

  if (edgeId) {
    return edgeId;
  }

  return `edge-${index}`;
}

function getEdgeEndpointAttribute(
  candidate: Element,
  pathElement: SVGPathElement,
  names: string[]
): string | null {
  for (const name of names) {
    const value = pathElement.getAttribute(name) ?? candidate.getAttribute(name);
    if (value) {
      return value;
    }
  }

  return null;
}

function resolveEdgeParts(candidate: Element, index: number): EdgeParts | null {
  if (candidate instanceof SVGPathElement) {
    return {
      edgeId: buildFallbackEdgeId(candidate, candidate, index),
      pathElement: candidate,
      classAttr: candidate.getAttribute('class') ?? '',
      sourceAttr: getEdgeEndpointAttribute(candidate, candidate, ['data-source', 'data-start']),
      targetAttr: getEdgeEndpointAttribute(candidate, candidate, ['data-target', 'data-end']),
    };
  }

  const pathElement = candidate.querySelector('path');
  if (!(pathElement instanceof SVGPathElement)) {
    return null;
  }

  const candidateClass = candidate.getAttribute('class') ?? '';
  const pathClass = pathElement.getAttribute('class') ?? '';

  return {
    edgeId: buildFallbackEdgeId(candidate, pathElement, index),
    pathElement,
    classAttr: `${candidateClass} ${pathClass}`.trim(),
    sourceAttr: getEdgeEndpointAttribute(candidate, pathElement, ['data-source', 'data-start']),
    targetAttr: getEdgeEndpointAttribute(candidate, pathElement, ['data-target', 'data-end']),
  };
}

function resolveNodeId(rawId: string | null, nodeMap: Map<string, ScannedNode>): string | null {
  if (!rawId) {
    return null;
  }

  const trimmed = rawId.trim();
  if (nodeMap.has(trimmed)) {
    return trimmed;
  }

  const extracted = extractEdgeNodeId(trimmed);
  if (extracted && nodeMap.has(extracted)) {
    return extracted;
  }

  // Try to handle dagre internal prefix format (e.g. flowchart-A-0)
  const flowPrefix = 'flowchart-';
  if (extracted?.startsWith(flowPrefix)) {
    const inner = extracted.slice(flowPrefix.length);
    if (nodeMap.has(inner)) {
      return inner;
    }

    const innerExtracted = extractEdgeNodeId(inner);
    if (innerExtracted && nodeMap.has(innerExtracted)) {
      return innerExtracted;
    }
  }

  return null;
}

function resolveEndpointFromClass(
  classAttr: string,
  prefix: 'LS' | 'LE',
  nodeMap: Map<string, ScannedNode>
): string | null {
  const tokens = classAttr.split(/\s+/).filter(Boolean);
  const token = tokens.find((className) => {
    return className.startsWith(`${prefix}_`) || className.startsWith(`${prefix}-`);
  });

  if (!token) {
    return null;
  }

  return resolveNodeId(token.slice(3), nodeMap);
}

function targetMatchesRemainder(remainder: string, target: string, separator: string): boolean {
  if (remainder === target) {
    return true;
  }

  const targetPrefix = `${target}${separator}`;
  if (!remainder.startsWith(targetPrefix)) {
    return false;
  }

  const suffix = remainder.slice(targetPrefix.length);
  return /^\d+(?:[_-].*)?$/.test(suffix);
}

function stripDiagramPrefix(edgeId: string, diagramId: string): string {
  const diagramPrefix = `${diagramId}-`;
  return diagramId && edgeId.startsWith(diagramPrefix)
    ? edgeId.slice(diagramPrefix.length)
    : edgeId;
}

function inferEndpointIdsFromEdgeId(
  edgeId: string,
  svgElement: SVGElement,
  nodeMap: Map<string, ScannedNode>
): { source: string; target: string } | null {
  const nodeIds = [...nodeMap.keys()].sort((a, b) => b.length - a.length);
  const candidateIds = new Set([edgeId, stripDiagramPrefix(edgeId, svgElement.id)]);

  for (const candidateId of candidateIds) {
    for (const separator of ['_', '-']) {
      const generatedPrefix = `L${separator}`;
      if (!candidateId.startsWith(generatedPrefix)) {
        continue;
      }

      const endpointPart = candidateId.slice(generatedPrefix.length);
      for (const source of nodeIds) {
        const sourcePrefix = `${source}${separator}`;
        if (!endpointPart.startsWith(sourcePrefix)) {
          continue;
        }

        const remainder = endpointPart.slice(sourcePrefix.length);
        const target = nodeIds.find((nodeId) =>
          targetMatchesRemainder(remainder, nodeId, separator)
        );

        if (target) {
          return { source, target };
        }
      }
    }
  }

  return null;
}

function resolveEdgeEndpoints(
  edgeParts: EdgeParts,
  svgElement: SVGElement,
  nodeMap: Map<string, ScannedNode>
): { source: string; target: string } | null {
  const source =
    resolveNodeId(edgeParts.sourceAttr, nodeMap) ??
    resolveEndpointFromClass(edgeParts.classAttr, 'LS', nodeMap);
  const target =
    resolveNodeId(edgeParts.targetAttr, nodeMap) ??
    resolveEndpointFromClass(edgeParts.classAttr, 'LE', nodeMap);

  if (source && target) {
    return { source, target };
  }

  return inferEndpointIdsFromEdgeId(edgeParts.edgeId, svgElement, nodeMap);
}

/**
 * SVG edge updater — recomputes edge path data based on current node
 * positions.
 *
 * Design constraints:
 * 1. Does not re-render the Mermaid diagram
 * 2. Does not re-run layout
 * 3. Only modifies the `d` attribute of existing paths; preserves
 *    marker, stroke, class, and style attributes
 */
export class EdgeUpdater {
  private svgElement: SVGElement;
  /** edgeId → EdgeModel */
  private edgeMap = new Map<string, EdgeModel>();
  /** edgeId → corresponding SVG path element */
  private edgePathMap = new Map<string, SVGPathElement>();
  /** nodeId → set of connected edge IDs */
  private nodeToEdgesMap = new Map<string, Set<string>>();
  /** Reference to the current node map. */
  private nodeMap: Map<string, ScannedNode> | null = null;
  /** Animation frame handle for throttling batch updates. */
  private rafId: number | null = null;
  /** Set of node IDs pending update this frame. */
  private pendingNodes = new Set<string>();

  constructor(svgElement: SVGElement) {
    this.svgElement = svgElement;
  }

  /**
   * Builds the edge relationship map from the rendered Mermaid SVG.
   *
   * Prefers the `data-source` / `data-target` attributes written during
   * Mermaid rendering.  Falls back to legacy `LS_*` / `LE_*` and
   * `LS-*` / `LE-*` class markers, and finally attempts to infer
   * endpoints from auto-generated edge IDs of the form
   * `L_<source>_<target>_<counter>`.
   */
  buildEdgeMap(nodeMap: Map<string, ScannedNode>): void {
    this.nodeMap = nodeMap;
    this.edgeMap.clear();
    this.edgePathMap.clear();
    this.nodeToEdgesMap.clear();

    const candidates = this.svgElement.querySelectorAll(
      '.edgePaths .flowchart-link, .edges .flowchart-link'
    );
    const seenPaths = new Set<SVGPathElement>();

    [...candidates].forEach((candidate, index) => {
      const edgeParts = resolveEdgeParts(candidate, index);
      if (!edgeParts || seenPaths.has(edgeParts.pathElement)) {
        return;
      }

      seenPaths.add(edgeParts.pathElement);

      const endpoints = resolveEdgeEndpoints(edgeParts, this.svgElement, nodeMap);
      if (!endpoints) {
        return;
      }

      const edge: EdgeModel = {
        id: edgeParts.edgeId,
        source: endpoints.source,
        target: endpoints.target,
        pathElement: edgeParts.pathElement,
      };

      this.edgeMap.set(edge.id, edge);
      this.edgePathMap.set(edge.id, edge.pathElement);
      this.linkNodeToEdge(edge.source, edge.id);
      this.linkNodeToEdge(edge.target, edge.id);
    });
  }

  private linkNodeToEdge(nodeId: string, edgeId: string): void {
    if (!this.nodeToEdgesMap.has(nodeId)) {
      this.nodeToEdgesMap.set(nodeId, new Set());
    }
    this.nodeToEdgesMap.get(nodeId)!.add(edgeId);
  }

  /** Updates the `d` attribute of a single edge path. */
  updateEdgePath(edgeId: string): void {
    const edge = this.edgeMap.get(edgeId);
    const pathElement = this.edgePathMap.get(edgeId);
    const nodeMap = this.nodeMap;

    if (!edge || !pathElement || !nodeMap) {
      return;
    }

    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) {
      return;
    }

    const sourceCenter = { x: source.currentX, y: source.currentY };
    const targetCenter = { x: target.currentX, y: target.currentY };

    const start = getConnectionPoint(
      {
        x: source.currentX,
        y: source.currentY,
        nodeWidth: source.nodeWidth,
        nodeHeight: source.nodeHeight,
      },
      targetCenter
    );
    const end = getConnectionPoint(
      {
        x: target.currentX,
        y: target.currentY,
        nodeWidth: target.nodeWidth,
        nodeHeight: target.nodeHeight,
      },
      sourceCenter
    );

    pathElement.setAttribute('d', buildEdgePathData(start, end, sourceCenter, targetCenter));
    this.updateEdgeLabel(edge);
  }

  private updateEdgeLabel(edge: EdgeModel): void {
    const labelGroup = this.findEdgeLabelGroup(edge.id);
    if (!labelGroup) {
      return;
    }

    const midpoint = this.getPathMidpoint(edge.pathElement);
    if (!midpoint) {
      return;
    }

    labelGroup.setAttribute('transform', `translate(${midpoint.x}, ${midpoint.y})`);
  }

  private findEdgeLabelGroup(edgeId: string): SVGGElement | null {
    const labelGroups = [...this.svgElement.querySelectorAll('.edgeLabel')];

    for (const group of labelGroups) {
      if (!(group instanceof SVGGElement)) {
        continue;
      }

      const labels = [...group.querySelectorAll('.label')];
      const hasMatchingLabel = labels.some((label) => label.getAttribute('data-id') === edgeId);
      if (hasMatchingLabel) {
        return group;
      }
    }

    return null;
  }

  private getPathMidpoint(pathElement: SVGPathElement): { x: number; y: number } | null {
    try {
      const totalLength = pathElement.getTotalLength();
      const midpoint = pathElement.getPointAtLength(totalLength / 2);
      return { x: midpoint.x, y: midpoint.y };
    } catch {
      return null;
    }
  }

  /** Immediately updates all edges connected to the given nodes (deduplicated). */
  updateEdgesForNodes(nodeIds: Iterable<string>): void {
    const affectedEdgeIds = new Set<string>();

    for (const nodeId of nodeIds) {
      const edgeIds = this.nodeToEdgesMap.get(nodeId);
      if (!edgeIds) {
        continue;
      }

      for (const edgeId of edgeIds) {
        affectedEdgeIds.add(edgeId);
      }
    }

    for (const edgeId of affectedEdgeIds) {
      this.updateEdgePath(edgeId);
    }
  }

  /** Updates all edges. Used after applying overrides, undo/redo, or restoring layout. */
  updateAllEdges(): void {
    for (const edgeId of this.edgeMap.keys()) {
      this.updateEdgePath(edgeId);
    }
  }

  /** Schedules edge updates throttled via requestAnimationFrame. */
  scheduleEdgeUpdate(nodeIds: Iterable<string>): void {
    for (const nodeId of nodeIds) {
      this.pendingNodes.add(nodeId);
    }

    if (this.rafId !== null) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      const pendingNodes = new Set(this.pendingNodes);
      this.pendingNodes.clear();
      this.updateEdgesForNodes(pendingNodes);
    });
  }

  /**
   * Immediately flushes all pending edge updates.
   * Used on pointerup to ensure the final frame's edge paths are committed.
   */
  flushScheduledUpdate(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.pendingNodes.size === 0) {
      return;
    }

    const pendingNodes = new Set(this.pendingNodes);
    this.pendingNodes.clear();
    this.updateEdgesForNodes(pendingNodes);
  }

  /**
   * Legacy name — now behaves identically to flushScheduledUpdate().
   */
  cancelScheduledUpdate(): void {
    this.flushScheduledUpdate();
  }

  getEdgeMap(): Map<string, EdgeModel> {
    return this.edgeMap;
  }

  getNodeToEdgesMap(): Map<string, Set<string>> {
    return this.nodeToEdgesMap;
  }
}
