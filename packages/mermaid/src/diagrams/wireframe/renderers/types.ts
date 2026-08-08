import type { Selection } from 'd3';
import type { WireframeComponent } from '@mermaid-js/parser';
import type { WireframeDiagramConfig, WireframeRenderNode } from '../types.js';

export type SVGGroupSelection = Selection<SVGGElement, unknown, Element | null, unknown>;

export interface ComponentRenderContext<T extends WireframeComponent = WireframeComponent> {
  parentElem: SVGGroupSelection;
  node: WireframeRenderNode & { astNode: T };
  config: Required<WireframeDiagramConfig>;
  /** Callback to recursively render child nodes (for containers like section, fieldset, columns) */
  renderChildNodes: (parent: SVGGroupSelection, children: WireframeRenderNode[]) => void;
}

export interface ComponentRenderer<T extends WireframeComponent = WireframeComponent> {
  type: string;
  guard: (comp: WireframeComponent) => comp is T;
  render: (ctx: ComponentRenderContext<T>) => void;
}
