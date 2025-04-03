import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'requirement';

const detector: DiagramDetector = (txt) => {
  return /^\s*requirement(Diagram)?/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./requirementDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Requirement Diagram',
  description: 'Visualize system requirements and their relationships',
  examples: [
    {
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
      title: 'Basic Requirements',
    },
  ],
};

export default plugin;
