import type { DiagramMetadata } from '../types.js';

export default {
  id: 'ditaa',
  examples: [
    {
      isDefault: true,
      name: 'Basic DITAA',
      code: `
ditaa
+----------+
|  Client  |
+----------+
`,
    },
  ],
} as DiagramMetadata;
