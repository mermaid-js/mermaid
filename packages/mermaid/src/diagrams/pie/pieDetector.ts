import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'pie';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*pie/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./pieDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
