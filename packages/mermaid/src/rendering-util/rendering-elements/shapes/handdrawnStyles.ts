import { getConfig } from '$root/diagram-api/diagramAPI.js';

// Striped fill like start or fork nodes in state diagrams
export const solidStateFill = (color: string) => {
  const { handdrawnSeed } = getConfig();
  return {
    fill: color,
    hachureAngle: 120, // angle of hachure,
    hachureGap: 4,
    fillWeight: 2,
    roughness: 0.7,
    seed: handdrawnSeed,
  };
};
