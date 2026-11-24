export const DDLT_SIZE_CAPTURE_VERSION = 1;

/** The `.sizes.json` id of an edge's centre label, as `createEdgeLabelNodes` names it. */
export function edgeLabelFixtureId(edge: { start?: string; end?: string; id: string }): string {
  return `edge-label-${edge.start}-${edge.end}-${edge.id}`;
}

/** The `.sizes.json` id of a subgraph's measured title (its `labelBBox`). */
export function groupTitleFixtureId(group: { id: string }): string {
  return `group-title-${group.id}`;
}
