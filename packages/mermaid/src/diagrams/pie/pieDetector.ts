import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'pie';

const detector: DiagramDetector = (txt) => {
  return /^\s*pie/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./pieDiagram.js');
  return { id, diagram };
};

export const pie: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Pie Chart',
  description: 'Visualize data as proportional segments of a circle',
  examples: [
    {
      isDefault: true,
      code: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,
      title: 'Basic Pie Chart',
    },
  ],
};
