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
 * Locate the SVG `<g>` element for a given Mermaid node ID.
 *
 * The unified renderer prefixes every node domId with the diagram SVG element
 * id: `{diagramId}-{domType}-{nodeId}-{counter}`. We use substring search with
 * a trailing dash to prevent partial matches ("Order" vs "OrderItem").
 */
function findNodeElement(svgRoot: SVGSVGElement, nodeId: string): SVGGElement | null {
  const byFlow = svgRoot.querySelector<SVGGElement>(`[id*="-flowchart-${nodeId}-"]`);
  if (byFlow) {
    return byFlow;
  }
  const byClass = svgRoot.querySelector<SVGGElement>(`[id*="-classId-${nodeId}-"]`);
  if (byClass) {
    return byClass;
  }
  // Exclude internal parent/note spacer variants (contain "----")
  const byState = svgRoot.querySelector<SVGGElement>(`[id*="-state-${nodeId}-"]:not([id*="----"])`);
  if (byState) {
    return byState;
  }
  // Text fallback for older renderers or htmlLabels
  for (const g of svgRoot.querySelectorAll<SVGGElement>(
    'g.node, g.actor, g.label-container, g.stateGroup'
  )) {
    const label = g.querySelector<Element>('.nodeLabel, text');
    if (label?.textContent?.trim() === nodeId) {
      return g;
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
 * Parse a Mermaid edge ID to extract source and target node IDs.
 *
 * Supported formats:
 * - flowchart:    `L-SOURCE-TARGET-N`   (dash-delimited, prefix `L`)
 * - classDiagram: `id_SOURCE_TARGET_N`  (underscore-delimited, prefix `id`)
 * - stateDiagram: `edge0`, `edge1`, …  (opaque counter — returns null)
 *
 * Returns \{ source, target \} or null if the ID does not match any known scheme.
 */
function parseEdgeId(id: string): { source: string; target: string } | null {
  if (!id) {
    return null;
  }
  // flowchart: "L-SOURCE-TARGET-N"
  let m = /^L-(.+?)-(.+?)-\d+$/.exec(id);
  if (m) {
    return { source: m[1], target: m[2] };
  }
  // classDiagram: "id_SOURCE_TARGET_N"
  // Greedy first capture handles compound names (e.g. "OrderItem");
  // non-greedy second capture picks up the shortest token before _\d+$.
  m = /^id_(.+)_(.+?)_\d+$/.exec(id);
  if (m) {
    return { source: m[1], target: m[2] };
  }
  return null;
}

/**
 * Get the node's center coordinates in the SVG layout (dagre) coordinate space.
 * The unified renderer always sets `transform="translate(cx,cy)"` on every node
 * group via `positionNode()`, where \{cx,cy\} is the dagre layout centre.
 */
function getNodeCenter(nodeEl: SVGGElement): { x: number; y: number } | null {
  const m = /translate\(\s*([\d.Ee-]+)[\s,]+([\d.Ee-]+)\s*\)/.exec(
    nodeEl.getAttribute('transform') ?? ''
  );
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
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
  nodeId: string,
  alwaysShowIds: Set<string>
): SVGGElement[] {
  // Build a complete source→targets adjacency map from every parsed edge ID.
  // This covers both flowchart ("L-S-T-N") and classDiagram ("id_S_T_N").
  const adjacency = new Map<string, Set<string>>();
  const addEdge = (src: string, tgt: string) => {
    if (!adjacency.has(src)) {
      adjacency.set(src, new Set());
    }
    adjacency.get(src)!.add(tgt);
  };
  svgRoot.querySelectorAll<SVGGElement>('.edgePath[id]').forEach((el) => {
    const parsed = parseEdgeId(el.id);
    if (parsed) {
      addEdge(parsed.source, parsed.target);
    }
  });
  svgRoot.querySelectorAll<SVGGElement>('[data-edge="true"][data-id]').forEach((el) => {
    const parsed = parseEdgeId((el as HTMLElement).dataset.id ?? '');
    if (parsed) {
      addEdge(parsed.source, parsed.target);
    }
  });

  if (adjacency.size > 0) {
    // BFS: collect the full transitive closure of nodes reachable from nodeId.
    // Nodes in alwaysShowIds act as barriers: they are neither hidden nor
    // recursed into, so their entire subtree stays visible.
    const visited = new Set<string>([nodeId]);
    const queue: string[] = [nodeId];
    const toHide: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (alwaysShowIds.has(current)) {
        continue;
      } // exempt — keep visible, stop branch
      if (current !== nodeId) {
        toHide.push(current);
      }
      adjacency.get(current)?.forEach((target) => {
        if (!visited.has(target)) {
          visited.add(target);
          queue.push(target);
        }
      });
    }
    return toHide.flatMap((tid) => {
      // Node domIds are prefixed: "{diagramId}-{type}-{nodeId}-{counter}"
      const el =
        svgRoot.querySelector<SVGGElement>(`[id*="-flowchart-${tid}-"]`) ??
        svgRoot.querySelector<SVGGElement>(`[id*="-classId-${tid}-"]`) ??
        svgRoot.querySelector<SVGGElement>(`[id*="-state-${tid}-"]:not([id*="----"])`);
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

/**
 * Refit the SVG viewBox and height to the bounding box of all currently
 * visible nodes, so the diagram truly shrinks / expands on collapse / expand.
 *
 * Uses getBoundingClientRect (screen space) converted to SVG space via the
 * inverse screen CTM — reliable across scroll positions and CSS transforms.
 */
function fitSvgToContent(svg: SVGSVGElement): void {
  try {
    // getBBox() on the root <g> returns the tight bounding box of ALL visible
    // SVG content (modern browsers exclude display:none descendants per SVG2).
    // This is simpler and more reliable than enumerating specific node classes,
    // because it also captures edge paths, pseudo-states ([*]), markers, etc.
    const rootG = svg.querySelector<SVGGElement>(':scope > g');
    if (!rootG) {
      return;
    }
    const bbox = rootG.getBBox();
    if (!bbox.width && !bbox.height) {
      return;
    }
    const pad = 16;
    const vw = bbox.width + pad * 2;
    const vh = bbox.height + pad * 2;
    svg.setAttribute('viewBox', `${bbox.x - pad} ${bbox.y - pad} ${vw} ${vh}`);
    svg.style.height = `${vh}px`;
    svg.style.maxWidth = `${vw}px`;
  } catch {
    /* layout not ready */
  }
}

/** Attach a collapse/expand toggle to a node. */
function attachCollapsible(
  svgRoot: SVGSVGElement,
  nodeEl: SVGGElement,
  nodeId: string,
  defaultState: 'expanded' | 'collapsed',
  alwaysShowIds: Set<string> = new Set<string>()
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
  const downstreamNodes = findDownstreamNodes(svgRoot, nodeEl, nodeId, alwaysShowIds);

  // Build the full set of node IDs whose outgoing edges should be hidden:
  // the collapsed node itself PLUS all downstream nodes (not exempt ones).
  const hiddenSourceIds = new Set<string>([nodeId]);
  downstreamNodes.forEach((n) => {
    const m = /-(?:flowchart|classId|state)-(.+)-\d+$/.exec(n.getAttribute('id') ?? '');
    if (m) {
      hiddenSourceIds.add(m[1]);
    }
  });

  // Decide whether an edge should be hidden.
  // Rules:
  //   1. Source must be in hiddenSourceIds.
  //   2. Target must NOT be in alwaysShowIds (edges leading to exempt nodes stay visible).
  const shouldHideEdge = (parsed: { source: string; target: string } | null): boolean => {
    if (!parsed) {
      return false;
    }
    if (!hiddenSourceIds.has(parsed.source)) {
      return false;
    }
    if (alwaysShowIds.has(parsed.target)) {
      return false;
    } // keep edge to exempt node
    return true;
  };

  // Collect ALL edge elements to be hidden.  Three passes + geometry fallback:
  //   Old renderer:  g.edgePath / g.edgeLabel carry the raw id directly.
  //   Unified:       path carries raw id in data-id; labels are g.edgeLabel > g.label[data-id].
  //   Geometry:      opaque edge IDs (stateDiagram "edge0" etc.) — match by first data-point.
  const outgoingEdges: SVGGElement[] = [
    ...svgRoot.querySelectorAll<SVGGElement>('.edgePath[id], .edgeLabel[id]'),
  ].filter((el) => shouldHideEdge(parseEdgeId(el.id)));

  svgRoot.querySelectorAll<SVGGElement>('[data-edge="true"][data-id]').forEach((el) => {
    if (shouldHideEdge(parseEdgeId((el as HTMLElement).dataset.id ?? ''))) {
      outgoingEdges.push(el);
    }
  });

  svgRoot.querySelectorAll<SVGGElement>('g.edgeLabel').forEach((labelGroup) => {
    const rawId = labelGroup.querySelector<HTMLElement>('g.label[data-id]')?.dataset?.id;
    if (shouldHideEdge(rawId ? parseEdgeId(rawId) : null)) {
      outgoingEdges.push(labelGroup);
    }
  });

  if (outgoingEdges.length === 0) {
    // Geometry fallback — match by pts[0] proximity to any hidden-node center.
    const hiddenCenters: { x: number; y: number }[] = [];
    const c0 = getNodeCenter(nodeEl);
    if (c0) {
      hiddenCenters.push(c0);
    }
    downstreamNodes.forEach((n) => {
      const nc = getNodeCenter(n);
      if (nc) {
        hiddenCenters.push(nc);
      }
    });
    // Collect centers of exempt nodes so we can keep edges that reach them.
    const exemptCenters: { x: number; y: number }[] = [];
    alwaysShowIds.forEach((eid) => {
      const eel = findNodeElement(svgRoot, eid);
      if (eel) {
        const nc = getNodeCenter(eel);
        if (nc) {
          exemptCenters.push(nc);
        }
      }
    });
    if (hiddenCenters.length > 0) {
      const tol = 60;
      const matchedIds = new Set<string>();
      svgRoot.querySelectorAll<SVGGElement>('[data-edge="true"][data-points]').forEach((el) => {
        try {
          const pts = JSON.parse(atob((el as HTMLElement).getAttribute('data-points') ?? '')) as {
            x: number;
            y: number;
          }[];
          const p0 = pts?.[0];
          const pLast = pts?.[pts.length - 1];
          if (!p0) {
            return;
          }
          const srcMatch = hiddenCenters.some(
            (hc) => Math.abs(p0.x - hc.x) < tol && Math.abs(p0.y - hc.y) < tol
          );
          if (!srcMatch) {
            return;
          }
          // Don't hide edges whose last point is near an exempt node's center.
          const tgtExempt =
            pLast &&
            exemptCenters.some(
              (ec) => Math.abs(pLast.x - ec.x) < tol && Math.abs(pLast.y - ec.y) < tol
            );
          if (tgtExempt) {
            return;
          }
          outgoingEdges.push(el);
          const eid = (el as HTMLElement).getAttribute('data-id');
          if (eid) {
            matchedIds.add(eid);
          }
        } catch {
          /* ignore malformed data-points */
        }
      });
      if (matchedIds.size > 0) {
        svgRoot.querySelectorAll<SVGGElement>('g.edgeLabel').forEach((labelGroup) => {
          const rawId = labelGroup.querySelector<HTMLElement>('g.label[data-id]')?.dataset?.id;
          if (rawId && matchedIds.has(rawId)) {
            outgoingEdges.push(labelGroup);
          }
        });
      }
    }
  }

  const setVisibility = (show: boolean) => {
    downstreamNodes.forEach((n) => {
      n.style.display = show ? '' : 'none';
    });
    // Only outgoing edges from hidden nodes are toggled; incoming edges
    // remain visible so the collapsed node stays connected to its parents.
    outgoingEdges.forEach((el) => {
      el.style.display = show ? '' : 'none';
    });
    icon.textContent = show ? '▼' : '▶';
    // Refit the SVG canvas so the diagram truly collapses / expands.
    fitSvgToContent(svgRoot);
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

  // Gather all node IDs that must always remain visible (alwaysShow / ignoreCollapse).
  // These act as BFS barriers: downstream traversal stops at them, their edges
  // leading to them are kept visible, and their own subtrees are never hidden.
  const alwaysShowIds = new Set<string>(
    interactions
      .filter(({ props }) => props.alwaysShow === true || props.ignoreCollapse === true)
      .map(({ nodeId }) => nodeId)
  );

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
      attachCollapsible(svgElement, nodeEl, nodeId, state, alwaysShowIds);
    }
  }
}
