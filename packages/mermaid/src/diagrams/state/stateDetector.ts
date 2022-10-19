import type { DiagramDetector } from '../../diagram-api/types';

export const stateDetector: DiagramDetector = (txt, config) => {
  // If we have confirmed to only use new state diagrams this function should always return false
  // as in not signalling true for a legacy state diagram
  if (config?.state?.defaultRenderer === 'dagre-wrapper') return false;
  return txt.match(/^\s*stateDiagram/) !== null;
};
