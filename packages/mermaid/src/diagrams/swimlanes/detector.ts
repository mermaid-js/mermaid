import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'swimlane';

const detector: DiagramDetector = (txt) => {
  return /^\s*swimlane\b/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./swimlanesDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
