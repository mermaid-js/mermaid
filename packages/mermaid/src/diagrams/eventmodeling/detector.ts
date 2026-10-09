import type { DiagramDetector, DiagramLoader } from '../../diagram-api/types.js';
import type { ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'eventmodeling';

const detector: DiagramDetector = (txt) => {
  return /^\s*eventmodeling/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
