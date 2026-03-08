import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'vsm';

const detector: DiagramDetector = (txt) => {
  return /^\s*vsm/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const vsm: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
