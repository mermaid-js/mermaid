export interface TreeData {
  parentById: Record<string, string>;
  childrenById: Record<string, string[]>;
}

export const findCommonAncestor = (id1: string, id2: string, treeData: TreeData) => {
  const { parentById } = treeData;
  const visited = new Set();
  let currentId = id1;
  while (currentId) {
    visited.add(currentId);
    if (currentId === id2) {
      return currentId;
    }
    currentId = parentById[currentId];
  }
  currentId = id2;
  while (currentId) {
    if (visited.has(currentId)) {
      return currentId;
    }
    currentId = parentById[currentId];
  }
  return 'root';
};
