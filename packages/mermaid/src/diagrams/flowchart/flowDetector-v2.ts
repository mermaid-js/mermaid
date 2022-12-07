import type { DiagramDetector } from '../../diagram-api/types';

export const flowDetectorV2: DiagramDetector = (txt, config) => {
  // If we have configured to use dagre-wrapper then we should return true in this function for graph code thus making it use the new flowchart diagram
  if (config?.flowchart?.defaultRenderer === 'dagre-wrapper' && txt.match(/^\s*graph/) !== null) {
    return true;
  }
  return txt.match(/^\s*flowchart/) !== null;
};
