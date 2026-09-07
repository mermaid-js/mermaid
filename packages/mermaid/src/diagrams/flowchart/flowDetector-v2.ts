import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'flowchart-v2';

// `graph` and `flowchart` both render with the unified flowchart. Which layout runs is
// decided by the `layout` option, not by the diagram id.
const detector: DiagramDetector = (txt) => /^\s*(graph|flowchart)/.test(txt);

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
