import type { DiagramDetector } from '../../diagram-api/detectType';

export const ganttDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*gantt/) !== null;
};
