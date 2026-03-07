import type { DiagramMetadata } from '../types.js';

export default {
  id: 'ishikawa',
  name: 'Ishikawa Diagram',
  description: 'Visualize problem and causes in fishbone',
  examples: [
    {
      title: 'Ishikawa Diagram',
      isDefault: true,
      code: `
ishikawa-beta
    Blurry Photo
    Process
        Out of focus
        Shutter speed too slow
        Protective film not removed
        Beautification filter applied
    User
        Shaky hands
    Equipment
        LENS
            Inappropriate lens
            Damaged lens
            Dirty lens
        SENSOR
            Damaged sensor
            Dirty sensor
    Environment
        Subject moved too quickly
        Too dark
`,
    },
  ],
} satisfies DiagramMetadata;
