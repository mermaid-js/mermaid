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
  const { themeVariables, handdrawnSeed } = getConfig();
  const { nodeBorder, mainBkg } = themeVariables;
  const result = Object.assign(
    {
      roughness: 0.7,
      fill: mainBkg,
      fillStyle: 'hachure', // solid fill
      fillWeight: 3.5,
      stroke: nodeBorder,
      seed: handdrawnSeed,
      strokeWidth: 1.3,
    },
    options
  );
  if (node.backgroundColor) {
    result.fill = node.backgroundColor;
  }
  if (node.borderColor) {
    result.stroke = node.borderColor;
  }
  return result;
};
