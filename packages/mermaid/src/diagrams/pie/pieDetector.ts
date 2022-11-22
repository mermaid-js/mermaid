import type { DiagramDetector } from '../../diagram-api/types';

export const pieDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*pie/) !== null;
};
