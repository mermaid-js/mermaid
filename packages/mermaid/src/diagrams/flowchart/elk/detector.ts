import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../../diagram-api/types.js';

const id = 'flowchart-elk';

const detector: DiagramDetector = (txt, config = {}): boolean => {
  // Only the explicit `flowchart-elk` keyword. A flowchart that wants ELK asks for it with
  // `layout: elk`, which needs no detector of its own.
  if (/^\s*flowchart-elk/.test(txt)) {
    config.layout = 'elk';
    return true;
  }
  return false;
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('../flowDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
