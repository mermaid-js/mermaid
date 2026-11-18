import type { DiagramMetadata } from '../types.js';

export default {
  id: 'orgchart',
  name: 'Org Chart',
  description: 'Show reporting lines and staff functions in an organization',
  examples: [
    {
      title: 'Organization with staff functions',
      isDefault: true,
      code: `orgchart-beta
    CEO "Anna Andersson"
        staff CFO "Bo Berg"
        staff HR "Carina Carlson"
        Engineering "David Dahl"
            Development "Eva Ek"
            Systems "Fred Ford"
        Sales "Greta Gran"
            Europe "Helena Holm"
`,
    },
  ],
} satisfies DiagramMetadata;
