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
};

export default plugin;
