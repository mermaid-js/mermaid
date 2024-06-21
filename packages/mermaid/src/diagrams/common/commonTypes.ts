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

export type D3RectElement = d3.Selection<SVGRectElement, unknown, Element | null, unknown>;

export type D3UseElement = d3.Selection<SVGUseElement, unknown, Element | null, unknown>;

export type D3ImageElement = d3.Selection<SVGImageElement, unknown, Element | null, unknown>;

export type D3TextElement = d3.Selection<SVGTextElement, unknown, Element | null, unknown>;

export type D3TSpanElement = d3.Selection<SVGTSpanElement, unknown, Element | null, unknown>;
