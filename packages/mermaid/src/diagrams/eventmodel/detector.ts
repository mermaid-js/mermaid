import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'eventModel';

const detector: DiagramDetector = (txt) => {
  return /^\s*eventModel-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const eventModel: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
