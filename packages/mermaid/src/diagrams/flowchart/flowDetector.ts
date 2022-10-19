import type { DiagramDetector } from '../../diagram-api/types';

export const flowDetector: DiagramDetector = (txt, config) => {
  // If we have conferred to only use new flow charts this function should always return false
  // as in not signalling true for a legacy flowchart
  if (config?.flowchart?.defaultRenderer === 'dagre-wrapper') return false;
  return txt.match(/^\s*graph/) !== null;
};
