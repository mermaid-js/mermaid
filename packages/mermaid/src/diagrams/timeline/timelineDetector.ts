import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'timeline';

const detector: DiagramDetector = (txt) => {
  return /^\s*timeline/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./timelineDiagram.js');
  return { id, diagram };
};

export const timeline: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
