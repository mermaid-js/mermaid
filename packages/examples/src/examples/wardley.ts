import type { DiagramMetadata } from '../types.js';

export default {
  id: 'wardley',
  name: 'Wardley Maps',
  description: 'Visualize business strategy and value chains with component evolution',
  examples: [
    {
      title: 'Tea Shop Value Chain',
      isDefault: true,
      code: `wardley
title Tea Shop Value Chain

anchor Business [0.95, 0.63]
component Cup of Tea [0.79, 0.61]
component Tea [0.63, 0.81]
component Hot Water [0.52, 0.80]
component Kettle [0.43, 0.35]
component Power [0.10, 0.70]

Business -> Cup of Tea
Cup of Tea -> Tea
Cup of Tea -> Hot Water
Hot Water -> Kettle
Kettle -> Power

evolve Kettle 0.62
evolve Power 0.89

note Standardising power allows Kettles to evolve faster [0.30, 0.49]
`,
    },
    {
      title: 'Custom Evolution Stages',
      code: `wardley
title Data Evolution Pipeline
evolution Unmodelled -> Divergent -> Convergent -> Modelled

component User Needs [0.95, 0.05]
component Data Collection [0.80, 0.15]
component Custom Analytics [0.70, 0.35]
component Standardized Reports [0.65, 0.65]
component Commodity Storage [0.60, 0.85]

User Needs -> Data Collection
Data Collection -> Custom Analytics
Custom Analytics -> Standardized Reports
Standardized Reports -> Commodity Storage

evolve Custom Analytics 0.60
evolve Standardized Reports 0.85
`,
    },
    {
      title: 'Pipeline Components',
      code: `wardley
title Database Evolution Pipeline

component Database [0.40, 0.60]

pipeline Database {
  component "File System" [0.25]
  component "SQL DB" [0.50]
  component "NoSQL" [0.70]
  component "Cloud DB" [0.85]
}
`,
    },
  ],
} satisfies DiagramMetadata;
