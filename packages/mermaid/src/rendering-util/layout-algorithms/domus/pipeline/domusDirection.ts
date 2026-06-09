import type { LayoutData } from '../../../types.js';
import { isEdgeLabelNodeId } from '../core/labels.js';

export function directionViolationRatioForLayout(
  layout: LayoutData,
  dir: string | null | undefined
): number {
  const d = (dir ?? '').trim();
  if (!d) {
    return 0;
  }
  const nodesById = new Map<string, any>();
  for (const n of layout.nodes ?? []) {
    nodesById.set(String((n as any).id ?? ''), n);
  }
  let total = 0;
  let bad = 0;
  const expect = (a: any, b: any): boolean => {
    const ax = a?.x ?? 0;
    const ay = a?.y ?? 0;
    const bx = b?.x ?? 0;
    const by = b?.y ?? 0;
    switch (d) {
      case 'TB':
      case 'TD':
        return by >= ay;
      case 'BT':
      case 'DT':
        return by <= ay;
      case 'LR':
        return bx >= ax;
      case 'RL':
        return bx <= ax;
      default:
        return true;
    }
  };
  for (const e of layout.edges ?? []) {
    if (!(e as any)?.start || !(e as any)?.end) {
      continue;
    }
    const s = String((e as any).start);
    const t = String((e as any).end);
    if (isEdgeLabelNodeId(s) || isEdgeLabelNodeId(t)) {
      continue;
    }
    const sn = nodesById.get(s);
    const tn = nodesById.get(t);
    if (!sn || !tn) {
      continue;
    }
    if (sn.isGroup || tn.isGroup) {
      continue;
    }
    total++;
    if (!expect(sn, tn)) {
      bad++;
    }
  }
  return total ? bad / total : 0;
}

export function mirrorLeafNodesInPlace(layout: LayoutData, axis: 'x' | 'y'): void {
  const leaf = (layout.nodes ?? []).filter((n: any) => !n?.isGroup);
  if (leaf.length === 0) {
    return;
  }
  const coords = leaf.map((n: any) => (axis === 'x' ? (n.x ?? 0) : (n.y ?? 0)));
  const min = Math.min(...coords);
  const max = Math.max(...coords);
  const c = (min + max) / 2;
  for (const n of leaf as any[]) {
    if (axis === 'x') {
      n.x = 2 * c - (n.x ?? 0);
    } else {
      n.y = 2 * c - (n.y ?? 0);
    }
  }
}
