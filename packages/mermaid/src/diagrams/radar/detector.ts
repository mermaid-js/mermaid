import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'radar';

const detector: DiagramDetector = (txt) => {
  return /^\s*radar-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const radar: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Radar Diagram',
  description: 'Visualize data in a radial format',
  examples: [
    {
      code: `---
title: "Grades"
---
radar-beta
  axis m["Math"], s["Science"], e["English"]
  axis h["History"], g["Geography"], a["Art"]
  curve a["Alice"]{85, 90, 80, 70, 75, 90}
  curve b["Bob"]{70, 75, 85, 80, 90, 85}

  max 100
  min 0
`,
    },
  ],
};
