import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'neuralnet';

const detector: DiagramDetector = (txt) => {
  return /^\s*neuralnet/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./neuralnetDiagram.js');
  return { id, diagram };
};

export const neuralnet: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
