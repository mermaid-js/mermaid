import type { DiagramMetadata } from '../types.js';

export default {
  id: 'agentflow',
  name: 'Agentflow',
  description: 'Describe agent flows with steps, decisions, and data movement',
  examples: [
    {
      title: 'Basic Agentflow',
      isDefault: true,
      code: `agentflow-beta TB
  a["Alpha"]
  b["Beta"]
  a --> b`,
    },
  ],
} satisfies DiagramMetadata;
