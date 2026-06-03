import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'railroad';

/**
 * Detector function to identify Railroad diagrams
 * Looks for 'railroad-diagram' keyword at the start of the text
 */
const detector: DiagramDetector = (txt) => {
  return /^\s*railroad-diagram/i.test(txt);
};

/**
 * Lazy loader for the Railroad diagram
 */
const loader: DiagramLoader = async () => {
  const { diagram } = await import('./railroadDiagram.js');
  return { id, diagram };
};

/**
 * Export the external diagram definition
 */
export const railroad: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
