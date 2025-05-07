import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'treemap';

const detector: DiagramDetector = (txt) => {
  console.log('treemap detector', txt);
  return /^\s*treemap/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const treemap: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
