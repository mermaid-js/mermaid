import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'wardley-beta';

const detector: DiagramDetector = (text) => {
  return /^\s*wardley-beta/i.test(text);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./wardleyDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
