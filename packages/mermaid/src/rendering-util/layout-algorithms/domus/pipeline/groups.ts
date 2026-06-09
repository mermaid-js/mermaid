import type { Node } from '../../../types.js';

export function ancestorGroupIds(node: Node, nodesById: Map<string, Node>): string[] {
  const result: string[] = [];
  let cur: Node | undefined = node;
  const seen = new Set<string>();
  while ((cur as any)?.parentId != null) {
    const pid = String((cur as any).parentId);
    if (seen.has(pid)) {
      break;
    }
    seen.add(pid);
    const p = nodesById.get(pid);
    if (!p?.isGroup) {
      break;
    }
    result.push(pid);
    cur = p;
  }
  // outermost -> innermost
  return result.reverse();
}

export function commonPrefixLen(a: string[], b: string[]): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) {
    i++;
  }
  return i;
}
