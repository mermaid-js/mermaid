import type { C4DiagramConfig } from '../../config.type.js';

/**
 * A text element of a C4 entity (label, type, description, …).
 * The layout related fields are populated by the renderer.
 */
export interface C4Text {
  text: string;
  width?: number;
  height?: number;
  Y?: number;
  /** Number of lines the (possibly wrapped) text spans. */
  textLines?: number;
  /** Written (but never read) by the renderer for boundary labels. */
  y?: number;
}

export interface C4Image {
  width: number;
  height: number;
  Y: number;
}

export interface C4Point {
  x: number;
  y: number;
}

export interface C4Shape {
  /** The parser may set additional keys via `{ key: value }` shaped arguments. */
  [key: string]: unknown;
  alias: string;
  label: C4Text;
  typeC4Shape: C4Text;
  parentBoundary: string;
  wrap?: boolean;
  descr?: C4Text;
  techn?: C4Text;
  type?: C4Text;
  sprite?: string;
  tags?: string;
  link?: string;
  /* Style fields, set via UpdateElementStyle. */
  bgColor?: string;
  fontColor?: string;
  borderColor?: string;
  shadowing?: string;
  shape?: string;
  legendText?: string;
  legendSprite?: string;
  /* Layout fields, populated by the renderer before drawing. */
  x: number;
  y: number;
  width: number;
  height: number;
  margin: number;
  image: C4Image;
  /* Should be set by the shape renderer */
  intersect?: (point: C4Point) => C4Point;
}

export interface C4Boundary {
  /** The parser may set additional keys via `{ key: value }` shaped arguments. */
  [key: string]: unknown;
  alias: string;
  label: C4Text;
  type: C4Text;
  tags?: string | null;
  link?: string | null;
  parentBoundary: string;
  wrap?: boolean;
  descr?: C4Text;
  techn?: C4Text;
  nodeType?: string;
  sprite?: string;
  /* Style fields, set via UpdateElementStyle. */
  bgColor?: string;
  fontColor?: string;
  borderColor?: string;
  shadowing?: string;
  shape?: string;
  legendText?: string;
  legendSprite?: string;
  /* Layout fields, populated by the renderer before drawing. */
  x: number;
  y: number;
  width: number;
  height: number;
  image: C4Image;
  /* Should be set by the renderer once the boundary's box is known */
  intersect?: (point: C4Point) => C4Point;
}

/** A relationship endpoint: shapes and boundaries share the geometry used to draw relations. */
export type C4Element = C4Shape | C4Boundary;

export interface C4Rel {
  /** The parser may set additional keys via `{ key: value }` shaped arguments. */
  [key: string]: unknown;
  type: string;
  from: string;
  to: string;
  label: C4Text;
  techn: C4Text;
  descr: C4Text;
  sprite?: string;
  tags?: string;
  link?: string;
  wrap?: boolean;
  /* Style fields, set via UpdateRelStyle. */
  textColor?: string;
  lineColor?: string;
  offsetX?: number;
  offsetY?: number;
  /* Layout fields, populated by the renderer before drawing. */
  startPoint: C4Point;
  endPoint: C4Point;
}

/**
 * A named element style defined via `AddElementTag`. An element references it
 * through its `$tags` attribute; matching tags contribute fill/border/text
 * colors (and an optional shape keyword) when the node is built.
 */
export interface C4ElementTag {
  /** The parser may set fields via `{ key: value }` shaped arguments. */
  [key: string]: string | undefined;
  tagName: string;
  bgColor?: string;
  fontColor?: string;
  borderColor?: string;
  shape?: string;
}

/**
 * A named relationship style defined via `AddRelTag`. A relationship references
 * it through its `$tags` attribute; matching tags contribute line/text colors.
 */
export interface C4RelTag {
  /** The parser may set fields via `{ key: value }` shaped arguments. */
  [key: string]: string | undefined;
  tagName: string;
  textColor?: string;
  lineColor?: string;
}

/**
 * Font configuration as produced by the `*Font()` helpers of the C4
 * configuration. The helpers always populate family/size/weight from the
 * (defaulted) config, so those fields are typed as present.
 */
export interface C4Font {
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  fontColor?: string;
}

/**
 * The C4 configuration at render time: all defaults are applied and the
 * `*Font()` helper functions from the default config are present.
 * Additional dynamically accessed keys (e.g. `person_bg_color`,
 * `external_systemFont`) are covered by the `Record<string, unknown>` part.
 */
export type C4DrawConfig = Omit<
  Required<C4DiagramConfig>,
  'personFont' | 'boundaryFont' | 'messageFont'
> & {
  personFont: () => C4Font;
  boundaryFont: () => C4Font;
  messageFont: () => C4Font;
  textPlacement?: string;
} & Record<string, unknown>;
