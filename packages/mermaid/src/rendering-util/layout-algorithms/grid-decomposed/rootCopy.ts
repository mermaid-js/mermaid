/**
 * The duplicated root of a peeled tree.
 *
 * HOLA's decomposition roots every peeled tree at a *copy* of the core node it
 * hung from (`DecomposedTree.rootCopyId`). This layout draws that copy: the tree
 * is then a complete rooted tree standing on its own, and the edge peeling cut
 * is drawn from the copy instead of running across the drawing to the core.
 *
 * The copy is a real Mermaid node, created before the measure stage so the
 * shared pipeline measures and paints it like any other node. Its id is HOLA's
 * root-copy id, which starts with `~` and therefore cannot collide with a user's
 * node id.
 */

import type { Node } from '../../types.js';

/** A node that is a duplicate of another node, drawn in a tree part. */
export type RootCopyNode = Node & { rootCopyOf?: string };

/**
 * Dashed outline, so a duplicate is distinguishable from the node it copies
 * without changing its shape, label or size. Same mechanism a user's `style`
 * statement uses, so themes and looks keep working.
 */
const ROOT_COPY_STYLE = 'stroke-dasharray: 6 4';

export function createRootCopy(coreNode: Node, copyId: string, treeIndex: number): RootCopyNode {
  const copy: RootCopyNode = {
    ...coreNode,
    id: copyId,
    // Two elements must not share a DOM id, and the painter stamps this one onto
    // the element it creates.
    domId: `${coreNode.domId ?? coreNode.id}-rootcopy-${treeIndex}`,
    // Containers are already gone by this point; a copy never belongs to one.
    parentId: undefined,
    cssStyles: [...(coreNode.cssStyles ?? []), ROOT_COPY_STYLE],
  };
  copy.rootCopyOf = coreNode.id;

  return copy;
}

/** The node this one duplicates, or `undefined` for an ordinary node. */
export function rootCopyOf(node: Node | undefined): string | undefined {
  return (node as RootCopyNode | undefined)?.rootCopyOf;
}
