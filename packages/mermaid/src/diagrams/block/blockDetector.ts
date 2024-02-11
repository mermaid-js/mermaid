import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'block';

const detector: DiagramDetector = (txt) => {
  return /^\s*block-beta/.test(txt);
};

const loader = async () => {
  const { diagram } = await import('./blockDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
