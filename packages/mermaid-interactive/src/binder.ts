import type { InteractionDef } from './types.js';

// ---------------------------------------------------------------------------
// Metadata parsing
// ---------------------------------------------------------------------------

const INTERACT_RE = /%% @interact (\w+) ({[^\n]*})/g;

/**
 * Parse all `%% @interact` metadata comments from a diagram source string.
 * These comments are injected by the preprocessor.
 */
export function parseInteractions(diagramSource: string): InteractionDef[] {
  const interactions: InteractionDef[] = [];
  const re = new RegExp(INTERACT_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(diagramSource)) !== null) {
    try {
      interactions.push({ nodeId: m[1], props: JSON.parse(m[2]) });
    } catch {
      // Malformed JSON — skip silently
    }
  }
  return interactions;
}

// ---------------------------------------------------------------------------
// SVG node lookup
// ---------------------------------------------------------------------------

/**
 * Attempt to locate the SVG `<g>` element for a given Mermaid node ID.
 * Mermaid assigns IDs like `flowchart-{nodeId}-{n}` to node groups.
 */
function findNodeElement(svgRoot: SVGSVGElement, nodeId: string): SVGGElement | null {
  // Primary: id-based lookup (flowchart renderer)
  const byId = svgRoot.querySelector<SVGGElement>(`[id*="flowchart-${nodeId}-"]`);
  if (byId) {
    return byId;
  }

  // Secondary: class-based + text content match
  const nodes = [...svgRoot.querySelectorAll<SVGGElement>('g.node')];
  for (const node of nodes) {
    const labelEl = node.querySelector<SVGTextElement | SVGForeignObjectElement>(
      'text, foreignObject'
    );
    const text = labelEl?.textContent?.trim() ?? '';
    if (text === nodeId) {
      return node;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

/** Create and attach a floating tooltip div to a node <g> element. */
function attachTooltip(el: SVGGElement, text: string): void {
  const tooltip = document.createElement('div');
  tooltip.className = 'mermaid-interactive-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.textContent = text;
  Object.assign(tooltip.style, {
    position: 'fixed',
    background: '#1f2937',
    color: '#f9fafb',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    lineHeight: '1.5',
    pointerEvents: 'none',
    zIndex: '9999',
    display: 'none',
    maxWidth: '240px',
    whiteSpace: 'pre-wrap',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
  });
  document.body.appendChild(tooltip);

  el.style.cursor = 'help';

  const show = (e: MouseEvent) => {
    tooltip.style.display = 'block';
    tooltip.style.left = `${e.clientX + 14}px`;
    tooltip.style.top = `${e.clientY - 10}px`;
  };
  const move = (e: MouseEvent) => {
    tooltip.style.left = `${e.clientX + 14}px`;
    tooltip.style.top = `${e.clientY - 10}px`;
  };
  const hide = () => {
    tooltip.style.display = 'none';
  };

  el.addEventListener('mouseenter', show as EventListener);
  el.addEventListener('mousemove', move as EventListener);
  el.addEventListener('mouseleave', hide);
}

// ---------------------------------------------------------------------------
// Collapsible nodes
// ---------------------------------------------------------------------------

/**
 * Parse a Mermaid edge group ID of the form "L-SOURCE-TARGET-N".
 * Returns \{ source, target \} or null if the ID does not match.
 */
function parseEdgeId(id: string): { source: string; target: string } | null {
  const m = /^L-(.+?)-(.+?)-\d+$/.exec(id);
  return m ? { source: m[1], target: m[2] } : null;
}

/**
 * Find the direct downstream nodes of a collapsible node using Mermaid's
 * edge ID scheme ("L-SOURCE-TARGET-N").
 *
 * Falls back to a Y-position heuristic when edge IDs are absent.
 */
function findDownstreamNodes(
  svgRoot: SVGSVGElement,
  parentEl: SVGGElement,
  nodeId: string
): SVGGElement[] {
  const targetIds = new Set<string>();

  // Primary: derive targets from Mermaid edge IDs
  svgRoot.querySelectorAll<SVGGElement>('.edgePath[id]').forEach((el) => {
    const parsed = parseEdgeId(el.id);
    if (parsed?.source === nodeId) {
      targetIds.add(parsed.target);
    }
  });

  if (targetIds.size > 0) {
    return [...targetIds].flatMap((tid) => {
      const el = svgRoot.querySelector<SVGGElement>(`[id*="flowchart-${tid}-"]`);
      return el ? [el] : [];
    });
  }

  // Fallback: Y-position heuristic (SVG without Mermaid-style edge IDs).
  // 'g.node' covers flowchart/classDiagram; 'g.stateGroup' covers stateDiagram-v2.
  const parentCy =
    parentEl.getBoundingClientRect().top + parentEl.getBoundingClientRect().height / 2;
  return [...svgRoot.querySelectorAll<SVGGElement>('g.node, g.stateGroup')].filter((n) => {
    if (n === parentEl) {
      return false;
    }
    const box = n.getBoundingClientRect();
    return box.top + box.height / 2 > parentCy;
  });
}

/** Attach a collapse/expand toggle to a node. */
function attachCollapsible(
  svgRoot: SVGSVGElement,
  nodeEl: SVGGElement,
  nodeId: string,
  defaultState: 'expanded' | 'collapsed'
): void {
  let expanded = defaultState !== 'collapsed';

  // Toggle indicator badge
  const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  badge.setAttribute('class', 'mermaid-interactive-toggle');
  badge.style.cursor = 'pointer';

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('r', '7');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('fill', '#6366f1');

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  icon.setAttribute('text-anchor', 'middle');
  icon.setAttribute('dominant-baseline', 'central');
  icon.setAttribute('font-size', '9');
  icon.setAttribute('fill', '#fff');
  icon.setAttribute('pointer-events', 'none');
  icon.textContent = expanded ? '▼' : '▶';

  badge.appendChild(circle);
  badge.appendChild(icon);

  // Position badge at top-right of node box
  const box = nodeEl.getBBox?.();
  if (box) {
    badge.setAttribute('transform', `translate(${box.x + box.width - 2},${box.y + 2})`);
  }
  nodeEl.appendChild(badge);
  nodeEl.style.cursor = 'pointer';

  // Resolve targets once at attach time while everything is visible.
  // Re-querying on each toggle fails for expand because hidden elements return
  // zero from getBoundingClientRect, preventing them from being found again.
  const downstreamNodes = findDownstreamNodes(svgRoot, nodeEl, nodeId);
  const outgoingEdges = [
    ...svgRoot.querySelectorAll<SVGGElement>('.edgePath[id], .edgeLabel[id]'),
  ].filter((el) => parseEdgeId(el.id)?.source === nodeId);

  const setVisibility = (show: boolean) => {
    downstreamNodes.forEach((n) => {
      n.style.display = show ? '' : 'none';
    });
    // Only outgoing edges are toggled — incoming edges (e.g. A→B) stay
    // visible so the collapsible node remains connected to its parents.
    outgoingEdges.forEach((el) => {
      el.style.display = show ? '' : 'none';
    });
    icon.textContent = show ? '▼' : '▶';
  };

  if (!expanded) {
    setVisibility(false);
  }

  const toggle = () => {
    expanded = !expanded;
    setVisibility(expanded);
  };

  nodeEl.addEventListener('click', toggle);
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });
}

// ---------------------------------------------------------------------------
// Cluster (subgraph) support
// ---------------------------------------------------------------------------

/** Find a Mermaid cluster element by subgraph ID. */
function findClusterElement(svgRoot: SVGSVGElement, nodeId: string): SVGGElement | null {
  return (
    svgRoot.querySelector<SVGGElement>(`[id="cluster_${nodeId}"]`) ??
    svgRoot.querySelector<SVGGElement>(`g.cluster[id$="_${nodeId}"]`) ??
    null
  );
}

/** Return all node <g> elements whose centre falls inside a cluster's bounding box. */
function findNodesInsideCluster(svgRoot: SVGSVGElement, clusterEl: SVGGElement): SVGGElement[] {
  const cb = clusterEl.getBoundingClientRect();
  return [...svgRoot.querySelectorAll<SVGGElement>('g.node')].filter((n) => {
    const b = n.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    return cx >= cb.left && cx <= cb.right && cy >= cb.top && cy <= cb.bottom;
  });
}

/** Collapse/expand an entire subgraph cluster and all edges crossing its boundary. */
function attachClusterCollapsible(
  svgRoot: SVGSVGElement,
  clusterEl: SVGGElement,
  nodeId: string,
  defaultState: 'expanded' | 'collapsed'
): void {
  let expanded = defaultState !== 'collapsed';

  // Resolve at attach time while all elements are visible
  const internalNodes = findNodesInsideCluster(svgRoot, clusterEl);
  const internalIds = new Set(
    internalNodes.map((n) => /flowchart-(\w+)-/.exec(n.id)?.[1]).filter(Boolean) as string[]
  );
  const relatedEdges = [
    ...svgRoot.querySelectorAll<SVGGElement>('.edgePath[id], .edgeLabel[id]'),
  ].filter((el) => {
    const parsed = parseEdgeId(el.id);
    return parsed && (internalIds.has(parsed.source) || internalIds.has(parsed.target));
  });

  const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  badge.setAttribute('class', 'mermaid-interactive-toggle');
  badge.style.cursor = 'pointer';

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('r', '7');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('fill', '#6366f1');

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  icon.setAttribute('text-anchor', 'middle');
  icon.setAttribute('dominant-baseline', 'central');
  icon.setAttribute('font-size', '9');
  icon.setAttribute('fill', '#fff');
  icon.setAttribute('pointer-events', 'none');
  icon.textContent = expanded ? '▼' : '▶';

  badge.appendChild(circle);
  badge.appendChild(icon);
  try {
    const box = clusterEl.getBBox();
    badge.setAttribute('transform', `translate(${box.x + box.width - 2},${box.y + 2})`);
  } catch {}
  clusterEl.appendChild(badge);
  clusterEl.style.cursor = 'pointer';

  const setVisibility = (show: boolean) => {
    internalNodes.forEach((n) => {
      n.style.display = show ? '' : 'none';
    });
    relatedEdges.forEach((el) => {
      el.style.display = show ? '' : 'none';
    });
    icon.textContent = show ? '▼' : '▶';
  };

  if (!expanded) {
    setVisibility(false);
  }

  const toggle = () => {
    expanded = !expanded;
    setVisibility(expanded);
  };

  clusterEl.addEventListener('click', toggle);
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Bind all interactions defined via `%% @interact` comments to the
 * corresponding nodes in a rendered Mermaid SVG element.
 *
 * Call this after `mermaid.render()` has produced the SVG DOM.
 *
 * @param svgElement - The root `<svg>` element produced by Mermaid
 * @param diagramSource - The original (preprocessed) diagram source text containing `%% @interact` comments
 */
export function bind(svgElement: SVGSVGElement, diagramSource: string): void {
  const interactions = parseInteractions(diagramSource);

  for (const { nodeId, props } of interactions) {
    const nodeEl = findNodeElement(svgElement, nodeId);

    if (!nodeEl) {
      // Try cluster (subgraph) fallback when the ID matches a <g class="cluster">
      if (props.collapsible) {
        const clusterEl = findClusterElement(svgElement, nodeId);
        if (clusterEl) {
          const state = props.defaultState! ?? 'expanded';
          attachClusterCollapsible(svgElement, clusterEl, nodeId, state);
        }
      }
      continue;
    }

    if (props.tooltip) {
      attachTooltip(nodeEl, String(props.tooltip));
    }

    if (props.collapsible) {
      const state = props.defaultState! ?? 'expanded';
      attachCollapsible(svgElement, nodeEl, nodeId, state);
    }
  }
}
