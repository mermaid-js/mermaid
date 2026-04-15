import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'railroadAbnf';

const detector: DiagramDetector = (txt) => {
  return /^\s*railroad-abnf/i.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./abnfDiagram.js');
  return { id, diagram };
};

export const railroadAbnf: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
