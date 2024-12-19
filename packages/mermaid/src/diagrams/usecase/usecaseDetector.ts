import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'usecase';

const detector: DiagramDetector = (txt) => {
  return /^\s*usecase-beta/.test(txt);
};

const loader = async () => {
  const { diagram } = await import('./usecaseDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
