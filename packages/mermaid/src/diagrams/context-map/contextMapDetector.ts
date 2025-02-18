import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'context-map-beta';

const detector: DiagramDetector = (txt) => {
  return /^\s*context-map-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./contextMapDiagram.js');
  return { id, diagram };
};

export const contextMap: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
