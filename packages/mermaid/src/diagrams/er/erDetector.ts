import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types';

const id = 'er';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*erDiagram/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./erDiagram');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
