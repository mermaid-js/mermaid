import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types';

const id = 'journey';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*journey/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./journeyDiagram');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
