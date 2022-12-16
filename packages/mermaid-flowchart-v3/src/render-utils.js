export const findCommonAncestorCoPilot = (id1, id2, treeData) => {
  const { parentById, childrenById } = treeData;
  const parents1 = [];
  const parents2 = [];
  let cnt = 0;
  let currentId = id1;
  while (currentId) {
    parents1.push(currentId);
    currentId = parentById[currentId];
    cnt++;
    if (cnt > 200) {
      throw new Error('Infinite loop detected!');
    }
  }
  currentId = id2;
  while (currentId) {
    parents2.push(currentId);
    currentId = parentById[currentId];
    cnt++;
    if (cnt > 200) {
      throw new Error('Infinite loop detected!');
    }
  }
  let commonAncestor = 'root';
  while (parents1.length && parents2.length) {
    cnt++;
    if (cnt > 200) {
      throw new Error('Infinite loop detected!');
    }
    const p1 = parents1.pop();
    const p2 = parents2.pop();
    if (p1 === p2) {
      commonAncestor = p1;
    } else {
      break;
    }
  }
  return commonAncestor;
};

export const findCommonAncestor = (id1, id2, treeData) => {
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

export const findCommonAncestorKnut = (id1, id2, treeData) => {
  const { parentById, childrenById } = treeData;
  const parents1 = [];
  const parents2 = [];
  let cnt = 0;
  let currentId = id1;
  while (currentId) {
    parents1.push(currentId);
    currentId = parentById[currentId];
    cnt++;
    if (cnt > 200) {
      throw new Error('Infinite loop detected!');
    }
  }
  currentId = id2;
  while (currentId) {
    parents2.push(currentId);
    currentId = parentById[currentId];
    if (currentId === 'root') {
      return 'root';
    }

    if (parents1.includes(currentId)) {
      return currentId;
    }

    cnt++;
    if (cnt > 200) {
      throw new Error('Infinite loop detected!');
    }
  }
  return 'root';
};

export const findCommonAncestorRecursive = (id1, id2, treeData) => {
  const { parentById, childrenById } = treeData;

  // Base case: return the current node if it is the common ancestor
  if (id1 === id2) {
    return id1;
  }

  // Recursive case: search for the common ancestor in the parent nodes
  const parent1 = parentById[id1];
  const parent2 = parentById[id2];
  if (parent1 && parent2) {
    return findCommonAncestor(parent1, parent2, treeData);
  }

  // Edge case: one of the nodes is the root of the tree
  if (parent1) {
    return parent1;
  }
  if (parent2) {
    return parent2;
  }
  return 'root';
};
