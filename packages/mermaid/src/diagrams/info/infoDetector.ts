import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'info';

const detector: DiagramDetector = (txt) => {
  return /^\s*info/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./infoDiagram.js');
  return { id, diagram };
};

export const info: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
