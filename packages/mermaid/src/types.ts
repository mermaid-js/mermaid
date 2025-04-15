export interface NodeMetaData {
  shape?: string;
  label?: string;
  icon?: string;
  form?: string;
  pos?: 't' | 'b';
  img?: string;
  w?: string;
  h?: string;
  constraint?: 'on' | 'off';
  priority: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  assigned?: string;
  ticket?: string;
}

export interface EdgeMetaData {
  animation?: 'fast' | 'slow';
  animate?: boolean;
}
import type { MermaidConfig } from './config.type.js';

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

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

export interface ParseOptions {
  /**
   * If `true`, parse will return `false` instead of throwing error when the diagram is invalid.
   * The `parseError` function will not be called.
   */
  suppressErrors?: boolean;
}

export interface ParseResult {
  /**
   * The diagram type, e.g. 'flowchart', 'sequence', etc.
   */
  diagramType: string;
  /**
   * The config passed as YAML frontmatter or directives
   */
  config: MermaidConfig;
}
// This makes it clear that we're working with a d3 selected element of some kind, even though it's hard to specify the exact type.
export type D3Element = any;

/**
 * Helper type for d3 selections.
 */
export type D3Selection<T extends SVGElement> = d3.Selection<T, unknown, Element | null, unknown>;

export interface RenderResult {
  /**
   * The svg code for the rendered graph.
   */
  svg: string;
  /**
   * The diagram type, e.g. 'flowchart', 'sequence', etc.
   */
  diagramType: string;
  /**
   * Bind function to be called after the svg has been inserted into the DOM.
   * This is necessary for adding event listeners to the elements in the svg.
   * ```js
   * const { svg, bindFunctions } = await mermaid.render('id1', 'graph TD;A-->B');
   * div.innerHTML = svg;
   * bindFunctions?.(div); // To call bindFunctions only if it's present.
   * ```
   */
  bindFunctions?: (element: Element) => void;
}

/**
 * Can be converted back to `T` by awaiting/`Awaited<T>`.
 *
 * This is useful for function types that may be either synchronous or asynchronous.
 */
export type MaybePromise<T> = T | Promise<T>;
