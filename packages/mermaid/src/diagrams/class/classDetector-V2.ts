import type { DiagramDetector } from '../../diagram-api/types';

export const classDetectorV2: DiagramDetector = (txt, config) => {
  // If we have confgured to use dagre-wrapper then we should return true in this function for classDiagram code thus making it use the new class diagram
  if (txt.match(/^\s*classDiagram/) !== null && config?.class?.defaultRenderer === 'dagre-wrapper')
    return true;
  // We have not opted to use the new renderer so we should return true if we detect a class diagram
  return txt.match(/^\s*classDiagram-v2/) !== null;
};
