import type { DiagramDetector } from '../../diagram-api/types';

export const flowDetectorV2: DiagramDetector = (txt, config) => {
  if (config?.flowchart?.defaultRenderer === 'dagre-d3') {
    return false;
  }
  if (config?.flowchart?.defaultRenderer === 'elk') {
    return false;
  }

  // If we have configured to use dagre-wrapper then we should return true in this function for graph code thus making it use the new flowchart diagram
  if (txt.match(/^\s*graph/) !== null) {
    return true;
  }
  return txt.match(/^\s*flowchart/) !== null;
};
