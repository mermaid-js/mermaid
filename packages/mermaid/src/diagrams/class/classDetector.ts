import type { DiagramDetector } from '../../diagram-api/types';

export const classDetector: DiagramDetector = (txt, config) => {
  // If we have confgured to use dagre-wrapper then we should never return true in this function
  if (config?.class?.defaultRenderer === 'dagre-wrapper') return false;
  // We have not opted to use the new renderer so we should return true if we detect a class diagram
  return txt.match(/^\s*classDiagram/) !== null;
};
