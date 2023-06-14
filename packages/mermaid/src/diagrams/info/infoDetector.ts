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
  return { id: id, diagram: diagram };
};

const plugin: ExternalDiagramDefinition = {
  id: id,
  detector: detector,
  loader: loader,
};

export default plugin;
