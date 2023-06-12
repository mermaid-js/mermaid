import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'quadrantChart';

const detector: DiagramDetector = (txt) => {
  return /^\s*quadrantChart/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./quadrantDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
