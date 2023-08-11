import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'er';

const detector: DiagramDetector = (txt) => {
  return /^\s*erDiagram/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./erDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
