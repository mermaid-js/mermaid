import type { DiagramDetector } from '../../diagram-api/types';

export const flowDetector: DiagramDetector = (txt, config) => {
  // If we have confired to only use new flow charts this function shohuld always return false
  // as in not signalling true for a legacy flowchart
  if (config?.flowchart?.defaultRenderer === 'dagre-wrapper') return false;
  return txt.match(/^\s*graph/) !== null;
};
