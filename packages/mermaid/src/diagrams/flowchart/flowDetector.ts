import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
import { resolveDefaultRenderer } from '../../diagram-api/defaultRenderer.js';

const id = 'flowchart';

const detector: DiagramDetector = (txt, config) => {
  // Any configured renderer (`dagre` with its aliases, or `elk`) routes `graph` code to the
  // unified flowchart, so this legacy id only applies when no renderer is configured.
  if (resolveDefaultRenderer(config?.flowchart?.defaultRenderer) !== undefined) {
    return false;
  }
  return /^\s*graph/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./flowDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
