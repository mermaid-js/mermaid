import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'xychart';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*xychart/i) !== null;
};

const loader = async () => {
  const { diagram } = await import('./xychartDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
