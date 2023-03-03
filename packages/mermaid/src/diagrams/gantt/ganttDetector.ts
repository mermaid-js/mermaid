import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.ts';

const id = 'gantt';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*gantt/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./ganttDiagram.ts');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
