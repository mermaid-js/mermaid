import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
const id = 'mindmap';

const detector: DiagramDetector = (txt) => {
  return /^\s*mindmap/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = includeLargeDiagrams
    ? await import('./mindmap-definition.js')
    : await import('../error/errorDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
