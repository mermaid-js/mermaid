import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'railroadPeg';

const detector: DiagramDetector = (txt) => {
  return /^\s*railroad-peg/i.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./pegDiagram.js');
  return { id, diagram };
};

export const railroadPeg: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
