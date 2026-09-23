import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'bpmn';

const detector: DiagramDetector = (txt) => {
  return /^\s*bpmn(?:-beta)?(?:\s|$)/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./bpmnDiagram.js');
  return { id, diagram };
};

export const bpmn: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
