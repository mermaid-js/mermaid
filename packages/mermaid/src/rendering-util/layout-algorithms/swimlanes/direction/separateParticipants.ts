import type { LayoutData } from '../../../types.js';

type LayoutNode = NonNullable<LayoutData['nodes']>[number] & { swimlaneContentTop?: number };

/** The room left between two participants, which is where a link between them is drawn. */
export const PARTICIPANT_GAP = 36;

/** Whether a band stands for a participant of its own rather than a division of one. */
const isParticipant = (node: LayoutNode): boolean =>
  Boolean(node.isGroup) &&
  !node.parentId &&
  (node as { metadata?: { laneRole?: string } }).metadata?.laneRole === 'pool';

/**
 * Moves each participant clear of the one before it.
 *
 * Lanes divide a single participant and share their borders, so the bands are laid out
 * as one run. Separate participants are drawn apart, and a message flow between two of
 * them has nowhere to be drawn while they touch. Everything inside a participant moves
 * with it, including the flows between its own nodes; a flow leaving it is drawn
 * afterwards, from the borders this leaves behind.
 */
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

  // Laid out across the page a participant is a band with the next one below it; laid out
  // downwards the bands are columns and the next one stands to its right.
  const axis: 'x' | 'y' = direction === 'LR' || direction === 'RL' ? 'y' : 'x';
  const extentOf = (node: LayoutNode) => (axis === 'y' ? (node.height ?? 0) : (node.width ?? 0));
  const startOf = (node: LayoutNode) => (node[axis] ?? 0) - extentOf(node) / 2;

  const inOrder = [...participants].sort((a, b) => startOf(a) - startOf(b));

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
    for (const edge of layout.edges ?? []) {
      const start = typeof edge.start === 'string' ? edge.start : undefined;
      const end = typeof edge.end === 'string' ? edge.end : undefined;
      // Only a flow that stays inside this participant. One that leaves it is a link
      // between participants, drawn from the borders once every band has settled.
      if (!start || !end || !held.has(start) || !held.has(end)) {
        continue;
      }
      for (const point of (edge as { points?: { x: number; y: number }[] }).points ?? []) {
        point[axis] += shift;
      }
    }
  }
}
