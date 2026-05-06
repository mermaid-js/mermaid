/** Parses the translate coordinates from a node SVG <g> element's transform attribute.
 * Format: "translate(123.45, 67.89)"
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
 * Extracts the user-defined node ID from an SVG DOM ID.
 *
 * DOM ID format: "diagramId-flowchart-nodeId-counter"
 * Examples:
 *   "mermaid-0-flowchart-A-0"       → "A"
 *   "mermaid-0-flowchart-node-A-0"  → "node-A"
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
 * Accumulates the translate offset of all ancestor <g> elements between
 * the given element and the SVG root.
 *
 * This is critical for recursively rendered clusters (subgraphs), because
 * child nodes inside a cluster are positioned relative to the cluster's
 * own transform.  The ancestor offsets must be summed to obtain the
 * absolute viewBox coordinate.
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
 * Gets a node's absolute viewBox coordinate by accumulating all ancestor
 * transforms.
 *
 * The node's own transform plus all ancestor <g> translate offsets yields
 * the node's absolute position in the SVG viewBox coordinate space.
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
 * SVG node scanner - scans a rendered Mermaid SVG and extracts all
 * draggable node information.
 */
export class NodeScanner {
  private svgElement: SVGElement;

  constructor(svgElement: SVGElement) {
    this.svgElement = svgElement;
  }

  /**
   * Scans all nodes in the SVG and builds a nodeId → node-info map.
   *
   * Strategy:
   *   - Iterates over all <g class="nodes"> containers (compatible with
   *     recursively rendered clusters)
   *   - Finds all <g> children with class "node" inside each container
   *   - Uses getAccumulatedPosition to get the absolute viewBox coordinate
   *   - Deduplicates by userNodeId
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
          // Use defaults when getBBox fails
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
   * Walks up the DOM tree from a target element to find the containing
   * node's user ID.  Handles cases where the user clicks on a child
   * element like <rect> or <foreignObject> inside the node <g>.
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
