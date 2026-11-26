import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../../diagram-api/types.js';

const id = 'flowchart-elk';

const detector: DiagramDetector = (txt): boolean => {
  // Only the explicit `flowchart-elk` keyword. A flowchart that wants ELK asks for it with
  // `layout: elk`, which needs no detector of its own. Detectors must not write to the
  // config they are given: it is the shared, frozen `getConfig()` snapshot.
  return /^\s*flowchart-elk/.test(txt);
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
