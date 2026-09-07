/**
 * Palette slots for agentflow, under the redux colour themes.
 *
 * Two different rules, because agentflow has two different things to colour:
 *
 * - **Nodes take a colour per KIND.** A `tool` is not a `task` is not a `decision` — the
 *   diagram type exists to say so — and colour that tracks kind is invariant under
 *   editing: inserting a node in the middle recolours nothing. Each kind is pinned to a
 *   fixed palette slot, so a tool is the same colour in every diagram.
 * - **Containers cycle a counter**, exactly as flowchart subgraphs do: one counter across
 *   the whole diagram, in declaration order, so sibling containers differ and a nested one
 *   continues the cycle instead of restarting it.
 *
 * The two ranges are kept apart. Kinds own slots `0 .. KIND_COUNT-1` and containers cycle
 * the slots above them, so a container frame can never land on the same colour as a node
 * inside it — which would read as the node bleeding into its own container.
 *
 * Kind comes from the db's own `vertexKind`, never from the rendered shape. Shape is not
 * one-to-one with kind — a `connector` and a `task` are both `roundedRect` — so inverting
 * the shape map would silently paint every connector as a task.
 */
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { Node } from '../../rendering-util/types.js';

/**
 * Fixed slot per kind. Declaration order of this map is the palette order, so `tool` is
 * always the first palette colour, `task` the second, and so on.
 */
export const KIND_SLOT: ReadonlyMap<string, number> = new Map([
  ['tool', 0],
  ['task', 1],
  ['decision', 2],
  ['input', 3],
  ['refdoc', 4],
  ['connector', 5],
  ['action', 6],
]);

/** Slots reserved for kinds. Containers start above this. */
export const KIND_COUNT = KIND_SLOT.size;

/** Class marking a node's kind, matched by the rules `styles.ts` emits. */
export const kindClass = (kind: string): string => `af-kind-${kind}`;

/** Every kind, for the stylesheet to iterate. */
export const KINDS: readonly string[] = [...KIND_SLOT.keys()];

/**
 * How many slots containers may cycle through, given a palette length.
 *
 * At least one: a palette shorter than the kind range would otherwise yield a modulo by
 * zero, and one repeated container colour beats a crash.
 */
export const containerSlotCount = (paletteLength: number): number =>
  Math.max(1, paletteLength - KIND_COUNT);

/**
 * The palette slot for the `n`th container, given the palette length.
 *
 * The single source of truth for both sides. `stampColorSlot` reduces whatever index it is
 * given modulo the palette length, so the stylesheet has to name the slot the stamp will
 * actually produce — otherwise a palette shorter than the kind range assigns slot 7, the
 * stamp writes `color-1`, and the rule for `color-7` matches nothing. Measured before this
 * was shared: a 3-colour palette left every container unpainted.
 *
 * On such a short palette a container will land on a kind's colour. That is unavoidable —
 * seven kinds already collide among themselves below eight colours — and a shared colour
 * beats an unpainted frame.
 */
export const containerSlot = (n: number, paletteLength: number): number => {
  const slot = KIND_COUNT + (n % containerSlotCount(paletteLength));
  return paletteLength > 0 ? slot % paletteLength : slot;
};

/**
 * Tag every node with its kind class, and give every container its slot.
 *
 * Nodes are tagged rather than stamped with `data-color-id` because agentflow draws
 * through six different shapes — `subroutine`, `diamond`, `hexagon`, `lean-right`,
 * `lin-doc`, `roundedRect` — and of the shared shapes only `squareRect` stamps for
 * itself. A class travels through the shared pipeline on every one of them, and keeps this
 * change inside agentflow instead of editing six files other diagrams also draw with.
 *
 * Containers use `colorIndex` and nothing else — the same mechanism flowchart subgraphs,
 * block composites, state composites and usecase boundaries all use. Both forms are
 * covered: `createContainerGroup` stamps the expanded frame and `collapsedGroup.ts` stamps
 * the collapsed one, so collapsing a container keeps its colour.
 *
 * `containerOrder` carries declaration order, which the node array does not: `getData()`
 * walks `subGraphs` in reverse, and `subGraphs` is itself in completion order, so neither
 * it nor its reverse is the order the author wrote. The caller does that walk.
 */
export function assignColorSlots(
  nodes: Node[],
  kindOf: (id: string) => string | undefined,
  containerOrder: ReadonlyMap<string, number>
): void {
  const palette = (getConfig().themeVariables as { borderColorArray?: unknown })?.borderColorArray;
  const paletteLength = Array.isArray(palette) ? palette.length : 0;

  // Containers that the walk did not reach still need a slot, and they must not all take
  // the same one. Counted after the declared ones so nothing shifts.
  let fallbackOrdinal = containerOrder.size;
  for (const node of nodes ?? []) {
    // A collapsed container is drawn as a single node (`isGroup` is false) but it is still
    // a container, and it takes its slot like one -- so collapsing a container does not
    // reshuffle the colours of the ones after it. Flowchart does the same for a collapsed
    // subgraph.
    if (node.isGroup || node.shape === 'collapsedGroup') {
      const n = containerOrder.get(String(node.id)) ?? fallbackOrdinal++;
      node.colorIndex = containerSlot(n, paletteLength);
      continue;
    }
    const kind = kindOf(String(node.id));
    if (kind && KIND_SLOT.has(kind)) {
      node.cssClasses = `${node.cssClasses ?? ''} ${kindClass(kind)}`.replace(/\s+/g, ' ').trim();
    }
  }
}
