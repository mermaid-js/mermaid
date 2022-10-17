import type { DiagramDetector } from '../../diagram-api/types';

export const sequenceDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*sequenceDiagram/) !== null;
};
