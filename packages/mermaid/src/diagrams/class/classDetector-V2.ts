import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'classDiagram';

// Both `classDiagram` and `classDiagram-v2` render with the unified class diagram.
const detector: DiagramDetector = (txt) => /^\s*classDiagram/.test(txt);

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./classDiagram-v2.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
