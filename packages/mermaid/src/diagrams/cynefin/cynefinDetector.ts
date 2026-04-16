import type {
  ExternalDiagramDefinition,
  DiagramDetector,
  DiagramLoader,
} from '../../diagram-api/types.js';

const id = 'cynefin';

const detector: DiagramDetector = (txt) => {
  return /^\s*cynefin-beta(?:[\s:]|$)/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./cynefinDiagram.js');
  return { id, diagram };
};

export const cynefin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
