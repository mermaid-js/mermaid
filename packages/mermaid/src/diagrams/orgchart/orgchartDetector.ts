import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'orgchart';

const detector: DiagramDetector = (txt) => {
  return /^\s*orgchart-beta(?:\s|$)/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./orgchartDiagram.js');
  return { id, diagram };
};

export const orgchart: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
