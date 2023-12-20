import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'matrixchart';

const detector: DiagramDetector = (txt) => {
  return /^\s*matrixchart-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./matrixchartDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
