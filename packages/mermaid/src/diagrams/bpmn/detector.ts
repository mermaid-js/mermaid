import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'bpmn';

/**
 * `bpmn-beta` only. The bare keyword stays unclaimed while the syntax settles, which the
 * beta policy spec enforces for every new diagram.
 */
const detector: DiagramDetector = (txt) => /^\s*bpmn-beta\b/.test(txt);

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const bpmn: ExternalDiagramDefinition = { id, detector, loader };
