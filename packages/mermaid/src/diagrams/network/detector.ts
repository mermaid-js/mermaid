import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'network';

const detector: DiagramDetector = (txt) => {
  return /^\s*(?:network|networkDiagram)\b/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const network: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
