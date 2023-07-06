import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'railroad';

const detector: DiagramDetector = (txt) => {
  return /^\s*railroad-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./railroadDiagram.js');
  return { id, diagram };
};

export const railroad: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
