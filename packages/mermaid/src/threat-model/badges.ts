interface Point {
  x: number;
  y: number;
}
export interface BadgeBox extends Point {
  width: number;
  height: number;
}

function toRoot(svg: SVGSVGElement, element: SVGGraphicsElement, point: Point): Point {
  const rootMatrix = svg.getCTM?.();
  const elementMatrix = element.getCTM?.();
  if (!rootMatrix || !elementMatrix) {
    return point;
  }
  const matrix = rootMatrix.inverse().multiply(elementMatrix);
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.e,
    y: matrix.b * point.x + matrix.d * point.y + matrix.f,
  };
}

function rootBox(svg: SVGSVGElement, element: SVGGraphicsElement): BadgeBox {
  const box = element.getBBox();
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x, y: box.y + box.height },
    { x: box.x + box.width, y: box.y + box.height },
  ].map((point) => toRoot(svg, element, point));
  const x = Math.min(...corners.map((point) => point.x));
  const y = Math.min(...corners.map((point) => point.y));
  return {
    x,
    y,
    width: Math.max(...corners.map((point) => point.x)) - x,
    height: Math.max(...corners.map((point) => point.y)) - y,
  };
}

/** Anchor to the actual routed line, not the center of its bounding rectangle. */
export function badgeAnchor(svg: SVGSVGElement, target: SVGGraphicsElement, flow: boolean): Point {
  if (flow) {
    const path = target as SVGPathElement;
    if (path.getTotalLength && path.getPointAtLength) {
      return toRoot(svg, target, path.getPointAtLength(path.getTotalLength() / 2));
    }
  }
  const box = rootBox(svg, target);
  return { x: box.x + box.width / 2, y: box.y };
}

const overlap = (a: BadgeBox, b: BadgeBox) =>
  Math.max(0, Math.min(a.x + a.width + 4, b.x + b.width) - Math.max(a.x - 4, b.x)) *
  Math.max(0, Math.min(a.y + a.height + 4, b.y + b.height) - Math.max(a.y - 4, b.y));

/** Prefer nearby positions, avoiding node text, edge labels, titles and other badges. */
export function placeBadge(
  anchor: Point,
  width: number,
  height: number,
  obstacles: BadgeBox[]
): BadgeBox {
  let best = { x: anchor.x - width / 2, y: anchor.y - height - 8, width, height };
  let bestOverlap = Infinity;
  for (const gap of [8, 24, 48, 80, 128, 192, 288]) {
    const candidates = [
      { x: anchor.x - width / 2, y: anchor.y - height - gap },
      { x: anchor.x - width / 2, y: anchor.y + gap },
      { x: anchor.x + gap, y: anchor.y - height / 2 },
      { x: anchor.x - width - gap, y: anchor.y - height / 2 },
      { x: anchor.x + gap, y: anchor.y - height - gap },
      { x: anchor.x - width - gap, y: anchor.y - height - gap },
      { x: anchor.x + gap, y: anchor.y + gap },
      { x: anchor.x - width - gap, y: anchor.y + gap },
    ];
    for (const position of candidates) {
      const candidate = { ...position, width, height };
      const area = obstacles.reduce((sum, obstacle) => sum + overlap(candidate, obstacle), 0);
      if (area === 0) {
        return candidate;
      }
      if (area < bestOverlap) {
        best = candidate;
        bestOverlap = area;
      }
    }
  }
  // Very dense layouts may have no clear position. Keep the least-overlapping
  // candidate and its explicit connector rather than losing the target association.
  return best;
}

/** Use a root-coordinate overlay so nested cluster transforms cannot detach badges. */
export function createBadgeLayer(svg: SVGSVGElement) {
  const namespace = 'http://www.w3.org/2000/svg';
  const make = <K extends keyof SVGElementTagNameMap>(tag: K, parent: Element) => {
    const element = svg.ownerDocument.createElementNS(namespace, tag);
    parent.appendChild(element);
    return element;
  };
  const obstacles = [
    ...svg.querySelectorAll<SVGGraphicsElement>(
      '.node, .edgeLabel, .cluster-label, .flowchartTitleText'
    ),
  ].map((element) => rootBox(svg, element));
  const layer = make('g', svg);
  layer.setAttribute('class', 'threat-model-badges');

  return (
    target: SVGGraphicsElement,
    id: string,
    flow: boolean,
    label: string,
    title: string,
    color: string
  ) => {
    const badge = make('g', layer);
    badge.setAttribute('class', 'threat-model-badge');
    badge.setAttribute('data-threat-target', id);
    const background = make('rect', badge);
    const text = make('text', badge);
    text.setAttribute('x', '6');
    text.setAttribute('y', '14');
    text.setAttribute('style', 'font: bold 12px monospace; fill: white');
    text.textContent = label;
    const measured = text.getComputedTextLength?.();
    const width = (measured && measured > 0 ? measured : label.length * 7.5) + 12;
    const anchor = badgeAnchor(svg, target, flow);
    const box = placeBadge(anchor, width, 20, obstacles);
    obstacles.push(box);
    badge.setAttribute('transform', `translate(${box.x}, ${box.y})`);
    background.setAttribute('width', String(width));
    background.setAttribute('height', String(box.height));
    background.setAttribute('rx', '4');
    background.setAttribute('style', `fill: ${color}; stroke: white; stroke-width: 1px`);
    make('title', badge).textContent = title;

    // A leader makes the association explicit even when collision avoidance moves
    // a badge away from its preferred position. Paint it behind the badges.
    const leader = make('line', layer);
    layer.insertBefore(leader, layer.firstChild);
    leader.setAttribute('class', 'threat-model-badge-leader');
    leader.setAttribute('data-threat-target', id);
    leader.setAttribute('x1', String(anchor.x));
    leader.setAttribute('y1', String(anchor.y));
    leader.setAttribute('x2', String(Math.max(box.x, Math.min(anchor.x, box.x + box.width))));
    leader.setAttribute('y2', String(Math.max(box.y, Math.min(anchor.y, box.y + box.height))));
    leader.setAttribute(
      'style',
      `stroke: ${color}; stroke-width: 1px; stroke-dasharray: 2 2; pointer-events: none`
    );
  };
}
