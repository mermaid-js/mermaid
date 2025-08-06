import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'usecase';

const detector: DiagramDetector = (txt) => {
  return /^\s*usecase/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const usecase: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
