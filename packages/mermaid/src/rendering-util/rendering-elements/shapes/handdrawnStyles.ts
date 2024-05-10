// Striped fill like start or fork nodes in state diagrams
export const solidStateFill = (color: string) => {
  return {
    fill: color,
    // fillStyle: 'solid',
    hachureAngle: 120, // angle of hachure,
    hachureGap: 4,
    fillWeight: 2,
    roughness: 0.7,
  };
};
