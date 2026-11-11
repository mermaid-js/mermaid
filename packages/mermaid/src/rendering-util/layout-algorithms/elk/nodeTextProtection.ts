import type { CommonLayoutPaintContext } from '../common/index.js';
import type { LayoutData } from '../../types.js';
import { computeNodeIntersection } from './geometry.js';
import { replaceEdgePath, type Point } from '../../rendering-elements/lineJump.js';
import { generateRoundedPath, applyMarkerOffsetsToPoints } from '../../rendering-elements/edges.js';
import { routeAroundTitle, segmentHitsTitle, type TitleBox } from './titleProtection.js';

function paintedBox(element: Element, inverse: DOMMatrix): TitleBox {
  const r = element.getBoundingClientRect();
  const a = new DOMPoint(r.left, r.top).matrixTransform(inverse);
  const b = new DOMPoint(r.right, r.bottom).matrixTransform(inverse);
  return { left: a.x, right: b.x, top: a.y, bottom: b.y };
}

/** Non-Layered ELK engines place nodes but often return straight edge routes.
 * Keep those engines' positions; repair only edges that cross another node's
 * painted text. A failed safe repair stays observable, never hidden by a fill.
 */
export function protectElkNodeText(data: LayoutData, context: CommonLayoutPaintContext): void {
  const group = context.measure.groups.edgePaths.node();
  const svg = group?.ownerSVGElement;
  const matrix = group?.getScreenCTM?.();
  if (!group || !svg || !matrix || typeof DOMPoint === 'undefined') {
    return;
  }
  const inverse = matrix.inverse();
  const nodes = [...context.measure.nodeElements].flatMap(([id, selection]) => {
    const element = selection.node();
    if (!element) {
      return [];
    }
    return [
      {
        id,
        bounds: paintedBox(element, inverse),
        texts: [...element.querySelectorAll('.label')]
          .map((label) => paintedBox(label, inverse))
          .filter((box) => box.right > box.left && box.bottom > box.top),
      },
    ];
  });
  const titles = [...svg.querySelectorAll('g.cluster-label')].map((label) =>
    paintedBox(label, inverse)
  );
  const edges = new Map(data.edges.map((edge) => [edge.id, edge]));
  const nodeData = new Map(data.nodes.map((node) => [node.id, node]));
  const records = [...group.querySelectorAll<SVGPathElement>('path[data-id][data-points]')].flatMap(
    (path) => {
      try {
        return [{ path, points: JSON.parse(atob(path.getAttribute('data-points')!)) as Point[] }];
      } catch {
        return [];
      }
    }
  );
  for (const record of records) {
    const edge = edges.get(record.path.getAttribute('data-id')!);
    if (!edge || (edge.curve && !['linear', 'rounded'].includes(edge.curve))) {
      continue;
    }
    let routed = record.points;
    let reconnected = false;
    const source = nodes.find((node) => node.id === edge.start),
      target = nodes.find((node) => node.id === edge.end);
    if (source && target && source !== target) {
      const center = (box: TitleBox) => ({
        x: (box.left + box.right) / 2,
        y: (box.top + box.bottom) / 2,
      });
      const a = center(source.bounds),
        b = center(target.bounds);
      const reentrant = [source, target].some((node) =>
        node.texts.some((box) =>
          routed.some((p, i) => i && segmentHitsTitle(routed[i - 1], p, box))
        )
      );
      if (reentrant) {
        const bounds = (box: TitleBox) => ({
          ...center(box),
          width: box.right - box.left,
          height: box.bottom - box.top,
        });
        routed = [
          computeNodeIntersection(nodeData.get(source.id)!, bounds(source.bounds), b, a),
          computeNodeIntersection(nodeData.get(target.id)!, bounds(target.bounds), a, b),
        ];
        reconnected = true;
      }
    }
    for (const node of nodes) {
      if (node.id === edge.start || node.id === edge.end) {
        continue;
      }
      const hit = node.texts.some((box) =>
        routed.some((p, i) => i && segmentHitsTitle(routed[i - 1], p, box))
      );
      if (!hit) {
        continue;
      }
      const obstacles = [
        ...nodes.filter((other) => other !== node).map((other) => other.bounds),
        ...titles,
      ];
      const others = records.filter((other) => other !== record).map((other) => other.points);
      const next = routeAroundTitle(routed, node.bounds, obstacles, others, false, 6);
      if (JSON.stringify(next) !== JSON.stringify(routed)) {
        routed = next;
      } else {
        for (const text of node.texts) {
          if (routed.some((p, i) => i && segmentHitsTitle(routed[i - 1], p, text))) {
            routed = routeAroundTitle(routed, text, obstacles, others, false, 2);
          }
        }
      }
    }
    if (JSON.stringify(routed) === JSON.stringify(record.points)) {
      continue;
    }
    record.points = routed;
    edge.points = routed;
    edge.curve = 'rounded';
    record.path.setAttribute('data-points', btoa(JSON.stringify(routed)));
    replaceEdgePath(record.path, generateRoundedPath(applyMarkerOffsetsToPoints(routed, edge), 5));
    if (reconnected) {
      const total = routed.reduce(
        (n, p, i) => (i ? n + Math.hypot(p.x - routed[i - 1].x, p.y - routed[i - 1].y) : n),
        0
      );
      let remaining = total / 2,
        anchor = routed[0];
      for (let i = 1; i < routed.length; i++) {
        const a = routed[i - 1],
          b = routed[i],
          length = Math.hypot(b.x - a.x, b.y - a.y);
        if (remaining <= length) {
          const t = length ? remaining / length : 0;
          anchor = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
          break;
        }
        remaining -= length;
      }
      const label = [...svg.querySelectorAll('g.edgeLabel > g.label[data-id]')].find(
        (label) => label.getAttribute('data-id') === edge.id
      );
      if (label?.parentElement) {
        label.parentElement.setAttribute('transform', `translate(${anchor.x},${anchor.y})`);
        label.parentElement.setAttribute('data-elk-label-reconnected', 'true');
      }
    }
    record.path.setAttribute('data-elk-node-text-detour', 'true');
  }
}
