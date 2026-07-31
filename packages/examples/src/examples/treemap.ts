import type { DiagramMetadata } from '../types.js';

export default {
  id: 'treemap',
  name: 'Treemap',
  description: 'Visualize hierarchical data as nested rectangles',
  examples: [
    {
      title: 'Monthly Household Budget',
      isDefault: true,
      code: `---
config:
  treemap:
    valueFormat: '$0,0'
---
treemap-beta
"Monthly Budget"
    "Housing"
        "Rent": 1400
        "Utilities": 220
        "Internet": 60
    "Food"
        "Groceries": 480
        "Dining out": 180
    "Transport"
        "Car payment": 320
        "Fuel": 140
    "Savings"
        "Emergency fund": 300
        "Retirement": 400`,
    },
    {
      title: 'Disk Usage with Styling',
      code: `treemap-beta
"Storage Used"
    "Media":::warning
        "Videos": 120
        "Photos": 80
        "Music": 25
    "Documents"
        "Work": 35
        "Personal": 15
    "Apps": 60
    "System": 40

classDef warning fill:#f96,stroke:#333;`,
    },
  ],
} satisfies DiagramMetadata;
