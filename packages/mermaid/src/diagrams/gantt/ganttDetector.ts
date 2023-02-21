import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types';

const id = 'gantt';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*gantt/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./ganttDiagram');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
