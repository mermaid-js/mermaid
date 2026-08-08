import type { Selection } from 'd3';
import type { WireframeComponent } from '@mermaid-js/parser';
import type { WireframeDiagramConfig, WireframeRenderNode } from '../types.js';

export interface ComponentRenderContext<T extends WireframeComponent = WireframeComponent> {
  parentElem: Selection<SVGGElement, unknown, null, undefined>;
  node: WireframeRenderNode & { astNode: T };
  config: Required<WireframeDiagramConfig>;
  /** Callback to recursively render child nodes (for containers like section, fieldset, columns) */
  renderChildNodes: (
    parent: Selection<SVGGElement, unknown, null, undefined>,
    children: WireframeRenderNode[]
  ) => void;
}

export interface ComponentRenderer<T extends WireframeComponent = WireframeComponent> {
  type: string;
  guard: (comp: WireframeComponent) => comp is T;
  render: (ctx: ComponentRenderContext<T>) => void;
}
