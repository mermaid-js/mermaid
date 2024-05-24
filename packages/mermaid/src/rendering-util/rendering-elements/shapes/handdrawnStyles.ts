import { getConfig } from '$root/diagram-api/diagramAPI.js';
import type { Node } from '$root/rendering-util/types.d.ts';

// Striped fill like start or fork nodes in state diagrams
export const solidStateFill = (color: string) => {
  const { handdrawnSeed } = getConfig();
  return {
    fill: color,
    hachureAngle: 120, // angle of hachure,
    hachureGap: 4,
    fillWeight: 2,
    roughness: 0.7,
    stroke: color,
    seed: handdrawnSeed,
  };
};

// Striped fill like start or fork nodes in state diagrams
// TODO remove any
export const userNodeOverrides = (node: Node, options: any) => {
  const result = Object.assign({}, options);
  result.fill = node.backgroundColor || options.fill;
  result.stroke = node.borderColor || options.stroke;
  return result;
};
