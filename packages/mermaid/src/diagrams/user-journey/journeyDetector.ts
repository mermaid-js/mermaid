import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'journey';

const detector: DiagramDetector = (txt) => {
  return /^\s*journey/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./journeyDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
