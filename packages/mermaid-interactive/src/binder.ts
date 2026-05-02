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
 * Find all node <g> elements that are direct children of a given node in the
 * diagram, by inspecting edge paths that originate from the parent node.
 *
 * Mermaid renders edges as `<path>` elements inside `.edgePaths`. Edge start
 * and end markers are placed relative to the source/target nodes. We resolve
 * child nodes by scanning all `g.node` elements and checking whether there
 * is an arrow edge that visually connects from the parent to that child.
 *
 * Because the SVG topology alone is ambiguous (node positions, not IDs, are
 * encoded in path `d` attributes), we use a bounding-box proximity heuristic
 * for the PoC: child candidates are those whose centre lies within the
 * downstream half of the diagram relative to the parent node.
 */
function findChildNodes(svgRoot: SVGSVGElement, parentEl: SVGGElement): SVGGElement[] {
  const parentBox = parentEl.getBoundingClientRect();
  const parentCy = parentBox.top + parentBox.height / 2;

  return [...svgRoot.querySelectorAll<SVGGElement>('g.node')].filter((n) => {
    if (n === parentEl) {
      return false;
    }
    const box = n.getBoundingClientRect();
    const cy = box.top + box.height / 2;
    // Nodes that appear below the parent (TD graphs) are considered children
    return cy > parentCy;
  });
}

/** Attach a collapse/expand toggle to a node. */
function attachCollapsible(
  svgRoot: SVGSVGElement,
  nodeEl: SVGGElement,
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

  const setVisibility = (show: boolean) => {
    const childNodes = findChildNodes(svgRoot, nodeEl);
    childNodes.forEach((n) => {
      n.style.display = show ? '' : 'none';
    });
    // Also hide connecting edge paths
    svgRoot.querySelectorAll<SVGPathElement>('.edgePaths path, .edgePath path').forEach((p) => {
      p.style.display = show ? '' : 'none';
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
      continue;
    }

    if (props.tooltip) {
      attachTooltip(nodeEl, String(props.tooltip));
    }

    if (props.collapsible) {
      const state = props.defaultState! ?? 'expanded';
      attachCollapsible(svgElement, nodeEl, state);
    }
  }
}
