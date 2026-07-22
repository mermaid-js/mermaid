import type { DiagramMetadata } from '../types.js';

export default {
  id: 'radar',
  name: 'Radar Diagram',
  description: 'Visualize data in a radial format',
  examples: [
    {
      title: 'Student Grades',
      isDefault: true,
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
    {
      title: 'Framework Comparison with Polygon Grid',
      code: `radar-beta
  title Frontend Framework Comparison
  axis perf["Performance"], dx["Dev Experience"], eco["Ecosystem"]
  axis learn["Easy to Learn"], docs["Documentation"]

  curve react["React"]{4, 4, 5, 3, 4}
  curve vue["Vue"]{4, 5, 4, 4, 5}
  curve svelte["Svelte"]{5, 5, 3, 4, 4}

  graticule polygon
  max 5
  min 0`,
    },
  ],
} satisfies DiagramMetadata;
