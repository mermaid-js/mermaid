import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'venn';

const detector: DiagramDetector = (txt) => {
  return /^\s*venn-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./vennDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
