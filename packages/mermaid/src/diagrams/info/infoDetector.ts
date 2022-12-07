import type { DiagramDetector } from '../../diagram-api/types';

export const infoDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*info/) !== null;
};
