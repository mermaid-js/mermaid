import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'wireframe';

const detector: DiagramDetector = (txt) => {
  return /^\s*wireframe-beta(?:\s|$)/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

const wireframe: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default wireframe;
