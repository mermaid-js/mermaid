import type { DiagramDetector } from '../../diagram-api/types.ts';
import type { ExternalDiagramDefinition } from '../../diagram-api/types.ts';

const id = 'gitGraph';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*gitGraph/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./gitGraphDiagram.ts');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
