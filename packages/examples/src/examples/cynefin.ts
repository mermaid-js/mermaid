import type { DiagramMetadata } from '../types.js';

export default {
  id: 'cynefin',
  name: 'Cynefin Framework',
  description: 'Decision-making framework for categorizing problems by complexity',
  examples: [
    {
      title: 'Incident Response',
      isDefault: true,
      code: `cynefin-beta
  title Incident Response

  complex
    "Investigate root cause"
    "Run chaos experiment"

  complicated
    "Analyze performance data"
    "Expert review needed"

  clear
    "Restart service"
    "Apply known fix"

  chaotic
    "Page on-call immediately"

  confusion
    "Unknown failure mode"

  complex --> complicated : "Pattern identified"
  clear --> chaotic : "Complacency"
`,
    },
  ],
} satisfies DiagramMetadata;
