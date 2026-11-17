import type { LayoutData } from '../../../types.js';

type LayoutNode = NonNullable<LayoutData['nodes']>[number] & { swimlaneContentTop?: number };

export const PARTICIPANT_GAP = 36;

const isParticipant = (node: LayoutNode): boolean =>
  Boolean(node.isGroup) &&
  !node.parentId &&
  (node as { metadata?: { laneRole?: string } }).metadata?.laneRole === 'pool';

export function separateParticipants(layout: LayoutData, direction?: string): void {
  const nodes = (layout.nodes ?? []) as LayoutNode[];
  const participants = nodes.filter((node) => isParticipant(node));
  if (participants.length < 2) {
    return;
  }

  const childrenOf = new Map<string, LayoutNode[]>();
  for (const node of nodes) {
    if (node.parentId) {
      childrenOf.set(node.parentId, [...(childrenOf.get(node.parentId) ?? []), node]);
    }
  }
  const within = (rootId: string): Set<string> => {
    const held = new Set<string>([rootId]);
    const pending = [rootId];
    while (pending.length > 0) {
      for (const child of childrenOf.get(pending.pop()!) ?? []) {
        if (!held.has(child.id)) {
          held.add(child.id);
          pending.push(child.id);
        }
      }
    }
    return held;
  };

  const axis: 'x' | 'y' = direction === 'LR' || direction === 'RL' ? 'y' : 'x';
  const extentOf = (node: LayoutNode) => (axis === 'y' ? (node.height ?? 0) : (node.width ?? 0));
  const startOf = (node: LayoutNode) => (node[axis] ?? 0) - extentOf(node) / 2;

  const inOrder = [...participants].sort((a, b) => startOf(a) - startOf(b));

  const shiftOfNode = new Map<string, number>();
  const runs: { from: number; shift: number }[] = [];
  for (const [index, participant] of inOrder.entries()) {
    const shift = index * PARTICIPANT_GAP;
    for (const id of within(participant.id)) {
      shiftOfNode.set(id, shift);
    }
    runs.push({ from: startOf(participant), shift });
  }

  const shiftAt = (coord: number): number => {
    let shift = runs[0].shift;
    for (const run of runs) {
      if (coord >= run.from) {
        shift = run.shift;
      }
    }
    return shift;
  };

  for (const [index, participant] of inOrder.entries()) {
    const shift = index * PARTICIPANT_GAP;
    if (shift === 0) {
      continue;
    }
    const held = within(participant.id);
    for (const node of nodes) {
      if (!held.has(node.id) || typeof node[axis] !== 'number') {
        continue;
      }
      node[axis] += shift;
      if (axis === 'y') {
        if (typeof node.swimlaneContentTop === 'number') {
          node.swimlaneContentTop += shift;
        }
        if (node.groupTitleRect) {
          node.groupTitleRect.top += shift;
          node.groupTitleRect.bottom += shift;
        }
      } else if (node.groupTitleRect) {
        node.groupTitleRect.left += shift;
        node.groupTitleRect.right += shift;
      }
    }
  }

  for (const edge of layout.edges ?? []) {
    const start = typeof edge.start === 'string' ? edge.start : undefined;
    const end = typeof edge.end === 'string' ? edge.end : undefined;
    const points = (edge as { points?: { x: number; y: number }[] }).points;
    if (!start || !end || !points) {
      continue;
    }
    const from = shiftOfNode.get(start);
    const to = shiftOfNode.get(end);
    if (from === undefined || to === undefined) {
      continue;
    }
    if (from === to) {
      for (const point of points) {
        point[axis] += from;
      }
      continue;
    }
    for (const point of points) {
      point[axis] += shiftAt(point[axis]);
    }
  }
}
