import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'journey';

const detector: DiagramDetector = (txt) => {
  return /^\s*journey/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./journeyDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'User Journey Diagram',
  description: 'Visualize user interactions and experiences with a system',
  examples: [
    {
      isDefault: true,
      code: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`,
      title: 'My Working Day',
    },
  ],
};

export default plugin;
