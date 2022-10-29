import type { DiagramDetector } from '../../diagram-api/types';

export const gitGraphDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*gitGraph/) !== null;
};
