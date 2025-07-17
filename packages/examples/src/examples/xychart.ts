import type { DiagramMetadata } from '../types.js';

export default {
  id: 'xychart',
  name: 'XY Chart',
  description: 'Create scatter plots and line charts with customizable axes',
  examples: [
    {
      title: 'Sales Revenue',
      isDefault: true,
      code: `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]`,
    },
  ],
} satisfies DiagramMetadata;
