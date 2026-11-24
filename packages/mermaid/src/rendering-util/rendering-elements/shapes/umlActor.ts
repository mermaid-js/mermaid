import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { usecaseActor, type UsecaseActorNode } from './usecaseActor.js';

// Mirror the figure slot of the usecase actor shape (usecaseActor.ts): the glyph is
// centred in a FIGURE_HEIGHT tall slot at the top of the node, inside its padding.
const FIGURE_WIDTH = 56;
const FIGURE_HEIGHT = 72;
const DEFAULT_PADDING = 8;

/**
 * Component diagram actor: the usecase stick figure, but edges clip against the
 * drawn figure rather than the label-wide node box, so they touch the actor
 * instead of stopping short of it when the caption is wider than the figure.
 */
export async function umlActor<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const shapeSvg = await usecaseActor(parent, node as UsecaseActorNode);

  // The glyph's own extent within its slot; the slot itself when it cannot be measured.
  let glyph = {
    x: -FIGURE_WIDTH / 2,
    y: -FIGURE_HEIGHT / 2,
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
  };
  const glyphNode = shapeSvg.select<SVGGElement>('.usecase-actor-glyph').node();
  const measured = glyphNode?.getBBox?.();
  if (measured && measured.width > 0 && measured.height > 0) {
    glyph = measured;
  }

  const figureBox = () => {
    const padding = node.padding ?? DEFAULT_PADDING;
    const slotCenter = (node.y ?? 0) - (node.height ?? 0) / 2 + padding + FIGURE_HEIGHT / 2;
    return {
      x: (node.x ?? 0) + glyph.x + glyph.width / 2,
      y: slotCenter + glyph.y + glyph.height / 2,
      width: glyph.width,
      height: glyph.height,
    } as Node;
  };
  node.intersect = (point) => intersect.rect(figureBox(), point);
  return shapeSvg;
}
