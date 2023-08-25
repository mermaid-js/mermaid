import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'pie';

const detector: DiagramDetector = (txt) => {
  return /^\s*pie/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./pieDiagram.js');
  return { id, diagram };
};

export const pie: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
