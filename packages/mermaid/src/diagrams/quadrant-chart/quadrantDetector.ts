import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'quadrantChart';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*quadrantChart/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./quadrantDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
