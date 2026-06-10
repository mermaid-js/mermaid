export interface RectData {
  x: number;
  y: number;
  fill: string;
  width: number;
  height: number;
  stroke: string;
  class?: string;
  color?: string;
  rx?: number;
  ry?: number;
  attrs?: Record<string, string | number>;
  anchor?: string;
  name?: string;
}

export interface Bound {
  startx: number;
  stopx: number;
  starty: number;
  stopy: number;
  fill: string;
  stroke: string;
}

export interface TextData {
  x: number;
  y: number;
  anchor: string;
  text: string;
  textMargin: number;
  class?: string;
}

export interface TextObject {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  anchor?: string;
  'text-anchor': string;
  style: string;
  textMargin: number;
  rx: number;
  ry: number;
  tspan: boolean;
  valign?: string;
}

/** A smiley/sad/neutral face drawn by the timeline and user-journey diagrams. */
export interface FaceData {
  cx: number;
  cy: number;
  score: number;
}

/** An actor circle drawn by the timeline and user-journey diagrams. */
export interface CircleData {
  cx: number;
  cy: number;
  r: number;
  pos: number;
  fill: string;
  stroke: string;
  title?: string;
}

/** A section header box drawn by the timeline and user-journey diagrams. */
export interface SectionData {
  x: number;
  y: number;
  text: string;
  fill: string;
  num: number | string;
  colour: string;
}

/** A task box drawn by the timeline and user-journey diagrams. */
export interface TaskData {
  x: number;
  y: number;
  task: string;
  score: number;
  fill: string;
  num: number | string;
  colour: string;
}

export type D3RectElement = d3.Selection<SVGRectElement, unknown, Element | null, unknown>;

export type D3UseElement = d3.Selection<SVGUseElement, unknown, Element | null, unknown>;

export type D3ImageElement = d3.Selection<SVGImageElement, unknown, Element | null, unknown>;

export type D3TextElement = d3.Selection<SVGTextElement, unknown, Element | null, unknown>;

export type D3TSpanElement = d3.Selection<SVGTSpanElement, unknown, Element | null, unknown>;
