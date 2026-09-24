import type { DiagramMetadata } from '../types.js';

export default {
  id: 'bpmn',
  name: 'BPMN Diagram',
  description: 'Show a business process as events, tasks, gateways, pools, and lanes',
  examples: [
    {
      title: 'Basic Flow',
      isDefault: true,
      code: `bpmn LR
  start s1 "Start"
  task:user t1 "Review order"
  task:service t2 "Charge card"
  end e1 "Done"
  s1 --> t1 --> t2 --> e1`,
    },
  ],
} satisfies DiagramMetadata;
