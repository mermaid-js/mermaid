import type { Node } from '../../types.js';
import {
  ROOT_CONTAINER_ID,
  type GridContainerId,
  type GridForest,
  gridError,
  isEdgeLabelNode,
} from './types.js';

function asGroup(node: Node): (Node & { isGroup: true }) | undefined {
  return node.isGroup ? (node as Node & { isGroup: true }) : undefined;
}

export function buildGridForest(nodes: Node[]): GridForest {
  const nodeById = new Map<string, Node>();
  const groupById = new Map<string, Node & { isGroup: true }>();
  const helperNodeIds = new Set<string>();

  for (const node of nodes) {
    if (node.id === ROOT_CONTAINER_ID) {
      throw gridError(
        'GRID_INVALID_CONTAINMENT',
        `Node id "${ROOT_CONTAINER_ID}" is reserved for the grid layout root`,
        { traversedIds: [node.id] }
      );
    }
    nodeById.set(node.id, node);
    if (isEdgeLabelNode(node)) {
      helperNodeIds.add(node.id);
      continue;
    }
    const group = asGroup(node);
    if (group) {
      groupById.set(group.id, group);
    }
  }

  const childrenByParent = new Map<GridContainerId, Node[]>();
  childrenByParent.set(ROOT_CONTAINER_ID, []);

  for (const node of nodes) {
    if (helperNodeIds.has(node.id)) {
      continue;
    }
    const parentId = node.parentId ?? ROOT_CONTAINER_ID;
    if (parentId !== ROOT_CONTAINER_ID) {
      const parent = groupById.get(parentId);
      if (!parent) {
        throw gridError(
          'GRID_INVALID_CONTAINMENT',
          `Missing parent "${parentId}" for "${node.id}"`,
          {
            traversedIds: [node.id, parentId],
          }
        );
      }
    }
    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, []);
    }
    childrenByParent.get(parentId)!.push(node);
  }

  const state = new Map<string, 0 | 1 | 2>();
  const postOrderGroups: (Node & { isGroup: true })[] = [];

  interface VisitFrame {
    groupId: string;
    childGroups: (Node & { isGroup: true })[];
    nextChildIndex: number;
  }

  const directChildGroups = (groupId: string): (Node & { isGroup: true })[] =>
    (childrenByParent.get(groupId) ?? [])
      .map((child) => asGroup(child))
      .filter((group): group is Node & { isGroup: true } => group !== undefined);

  const visit = (startGroupId: string): void => {
    const currentState = state.get(startGroupId) ?? 0;
    if (currentState === 1) {
      throw gridError('GRID_INVALID_CONTAINMENT', `Containment cycle at "${startGroupId}"`, {
        traversedIds: [startGroupId],
      });
    }
    if (currentState === 2) {
      return;
    }

    state.set(startGroupId, 1);
    const stack: VisitFrame[] = [
      {
        groupId: startGroupId,
        childGroups: directChildGroups(startGroupId),
        nextChildIndex: 0,
      },
    ];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const child = frame.childGroups[frame.nextChildIndex];

      if (child) {
        frame.nextChildIndex += 1;
        const childState = state.get(child.id) ?? 0;
        if (childState === 1) {
          throw gridError('GRID_INVALID_CONTAINMENT', `Containment cycle at "${child.id}"`, {
            traversedIds: [...stack.map((item) => item.groupId), child.id],
          });
        }
        if (childState === 2) {
          continue;
        }

        state.set(child.id, 1);
        stack.push({
          groupId: child.id,
          childGroups: directChildGroups(child.id),
          nextChildIndex: 0,
        });
        continue;
      }

      stack.pop();
      state.set(frame.groupId, 2);
      const group = groupById.get(frame.groupId);
      if (group) {
        postOrderGroups.push(group);
      }
    }
  };

  for (const rootChild of childrenByParent.get(ROOT_CONTAINER_ID) ?? []) {
    const group = asGroup(rootChild);
    if (group) {
      visit(group.id);
    }
  }

  for (const groupId of groupById.keys()) {
    if ((state.get(groupId) ?? 0) === 0) {
      visit(groupId);
    }
  }

  return {
    nodeById,
    groupById,
    childrenByParent,
    rootChildren: childrenByParent.get(ROOT_CONTAINER_ID) ?? [],
    postOrderGroups,
    helperNodeIds,
  };
}

export function isAncestorGroup(
  ancestorId: string,
  node: Node | undefined,
  nodeById: Map<string, Node>
): boolean {
  let current = node;
  const seen = new Set<string>();
  while (current?.parentId) {
    if (current.parentId === ancestorId) {
      return true;
    }
    if (seen.has(current.parentId)) {
      return false;
    }
    seen.add(current.parentId);
    current = nodeById.get(current.parentId);
  }
  return false;
}
