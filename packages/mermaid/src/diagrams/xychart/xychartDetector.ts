import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'xychart';

const detector: DiagramDetector = (txt) => {
  return /^\s*xychart-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./xychartDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
