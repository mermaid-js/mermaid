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
  // Exclude .cluster elements — subgraph clusters share the same ID format as
  // regular nodes but must be routed to attachClusterCollapsible, not attachCollapsible.
  const byFlow = svgRoot.querySelector<SVGGElement>(`[id*="-flowchart-${nodeId}-"]:not(.cluster)`);
  if (byFlow) {
    return byFlow;
  }
  const byClass = svgRoot.querySelector<SVGGElement>(`[id*="-classId-${nodeId}-"]:not(.cluster)`);
  if (byClass) {
    return byClass;
  }
  // Exclude internal parent/note spacer variants (contain "----") and clusters
  const byState = svgRoot.querySelector<SVGGElement>(
    `[id*="-state-${nodeId}-"]:not([id*="----"]):not(.cluster)`
  );
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
    const parsed = parseEdgeId(el.getAttribute('data-id') ?? '');
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
  // IDs of downstream nodes that are truly hidden — used to catch inbound edges
  // from external sources into hidden targets (e.g. A→D1 where D1 is hidden).
  const hiddenTargetIds = new Set<string>();
  downstreamNodes.forEach((n) => {
    const m = /-(?:flowchart|classId|state)-(.+)-\d+$/.exec(n.getAttribute('id') ?? '');
    if (m) {
      hiddenTargetIds.add(m[1]);
    }
  });

  // Hide an edge if its source OR target is in the hidden set, unless target is exempt.
  const shouldHideEdge = (parsed: { source: string; target: string } | null): boolean => {
    if (!parsed) {
      return false;
    }
    if (alwaysShowIds.has(parsed.target)) {
      return false;
    }
    return hiddenSourceIds.has(parsed.source) || hiddenTargetIds.has(parsed.target);
  };

  // Collect ALL edge elements to be hidden.  Three passes + geometry fallback:
  //   Old renderer:  g.edgePath / g.edgeLabel carry the raw id directly.
  //   Unified:       path carries raw id in data-id; labels are g.edgeLabel > g.label[data-id].
  //   Geometry:      opaque edge IDs (stateDiagram "edge0" etc.) — match by first data-point.
  const outgoingEdges: SVGGElement[] = [
    ...svgRoot.querySelectorAll<SVGGElement>('.edgePath[id], .edgeLabel[id]'),
  ].filter((el) => shouldHideEdge(parseEdgeId(el.id)));

  svgRoot.querySelectorAll<SVGGElement>('[data-edge="true"][data-id]').forEach((el) => {
    if (shouldHideEdge(parseEdgeId(el.getAttribute('data-id') ?? ''))) {
      outgoingEdges.push(el);
    }
  });

  svgRoot.querySelectorAll<SVGGElement>('g.edgeLabel').forEach((labelGroup) => {
    const rawId = labelGroup.querySelector('g.label[data-id]')?.getAttribute('data-id');
    if (shouldHideEdge(rawId ? parseEdgeId(rawId) : null)) {
      outgoingEdges.push(labelGroup);
    }
  });

  if (outgoingEdges.length === 0) {
    // Geometry fallback — match by pts[0]/pLast proximity to hidden-node centers.
    // srcMatch: p0 near any hidden node (includes collapsed node B itself).
    // tgtMatch: pLast near a DOWNSTREAM (truly-hidden) node only — NOT nodeEl
    //           because nodeEl stays visible, and we must not hide A→B.
    const hiddenCenters: { x: number; y: number }[] = [];
    const c0 = getNodeCenter(nodeEl);
    if (c0) {
      hiddenCenters.push(c0);
    }
    const downstreamCenters: { x: number; y: number }[] = [];
    downstreamNodes.forEach((n) => {
      const nc = getNodeCenter(n);
      if (nc) {
        hiddenCenters.push(nc);
        downstreamCenters.push(nc);
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
          const pts = JSON.parse(atob(el.getAttribute('data-points') ?? '')) as {
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
          // Use downstreamCenters (not hiddenCenters) for tgtMatch so we don't
          // accidentally hide edges whose target is the collapsed node itself.
          const tgtMatch =
            pLast &&
            downstreamCenters.some(
              (hc) => Math.abs(pLast.x - hc.x) < tol && Math.abs(pLast.y - hc.y) < tol
            );
          if (!srcMatch && !tgtMatch) {
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
          const eid = el.getAttribute('data-id');
          if (eid) {
            matchedIds.add(eid);
          }
        } catch {
          /* ignore malformed data-points */
        }
      });
      if (matchedIds.size > 0) {
        svgRoot.querySelectorAll<SVGGElement>('g.edgeLabel').forEach((labelGroup) => {
          const rawId = labelGroup.querySelector('g.label[data-id]')?.getAttribute('data-id');
          if (rawId && matchedIds.has(rawId)) {
            outgoingEdges.push(labelGroup);
          }
        });
      }
    }
  }

  // Collect g.edgeTerminals (multiplicity labels e.g. "1", "0..*").
  // Strategy: extract the start/end SVG coordinates of already-hidden edge paths
  // (from data-points) and match terminals whose transform position is within
  // 40 units of those endpoints.  This is precise regardless of node size.
  // Falls back to downstream node centres (tol 120) when no edge paths are found.
  {
    const hiddenPathSet = new Set<Element>(outgoingEdges);
    const edgeEndpoints: { x: number; y: number }[] = [];
    svgRoot.querySelectorAll<SVGGElement>('[data-edge="true"][data-points]').forEach((el) => {
      if (!hiddenPathSet.has(el)) {
        return;
      }
      try {
        const pts = JSON.parse(atob(el.getAttribute('data-points') ?? '')) as {
          x: number;
          y: number;
        }[];
        const p0 = pts?.[0];
        const pLast = pts?.[pts.length - 1];
        if (p0) {
          edgeEndpoints.push(p0);
        }
        if (pLast) {
          edgeEndpoints.push(pLast);
        }
      } catch {
        /* ignore */
      }
    });

    const searchPoints = edgeEndpoints;
    let tol = 40;
    if (searchPoints.length === 0) {
      // Fallback: downstream node centres
      downstreamNodes.forEach((n) => {
        const c = getNodeCenter(n);
        if (c) {
          searchPoints.push(c);
        }
      });
      tol = 120;
    }

    if (searchPoints.length > 0) {
      svgRoot.querySelectorAll<SVGGElement>('g.edgeTerminals').forEach((term) => {
        const tc = getNodeCenter(term);
        if (!tc) {
          return;
        }
        const near = searchPoints.some(
          (ep) => Math.abs(tc.x - ep.x) < tol && Math.abs(tc.y - ep.y) < tol
        );
        if (near) {
          outgoingEdges.push(term);
        }
      });
    }
  }

  // Find clusters that become entirely empty when downstreamNodes are hidden.
  // Their decoration (background rect + label) should also be toggled so the
  // cluster border doesn't float around with nothing inside it.
  const hiddenNodeSet = new Set<SVGGElement>([nodeEl, ...downstreamNodes]);
  const emptiedClusterDecorations: SVGElement[][] = [];
  svgRoot.querySelectorAll<SVGGElement>('g.cluster').forEach((clusterEl) => {
    const clusterNodes = findNodesInsideCluster(svgRoot, clusterEl);
    if (clusterNodes.length > 0 && clusterNodes.every((n) => hiddenNodeSet.has(n))) {
      emptiedClusterDecorations.push(
        [...clusterEl.children].filter(
          (c) => !c.classList.contains('mermaid-interactive-toggle')
        ) as SVGElement[]
      );
    }
  });

  const setVisibility = (show: boolean) => {
    downstreamNodes.forEach((n) => {
      n.style.display = show ? '' : 'none';
    });
    // Only outgoing edges from hidden nodes are toggled; incoming edges
    // remain visible so the collapsed node stays connected to its parents.
    outgoingEdges.forEach((el) => {
      el.style.display = show ? '' : 'none';
    });
    emptiedClusterDecorations.forEach((dec) => {
      dec.forEach((c) => {
        c.style.display = show ? '' : 'none';
      });
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
  // Unified renderer: cluster <g> elements carry the same domId format as
  // regular nodes — "{diagramId}-{flowchart|classId|state}-{nodeId}-{counter}"
  // — but with class="cluster" instead of class="node".
  return (
    svgRoot.querySelector<SVGGElement>(`g.cluster[id*="-flowchart-${nodeId}-"]`) ??
    svgRoot.querySelector<SVGGElement>(`g.cluster[id*="-classId-${nodeId}-"]`) ??
    svgRoot.querySelector<SVGGElement>(`g.cluster[id*="-state-${nodeId}-"]`) ??
    // Old renderer: "cluster_SG1" or ends-with separator variant
    svgRoot.querySelector<SVGGElement>(`[id="cluster_${nodeId}"]`) ??
    svgRoot.querySelector<SVGGElement>(`g.cluster[id$="_${nodeId}"]`) ??
    // Unified renderer for subgraphs: subgraph nodes have no domId type prefix,
    // so they render as "{diagramId}-{nodeId}" (e.g. "mermaid-4-SG1").
    svgRoot.querySelector<SVGGElement>(`g.cluster[id$="-${nodeId}"]`) ??
    null
  );
}

/** Return all node <g> elements whose centre falls inside a cluster's bounding box.
 *
 * The cluster <g> has no SVG transform, so getBBox() on it gives coordinates in
 * root SVG space.  Regular node <g> elements have transform="translate(cx,cy)"
 * where (cx,cy) is the dagre layout centre — getBBox() on the <g> itself returns
 * local coordinates, making the centre always (0,0) which is wrong.  We parse
 * the translate() attribute via getNodeCenter() to get the node centre in root
 * SVG space, enabling a correct comparison.
 */
function findNodesInsideCluster(svgRoot: SVGSVGElement, clusterEl: SVGGElement): SVGGElement[] {
  try {
    const cb = clusterEl.getBBox();
    if (cb.width > 0 || cb.height > 0) {
      return [...svgRoot.querySelectorAll<SVGGElement>('g.node')].filter((n) => {
        const c = getNodeCenter(n);
        if (c) {
          return c.x >= cb.x && c.x <= cb.x + cb.width && c.y >= cb.y && c.y <= cb.y + cb.height;
        }
        // Node has no translate — fall back to viewport comparison
        const cb2 = clusterEl.getBoundingClientRect();
        const b = n.getBoundingClientRect();
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        return cx >= cb2.left && cx <= cb2.right && cy >= cb2.top && cy <= cb2.bottom;
      });
    }
  } catch {
    /* getBBox unavailable */
  }
  // Final fallback: viewport coordinates
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
  // Extract the logical node ID from a unified-renderer domId:
  // "{diagramId}-{flowchart|classId|state}-{nodeId}-{counter}"
  const internalIds = new Set(
    internalNodes
      .map((n) => /-(?:flowchart|classId|state)-(.+?)-\d+$/.exec(n.id)?.[1])
      .filter(Boolean) as string[]
  );
  const relatedEdges: SVGGElement[] = [];
  // Only hide edges whose SOURCE is inside the cluster.
  // Inbound edges (source external, target internal) stay visible so the
  // collapsed cluster stub remains visually connected to its parents.
  // Old renderer:
  svgRoot.querySelectorAll<SVGGElement>('.edgePath[id], .edgeLabel[id]').forEach((el) => {
    const parsed = parseEdgeId(el.id);
    if (parsed && internalIds.has(parsed.source)) {
      relatedEdges.push(el);
    }
  });
  // Unified renderer edge paths:
  svgRoot.querySelectorAll<SVGGElement>('[data-edge="true"][data-id]').forEach((el) => {
    const parsed = parseEdgeId(el.getAttribute('data-id') ?? '');
    if (parsed && internalIds.has(parsed.source)) {
      relatedEdges.push(el);
    }
  });
  // Unified renderer edge labels:
  svgRoot.querySelectorAll<SVGGElement>('g.edgeLabel').forEach((labelGroup) => {
    const rawId = labelGroup.querySelector('g.label[data-id]')?.getAttribute('data-id');
    if (!rawId) {
      return;
    }
    const parsed = parseEdgeId(rawId);
    if (parsed && internalIds.has(parsed.source)) {
      relatedEdges.push(labelGroup);
    }
  });

  // Geometry fallback: if ID-based passes found nothing (e.g. internalIds is empty
  // because node domIds use an unrecognised format), collect edges whose first or
  // last data-point is within tolerance of any internal node's layout centre.
  if (relatedEdges.length === 0 && internalNodes.length > 0) {
    const internalCenters = internalNodes.map((n) => getNodeCenter(n)).filter(Boolean) as {
      x: number;
      y: number;
    }[];
    if (internalCenters.length > 0) {
      const tol = 60;
      const matchedIds = new Set<string>();
      svgRoot.querySelectorAll<SVGGElement>('[data-edge="true"][data-points]').forEach((el) => {
        try {
          const pts = JSON.parse(atob(el.getAttribute('data-points') ?? '')) as {
            x: number;
            y: number;
          }[];
          const p0 = pts?.[0];
          if (!p0) {
            return;
          }
          // Only hide edges whose source (p0) is near an internal node.
          // Inbound edges whose endpoint is near an internal node stay visible.
          const sourceIsInternal = internalCenters.some(
            (c) => Math.abs(p0.x - c.x) < tol && Math.abs(p0.y - c.y) < tol
          );
          if (sourceIsInternal) {
            relatedEdges.push(el);
            const eid = el.getAttribute('data-id');
            if (eid) {
              matchedIds.add(eid);
            }
          }
        } catch {
          /* ignore malformed data-points */
        }
      });
      if (matchedIds.size > 0) {
        svgRoot.querySelectorAll<SVGGElement>('g.edgeLabel').forEach((labelGroup) => {
          const rawId = labelGroup.querySelector('g.label[data-id]')?.getAttribute('data-id');
          if (rawId && matchedIds.has(rawId)) {
            relatedEdges.push(labelGroup);
          }
        });
      }
    }
  }

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

  // Background rect — resized to a compact stub on collapse.
  // For 'rect' clusters: direct <rect> child of clusterEl.
  // For 'roundedWithTitle' clusters: <rect> inside the first child <g> (outerRectG).
  const bgRect =
    clusterEl.querySelector<SVGRectElement>(':scope > rect') ??
    clusterEl.querySelector<SVGRectElement>(':scope > g:first-child > rect:first-child');
  // Inner fill rect (roundedWithTitle only — classed 'inner') — hidden on collapse.
  const innerRect = clusterEl.querySelector<SVGRectElement>('rect.inner');
  // Save original bg-rect dimensions for restore on expand.
  const origBgAttrs = bgRect
    ? {
        x: bgRect.getAttribute('x') ?? '0',
        y: bgRect.getAttribute('y') ?? '0',
        w: bgRect.getAttribute('width') ?? '100',
        h: bgRect.getAttribute('height') ?? '100',
      }
    : null;
  const origBadgeTransform = badge.getAttribute('transform') ?? '';
  // Measure the cluster label so the compact stub fits the title text.
  const labelGroupEl = clusterEl.querySelector<SVGGElement>('.cluster-label');
  let compactW = 140,
    compactH = 60;
  if (labelGroupEl) {
    try {
      const lb = labelGroupEl.getBBox();
      compactW = Math.max(lb.width + 44, 140);
      compactH = Math.max(lb.height + 36, 60);
    } catch {
      /* getBBox unavailable */
    }
  }

  const setVisibility = (show: boolean) => {
    internalNodes.forEach((n) => {
      n.style.display = show ? '' : 'none';
    });
    relatedEdges.forEach((el) => {
      el.style.display = show ? '' : 'none';
    });
    // Resize the background rect to a compact node-like stub when collapsed,
    // restore the original dimensions when expanded.
    if (bgRect && origBgAttrs) {
      if (show) {
        bgRect.setAttribute('width', origBgAttrs.w);
        bgRect.setAttribute('height', origBgAttrs.h);
        badge.setAttribute('transform', origBadgeTransform);
      } else {
        bgRect.setAttribute('width', String(compactW));
        bgRect.setAttribute('height', String(compactH));
        const bx = parseFloat(origBgAttrs.x);
        const by = parseFloat(origBgAttrs.y);
        badge.setAttribute('transform', `translate(${bx + compactW - 2},${by + 2})`);
      }
    }
    // Hide secondary inner rect (roundedWithTitle) on collapse.
    if (innerRect) {
      innerRect.style.display = show ? '' : 'none';
    }
    icon.textContent = show ? '▼' : '▶';
    fitSvgToContent(svgRoot);
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
          const state = props.defaultState ?? 'expanded';
          attachClusterCollapsible(svgElement, clusterEl, nodeId, state);
        }
      }
      continue;
    }

    if (props.tooltip) {
      attachTooltip(nodeEl, String(props.tooltip));
    }

    if (props.collapsible) {
      const state = props.defaultState ?? 'expanded';
      attachCollapsible(svgElement, nodeEl, nodeId, state, alwaysShowIds);
    }
  }
}
