import type { DiagramDetector } from '../../diagram-api/detectType';

export const sequenceDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*sequenceDiagram/) !== null;
};
