import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'quantumCircuit';

const detector: DiagramDetector = (txt) => {
  return /^\s*quantumCircuit/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const quantumCircuit: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
