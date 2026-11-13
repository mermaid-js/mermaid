import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'radar';

const detector: DiagramDetector = (txt) => {
  return /^\s*radar-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const radar: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
