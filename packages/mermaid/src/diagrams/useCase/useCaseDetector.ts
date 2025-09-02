import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'usecase';

const detector: DiagramDetector = (txt) => {
  return /^\s*usecase/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./useCaseDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
