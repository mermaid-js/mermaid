import type { ScannedNode } from './types.js';

/**
 * 从节点 SVG <g> 元素的 transform 属性中解析 translate 坐标。
 * 格式: "translate(123.45, 67.89)"
 */
function parseTransform(element: SVGGElement): { x: number; y: number } | null {
  const transform = element.getAttribute('transform');
  if (!transform) {
    return null;
  }
  const match = /translate\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/.exec(transform);
  if (!match) {
    return null;
  }
  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2]),
  };
}

/**
 * 从 SVG DOM ID 中提取用户定义的节点 ID。
 *
 * DOM ID 格式: "diagramId-flowchart-nodeId-counter"
 * 例如: "mermaid-0-flowchart-A-0" → "A"
 *       "mermaid-0-flowchart-node-A-0" → "node-A"
 *
 * @param domId - SVG 元素的 DOM ID
 * @param diagramId - SVG 元素的 diagramId（如 "mermaid-0"）
 * @returns 用户节点 ID，如果无法提取则返回 null
 */
export function extractUserNodeId(domId: string, diagramId: string): string | null {
  const directPrefix = `${diagramId}-flowchart-`;
  let rest: string | null = null;

  if (domId.startsWith(directPrefix)) {
    rest = domId.slice(directPrefix.length);
  } else {
    const fallbackMatch = /(?:^|-)flowchart-(.+)$/.exec(domId);
    if (fallbackMatch) {
      rest = fallbackMatch[1];
    }
  }

  if (!rest) {
    return null;
  }

  const lastDash = rest.lastIndexOf('-');
  if (lastDash === -1) {
    return rest;
  }
  return rest.slice(0, lastDash);
}

/**
 * 累加从元素到 SVG 根元素之间所有祖先 <g> 的 translate 偏移。
 *
 * 这对于递归渲染的 cluster（子图）至关重要，因为 cluster 内的子节点
 * 坐标是相对于 cluster 自身的 transform 的，需要累加祖先偏移才能获得
 * 全局 viewBox 坐标。
 *
 * @param element - 要计算的元素
 * @param svgElement - SVG 根元素
 * @returns 所有祖先的累积 translate 偏移量
 */
export function getParentAccumulatedOffset(
  element: SVGGElement,
  svgElement: SVGElement
): { x: number; y: number } {
  let offsetX = 0;
  let offsetY = 0;
  let current: Element | null = element.parentElement;

  while (current && current !== svgElement) {
    if (current instanceof SVGGElement) {
      const pos = parseTransform(current);
      if (pos) {
        offsetX += pos.x;
        offsetY += pos.y;
      }
    }
    current = current.parentElement;
  }

  return { x: offsetX, y: offsetY };
}

/**
 * 获取节点的全局 viewBox 坐标（累加所有祖先 transform）。
 *
 * 节点的自身 transform 加上所有祖先 <g> 的 translate 偏移，
 * 得到节点 en SVG viewBox 坐标系中的绝对位置。
 *
 * @param element - 节点 <g> 元素
 * @param svgElement - SVG 根元素
 * @returns 全局 viewBox 坐标，如果无法解析则返回 null
 */
export function getAccumulatedPosition(
  element: SVGGElement,
  svgElement: SVGElement
): { x: number; y: number } | null {
  const localPos = parseTransform(element);
  if (!localPos) {
    return null;
  }

  const parentOffset = getParentAccumulatedOffset(element, svgElement);
  return {
    x: localPos.x + parentOffset.x,
    y: localPos.y + parentOffset.y,
  };
}

/**
 * SVG 节点扫描器 —— 扫描已渲染的 Mermaid SVG，提取所有可拖拽节点。
 */
export class NodeScanner {
  private svgElement: SVGElement;

  constructor(svgElement: SVGElement) {
    this.svgElement = svgElement;
  }

  /**
   * 扫描 SVG 中所有节点，建立 nodeId → 节点信息的映射。
   *
   * 定位逻辑：
   *   - 遍历所有 <g class="nodes"> 容器（兼容递归渲染的 cluster）
   *   - 遍历容器中所有带有 class "node" 的 <g> 子元素
   *   - 使用 getAccumulatedPosition 获取全局 viewBox 坐标
   *   - 按 userNodeId 去重，避免重复扫描
   */
  scan(): Map<string, ScannedNode> {
    const nodes = new Map<string, ScannedNode>();
    const diagramId = this.svgElement.id;

    const nodesContainers = this.svgElement.querySelectorAll('.nodes');
    if (nodesContainers.length === 0) {
      return nodes;
    }

    for (const nodesContainer of [...nodesContainers]) {
      const childElements = [...nodesContainer.querySelectorAll('g.node')];

      for (const el of childElements) {
        const gElement = el as SVGGElement;
        const domId = gElement.getAttribute('id');
        if (!domId) {
          continue;
        }

        const userNodeId = extractUserNodeId(domId, diagramId);
        if (!userNodeId) {
          continue;
        }

        if (nodes.has(userNodeId)) {
          continue;
        }

        const position = getAccumulatedPosition(gElement, this.svgElement);
        if (!position) {
          continue;
        }

        let nodeWidth = 100;
        let nodeHeight = 50;
        try {
          const bbox = gElement.getBBox();
          if (bbox.width > 0 && bbox.height > 0) {
            nodeWidth = bbox.width;
            nodeHeight = bbox.height;
          }
        } catch {
          // getBBox 失败时使用默认值
        }

        nodes.set(userNodeId, {
          element: gElement,
          userNodeId,
          currentX: position.x,
          currentY: position.y,
          nodeWidth,
          nodeHeight,
          locked: false,
        });
      }
    }

    return nodes;
  }

  /**
   * 根据指定的节点元素向上查找其所属的用户节点 ID。
   * 用户可能点击了节点内部的 <rect>、<foreignObject> 等子元素。
   *
   * @param target - 用户交互的 DOM 目标元素
   * @param _nodeMap - 当前节点映射（暂未使用）
   * @returns 用户节点 ID，如果目标不在可拖拽节点内则返回 null
   */
  findNodeIdFromTarget(
    target: EventTarget | null,
    _nodeMap: Map<string, ScannedNode>
  ): string | null {
    if (!target || !(target instanceof Element)) {
      return null;
    }

    let current: Element | null = target;
    while (current && current !== this.svgElement) {
      if (current instanceof SVGGElement && current.classList.contains('node')) {
        const domId = current.getAttribute('id');
        if (!domId) {
          return null;
        }
        const diagramId = this.svgElement.id;
        return extractUserNodeId(domId, diagramId);
      }
      if (current === this.svgElement) {
        break;
      }
      current = current.parentElement;
    }

    return null;
  }
}
