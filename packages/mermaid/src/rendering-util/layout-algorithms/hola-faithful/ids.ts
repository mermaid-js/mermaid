/**
 * Internal id namespaces.
 *
 * Guide §6: "Keep original IDs distinct from internal IDs. Use typed IDs or
 * prefixed objects rather than testing whether an ID contains `_` or `-`."
 * The prefixes below exist for readability in debug output; every stage that
 * needs to know what an id *is* consults an explicit set or map instead of
 * parsing the string.
 *
 * `~` starts every internal id. It is not a Mermaid identifier character, so an
 * internal id can never collide with a user's node id.
 */

const ROOT_COPY = '~rootcopy';
const BEND_DUMMY = '~bend';
const CROSSING_DUMMY = '~cross';
const PLACEHOLDER = '~tree';
const TOPO_EDGE = '~edge';

export function rootCopyId(coreNodeId: string, treeIndex: number): string {
  return `${ROOT_COPY}/${treeIndex}/${coreNodeId}`;
}

export function bendDummyId(index: number): string {
  return `${BEND_DUMMY}/${index}`;
}

export function crossingDummyId(index: number): string {
  return `${CROSSING_DUMMY}/${index}`;
}

export function placeholderId(treeId: string): string {
  return `${PLACEHOLDER}/${treeId}`;
}

export function topologicalEdgeId(a: string, b: string): string {
  return a <= b ? `${TOPO_EDGE}/${a}|${b}` : `${TOPO_EDGE}/${b}|${a}`;
}
