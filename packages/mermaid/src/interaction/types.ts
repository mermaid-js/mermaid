/** Node position override data for a single node. */
export interface NodeOverride {
  /** X anchor coordinate in SVG viewBox coordinates. */
  x: number;
  /** Y anchor coordinate in SVG viewBox coordinates. */
  y: number;
  /** Whether the node is locked (prevents dragging). */
  locked?: boolean;
}

/**
 * Edge override data.
 * Reserved for MVP — standalone edge dragging is not yet implemented.
 */
export interface EdgeOverride {
  /** Manually adjusted path waypoints. */
  points?: { x: number; y: number }[];
}

/** Complete override data persistence format. */
export interface OverrideData {
  /** Schema version number. */
  version: number;
  /** Layout engine used for positioning. */
  layout: string;
  /** Node and edge override data, keyed by user-defined ID. */
  overrides: {
    nodes: Record<string, NodeOverride>;
    edges: Record<string, EdgeOverride>;
  };
}

/** MermaidDragEditor configuration options. */
export interface DragEditorOptions {
  /** The rendered SVG element to attach drag behavior to. */
  svgElement: SVGElement;
  /** User-defined Mermaid source code (used by resetLayout to re-render). */
  mermaidCode?: string;
  /** Storage key for localStorage. Defaults to the SVG element's id. */
  storageKey?: string;
  /** Maximum undo history depth. Defaults to 50. */
  maxUndoDepth?: number;
  /** Custom save callback. Should return whether the save was successful. */
  onSave?: (data: OverrideData) => Promise<void>;
  /** Custom load callback. Should return saved data or null. */
  onLoad?: () => Promise<OverrideData | null>;
  /** Custom render function: takes mermaidCode and returns a rendered SVG element. */
  renderFn?: (code: string) => Promise<SVGElement>;
}

/** A node position in SVG viewBox coordinates. */
export interface NodePosition {
  x: number;
  y: number;
}

/** Information about a scanned node in the SVG. */
export interface ScannedNode {
  /** The corresponding SVG <g> element. */
  element: SVGGElement;
  /** User-defined node ID (e.g. "A", "B", "node-A"). */
  userNodeId: string;
  /** Current X anchor coordinate in viewBox space. */
  currentX: number;
  /** Current Y anchor coordinate in viewBox space. */
  currentY: number;
  /** Node width in viewBox coordinates, used for connection point calculation. */
  nodeWidth: number;
  /** Node height in viewBox coordinates, used for connection point calculation. */
  nodeHeight: number;
  /** Whether the node is locked. */
  locked: boolean;
}

/** Undo/redo history entry. */
export interface HistoryEntry {
  /** The node IDs that were moved. */
  nodeIds: string[];
  /** Snapshot of override data before the move. */
  before: Record<string, NodePosition>;
  /** Snapshot of override data after the move. */
  after: Record<string, NodePosition>;
}

/** Edge model: records the source/target node mapping and the corresponding SVG path element. */
export interface EdgeModel {
  /** Logical edge ID. */
  id: string;
  /** Source node user ID. */
  source: string;
  /** Target node user ID. */
  target: string;
  /** The corresponding SVG <path> element. */
  pathElement: SVGPathElement;
}

/** Snapshot of drag state at the start of a drag operation. */
export interface DragSnapshot {
  /** Original positions of dragged nodes in viewBox coordinates. */
  originalPositions: Map<string, NodePosition>;
  /** Pointer position in viewBox coordinates at pointerdown. */
  startPoint: NodePosition;
  /** Delta already applied to edge paths in the previous frame. */
  lastAppliedDelta: NodePosition;
}
