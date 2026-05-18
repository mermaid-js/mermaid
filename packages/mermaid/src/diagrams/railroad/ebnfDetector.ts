import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'railroadEbnf';

const detector: DiagramDetector = (txt) => {
  return /^\s*railroad-ebnf/i.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./ebnfDiagram.js');
  return { id, diagram };
};

export const railroadEbnf: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
