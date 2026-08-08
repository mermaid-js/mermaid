import type { WireframeComponent } from '@mermaid-js/parser';
import type { ComponentRenderer, ComponentRenderContext } from './types.js';
import { LAYOUT_METRICS } from '../types.js';
import { drawBox, drawText } from './utils.js';

export const defaultRenderer: ComponentRenderer<WireframeComponent> = {
  type: 'default',
  guard: (_comp): _comp is WireframeComponent => true,
  render: ({ parentElem, node }) => {
    const { x, y, width, height, astNode } = node;
    const label = astNode.label ?? astNode.$type;
    const g = parentElem
      .append('g')
      .attr('class', `wireframe-comp wireframe-${astNode.$type.toLowerCase()}`);

    drawBox(g, x, y, width, height, 'wireframe-container');
    drawText(
      g,
      label,
      x + LAYOUT_METRICS.defaultComponent.textPaddingX,
      y + LAYOUT_METRICS.defaultComponent.textOffsetY
    );
  },
};

export class ComponentRegistry {
  private renderers = new Map<string, ComponentRenderer<WireframeComponent>>();

  public register(renderer: ComponentRenderer<WireframeComponent>) {
    this.renderers.set(renderer.type, renderer);
  }

  public render(ctx: ComponentRenderContext) {
    const renderer = this.renderers.get(ctx.node.astNode.$type) ?? defaultRenderer;
    renderer.render(ctx);
  }
}

export const registry = new ComponentRegistry();
