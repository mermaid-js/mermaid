import type { DiagramDetector } from '../../diagram-api/types';

export const ganttDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*gantt/) !== null;
};
