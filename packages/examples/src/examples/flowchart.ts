import type { DiagramMetadata } from '../types.js';

export default {
  id: 'flowchart-v2',
  name: 'Flowchart',
  description: 'Visualize flowcharts and directed graphs',
  examples: [
    {
      title: 'Basic Flowchart',
      isDefault: true,
      code: `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]`,
    },
    {
      title: 'Online Checkout Flow',
      code: `flowchart TD
    Start([Visit online store]) --> Browse[Browse products]
    Browse --> Cart[Add items to cart]
    Cart --> Decide{Ready to check out?}
    Decide -->|Keep shopping| Browse
    Decide -->|Yes| Pay[Enter payment details]
    Pay --> Valid{Payment accepted?}
    Valid -->|No| Retry[Show error message]
    Retry --> Pay
    Valid -->|Yes| Confirm[Order confirmed]
    Confirm --> Done([Email receipt])

    style Start fill:#e8f5e9,stroke:#43a047
    style Done fill:#e8f5e9,stroke:#43a047
    style Valid fill:#fff3e0,stroke:#fb8c00`,
    },
    {
      title: 'CI/CD Pipeline with Subgraphs',
      code: `flowchart LR
    subgraph dev[Development]
        Code[Write code] --> PR[Open pull request]
    end

    subgraph ci[Continuous Integration]
        Build[Build] --> Test[Run tests]
        Test --> Gate{Tests pass?}
    end

    subgraph cd[Deployment]
        Stage[Deploy to staging] --> Approve[Manual approval]
        Approve --> Prod[Deploy to production]
    end

    PR --> Build
    Gate -->|Yes| Stage
    Gate -->|No| Code`,
    },
    {
      title: 'Expanded Node Shapes',
      code: `flowchart TD
    Form@{ shape: manual-input, label: "User fills in form" }
    Docs@{ shape: docs, label: "Uploaded documents" }
    Check@{ shape: procs, label: "Automated checks" }
    Decision@{ shape: diam, label: "Application approved?" }
    DB@{ shape: cyl, label: "Customer database" }
    Letter@{ shape: stadium, label: "Send welcome email" }

    Form --> Docs
    Docs --> Check
    Check --> Decision
    Decision -->|Yes| DB
    Decision -->|No| Form
    DB --> Letter`,
    },
  ],
} satisfies DiagramMetadata;
