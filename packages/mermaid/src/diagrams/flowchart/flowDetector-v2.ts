import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
import { resolveDefaultRenderer } from '../../diagram-api/defaultRenderer.js';

const id = 'flowchart-v2';

const detector: DiagramDetector = (txt, config) => {
  const renderer = resolveDefaultRenderer(config?.flowchart?.defaultRenderer);

  if (renderer === 'elk' && config) {
    config.layout = 'elk';
  }

  // `graph` code renders with the unified flowchart as soon as a renderer is configured
  // (`dagre` and its aliases, or `elk`); without one it falls to the legacy `flowchart` id.
  if (/^\s*graph/.test(txt) && renderer !== undefined) {
    return true;
  }
  return /^\s*flowchart/.test(txt);
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
