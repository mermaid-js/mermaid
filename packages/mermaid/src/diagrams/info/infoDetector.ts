import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types';

const id = 'info';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*info/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./infoDiagram');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
