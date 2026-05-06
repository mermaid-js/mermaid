import type { EdgeModel, ScannedNode } from './types.js';

interface EdgeParts {
  edgeId: string;
  pathElement: SVGPathElement;
  classAttr: string;
  sourceAttr: string | null;
  targetAttr: string | null;
}

/**
 * 从 class 属性中提取 LS_xxx / LS-xxx 或 LE_xxx / LE-xxx 对应的用户节点 ID。
 *
 * Mermaid 渲染后的 class 常见形态：
 *   - "flowchart-link LS_A LE_B"
 *   - "flowchart-link LS-A LE-B"
 *   - "flowchart-link LS_A-0 LE_B-0"
 *
 * 末尾数字是 Mermaid 内部计数器，需要去除以恢复用户节点 ID。
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
 * 计算边连接到节点外框边缘的交点。
 *
 * 这里使用节点中心到目标中心的射线，与节点外框做一次轻量相交计算。
 * 不做避障，也不依赖 Mermaid 布局引擎，只根据节点当前矩形范围推导。
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

function buildEdgePathD(
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

  // 沿边方向的控制点距离（约 1/3 边长）
  const cpDist = edgeDist * 0.35;

  // 根据 center-to-center 方向决定弧线弯曲侧
  const ccDx = targetCenter.x - sourceCenter.x;
  const ccDy = targetCenter.y - sourceCenter.y;
  const cross = ux * ccDy - uy * ccDx;
  const sign = cross >= 0 ? 1 : -1;

  // 轻微弧线偏移（沿垂直于边的方向）
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

  // 尝试处理 dagre 内部前缀格式 (如 flowchart-A-0)
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
 * SVG 边更新器 —— 基于节点当前位置重算受影响边的 path d。
 *
 * 设计约束：
 * 1. 不重新渲染 Mermaid
 * 2. 不重新执行 layout
 * 3. 只修改现有 path 的 d 属性，保留 marker / stroke / class / style
 */
export class EdgeUpdater {
  private svgElement: SVGElement;
  /** edgeId -\> EdgeModel */
  private edgeMap = new Map<string, EdgeModel>();
  /** edgeId -\> 对应 path 元素 */
  private edgePathMap = new Map<string, SVGPathElement>();
  /** nodeId -\> 相关 edgeId 集合 */
  private nodeToEdgesMap = new Map<string, Set<string>>();
  /** 当前节点映射引用 */
  private nodeMap: Map<string, ScannedNode> | null = null;
  /** rAF 句柄 */
  private rAFId: number | null = null;
  /** 本帧待更新节点 */
  private pendingNodes = new Set<string>();

  constructor(svgElement: SVGElement) {
    this.svgElement = svgElement;
  }

  /**
   * 从 Mermaid 渲染后的 SVG 构建边关系映射。
   *
   * 优先读取 Mermaid 渲染时写入的 data-source / data-target。
   * 兼容旧版 `LS_*` / `LE_*` 以及 `LS-*` / `LE-*` class，
   * 最后回退解析自动生成的 `L_<source>_<target>_<counter>` 边 ID。
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

  /**
   * 仅更新单条边的 d 属性。
   */
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

    pathElement.setAttribute('d', buildEdgePathD(start, end, sourceCenter, targetCenter));
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

  /**
   * 立即更新一组节点相关的全部边，自动去重。
   */
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

  /**
   * 全量更新所有边。
   *
   * 用于应用 override、撤销重做、恢复布局等场景。
   */
  updateAllEdges(): void {
    for (const edgeId of this.edgeMap.keys()) {
      this.updateEdgePath(edgeId);
    }
  }

  /**
   * 通过 rAF 节流边更新。
   */
  scheduleEdgeUpdate(nodeIds: Iterable<string>): void {
    for (const nodeId of nodeIds) {
      this.pendingNodes.add(nodeId);
    }

    if (this.rAFId !== null) {
      return;
    }

    this.rAFId = requestAnimationFrame(() => {
      this.rAFId = null;
      const pendingNodes = new Set(this.pendingNodes);
      this.pendingNodes.clear();
      this.updateEdgesForNodes(pendingNodes);
    });
  }

  /**
   * 立即刷新所有挂起的边更新。
   *
   * 主要用于 pointerup 时确保最后一帧边路径已经落地。
   */
  flushScheduledUpdate(): void {
    if (this.rAFId !== null) {
      cancelAnimationFrame(this.rAFId);
      this.rAFId = null;
    }

    if (this.pendingNodes.size === 0) {
      return;
    }

    const pendingNodes = new Set(this.pendingNodes);
    this.pendingNodes.clear();
    this.updateEdgesForNodes(pendingNodes);
  }

  /**
   * 兼容旧调用名：现在语义是“先取消 rAF，再立刻刷新挂起更新”。
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
