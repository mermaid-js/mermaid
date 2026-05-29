import type { DiagramDBBase, DiagramStyleClassDef } from '../../diagram-api/types.js';
import type { BaseDiagramConfig } from '../../config.type.js';

// ─── Grid model ────────────────────────────────────────────────────────────────

/** A raw character-grid parsed from the ASCII art body. */
export interface DitaaGrid {
  /** Number of character columns. */
  width: number;
  /** Number of character rows. */
  height: number;
  /** Flat array of characters; index = row * width + col. */
  cells: string[];
}

// ─── Parsed visual elements ────────────────────────────────────────────────────

/** A rectangular box detected from `+--+` / `|` / `+` corners. */
export interface DitaaBox {
  /** Top-left grid column (0-indexed). */
  col: number;
  /** Top-left grid row (0-indexed). */
  row: number;
  /** Width in grid columns (includes both `+` corners). */
  cols: number;
  /** Height in grid rows (includes both `+` corners). */
  rows: number;
  /** Text found inside the box (trimmed). */
  text: string;
  /** True when corners use `/` or `\` (rounded-corner style). */
  rounded: boolean;
  /** True when the border uses `=` or `:` characters (dashed style). */
  dashed: boolean;
}

/** A single line segment (without arrow heads). */
export interface DitaaLine {
  points: { col: number; row: number }[];
  dashed: boolean;
}

/** A line with optional arrow heads at one or both ends. */
export interface DitaaArrow extends DitaaLine {
  /** Arrow head at the start of the path. */
  startArrow: boolean;
  /** Arrow head at the end of the path. */
  endArrow: boolean;
}

/** Free-floating text label not contained inside any box. */
export interface DitaaText {
  col: number;
  row: number;
  text: string;
}

/** Full parsed ditaa diagram model. */
export interface DitaaDiagram {
  boxes: DitaaBox[];
  lines: DitaaLine[];
  arrows: DitaaArrow[];
  texts: DitaaText[];
  grid: DitaaGrid;
}

// ─── Config ────────────────────────────────────────────────────────────────────

export interface DitaaDiagramConfig extends BaseDiagramConfig {
  /** SVG pixels per grid column (default: 12). */
  cellWidth?: number;
  /** SVG pixels per grid row (default: 20). */
  cellHeight?: number;
  /** Outer padding around the full diagram (default: 10). */
  padding?: number;
  /** Corner radius for rounded boxes (default: 6). */
  boxRounding?: number;
  diagramPadding?: number;
}

// ─── DB interface ──────────────────────────────────────────────────────────────

export interface DitaaDB extends DiagramDBBase<DitaaDiagramConfig> {
  /** Store the full parsed diagram model. */
  setDiagram: (diagram: DitaaDiagram) => void;
  /** Return the stored diagram model. */
  getDiagram: () => DitaaDiagram | undefined;
  getClasses: () => Map<string, DiagramStyleClassDef>;
}
