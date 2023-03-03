import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.ts';

const id = 'error';

const detector: DiagramDetector = (text) => {
  return text.toLowerCase().trim() === 'error';
};

const loader = async () => {
  const { diagram } = await import('./errorDiagram.ts');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
