import type { DiagramDetector } from '../../diagram-api/detectType';

export const pieDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*pie/) !== null;
};
