import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'packet';

const detector: DiagramDetector = (txt) => {
  return /^\s*packet-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const packet: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
