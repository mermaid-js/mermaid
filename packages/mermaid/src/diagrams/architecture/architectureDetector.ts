import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'architecture';

const detector: DiagramDetector = (txt) => {
  return /^\s*architecture/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./architectureDiagram.js');
  return { id, diagram };
};

const architecture: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default architecture;
