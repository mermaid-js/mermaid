import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'gantt';

const detector: DiagramDetector = (txt) => {
  return /^\s*gantt/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./ganttDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Gantt Chart',
  description: 'Visualize project schedules and timelines',
  examples: [
    {
      isDefault: true,
      code: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,
      title: 'Basic Project Timeline',
    },
  ],
};

export default plugin;
