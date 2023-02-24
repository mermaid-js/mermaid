import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types';

const id = 'error';

const detector: DiagramDetector = (text) => {
  return text.toLowerCase().trim() === 'error';
};

const loader = async () => {
  const { diagram } = await import('./errorDiagram');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
