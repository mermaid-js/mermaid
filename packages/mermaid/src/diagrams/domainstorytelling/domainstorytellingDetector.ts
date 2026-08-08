import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'domainstorytelling';

const detector: DiagramDetector = (txt) => {
  return /^\s*domainstorytelling-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./domainstorytellingDiagram.js');
  return { id, diagram };
};

export const domainstorytelling: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
