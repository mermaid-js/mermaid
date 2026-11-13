import type { DiagramMetadata } from '../types.js';

export default {
  id: 'swimlane',
  name: 'Swimlane Diagram',
  description:
    'Divide a process into lanes to show who owns each step and where work is handed off',
  examples: [
    {
      title: 'Support Request',
      isDefault: true,
      code: `swimlane-beta LR
  subgraph Customer
    request[Request service]
    receive[Receive update]
  end

  subgraph Support
    triage[Triage request]
    answer[Send answer]
  end

  subgraph Engineering
    investigate[Investigate issue]
    fix[Prepare fix]
  end

  request --> triage
  triage -->|Known issue| answer
  triage -->|Needs code change| investigate
  investigate --> fix --> answer
  answer --> receive`,
    },
    {
      title: 'Quote Approval',
      code: `swimlane-beta LR
  subgraph sales [Sales team]
    lead([Qualify lead])
    quote[Prepare quote]
  end

  subgraph finance [Finance team]
    review{Terms OK?}
    approve((Approved))
  end

  lead --> quote --> review
  review -->|Yes| approve
  review -->|No| quote`,
    },
  ],
} satisfies DiagramMetadata;
