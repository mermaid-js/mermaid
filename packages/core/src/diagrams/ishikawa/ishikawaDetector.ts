import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'ishikawa';

const detector: DiagramDetector = (txt) => {
  return /^\s*ishikawa(-beta)?\b/i.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./ishikawaDiagram.js');
  return { id, diagram };
};

export const ishikawa: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
