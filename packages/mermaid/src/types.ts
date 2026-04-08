export interface Point {
  x: number;
  y: number;
}

export interface TextDimensionConfig {
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
}

export interface TextDimensions {
  width: number;
  height: number;
  lineHeight?: number;
}

export interface EdgeData {
  arrowheadStyle?: string;
  labelpos?: string;
  labelType?: string;
  label?: string;
  classes: string;
  pattern: string;
  id: string;
  arrowhead: string;
  startLabelRight: string;
  endLabelLeft: string;
  arrowTypeStart: string;
  arrowTypeEnd: string;
  style: string;
  labelStyle: string;
  curve: any;
}

/**
 * Helper type for d3 selections.
 */
export type D3Selection<T extends SVGElement> = D3HtmlSelection<T>;

/**
 * Helper type for d3 selections of any {@link Element}, not just SVG elements.
 *
 * Prefer using {@link D3Selection} whenever possible.
 */
export type D3HtmlSelection<T extends Element> = d3.Selection<T, unknown, Element | null, unknown>;
