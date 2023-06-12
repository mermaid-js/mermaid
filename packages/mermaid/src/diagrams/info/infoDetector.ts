import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'info';

const detector: DiagramDetector = (txt) => {
  return /^\s*info/.test(txt);
};

const loader = async () => {
  const { diagram } = await import('./infoDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
