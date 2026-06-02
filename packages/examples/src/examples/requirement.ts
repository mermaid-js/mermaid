import type { DiagramMetadata } from '../types.js';

export default {
  id: 'requirement',
  name: 'Requirement Diagram',
  description: 'Visualize system requirements and their relationships',
  examples: [
    {
      title: 'Basic Requirements',
      code: `requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req`,
      isDefault: true,
    },
  ],
} satisfies DiagramMetadata;
