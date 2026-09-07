import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
import { resolveDefaultRenderer } from '../../diagram-api/defaultRenderer.js';

const id = 'classDiagram';

const detector: DiagramDetector = (txt, config) => {
  // `classDiagram` code renders with the unified class diagram as soon as a renderer is
  // configured (`dagre` and its aliases, or `elk`).
  if (
    /^\s*classDiagram/.test(txt) &&
    resolveDefaultRenderer(config?.class?.defaultRenderer) !== undefined
  ) {
    return true;
  }
  // We have not opted to use the new renderer so we should return true if we detect a class diagram
  return /^\s*classDiagram-v2/.test(txt);
};

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
