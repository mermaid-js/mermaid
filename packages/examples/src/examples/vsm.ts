import type { DiagramMetadata } from '../types.js';

export default {
  id: 'vsm',
  name: 'Value Stream Map',
  description: 'Visualize value stream flows with process steps, queues, and summary metrics',
  examples: [
    {
      title: 'Widget Production',
      isDefault: true,
      code: `vsm
    supplier "Steel Co" >> stamping >> welding >> assembly >> customer "Customer"

    stamping "Stamping"
        cycletime 1s
        changeover 1h
        push

    queue 3d

    welding "Welding"
        cycletime 38s
        changeover 10m
        push

    queue 2d

    assembly "Assembly"
        cycletime 62s
        pull

    queue 1d

    summary all
`,
    },
  ],
} satisfies DiagramMetadata;
