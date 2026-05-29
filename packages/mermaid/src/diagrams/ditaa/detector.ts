import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

// cspell:words ditaa

const id = 'ditaa';

const detector: DiagramDetector = (txt) => {
  return /^\s*ditaa\s*\n/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const ditaa: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
