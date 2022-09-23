// import type { DiagramDetector } from '../../diagram-api/detectType';

// export const mindmapDetector: DiagramDetector = (txt) => {
//   return txt.match(/^\s*mindmap/) !== null;
// };
export const mindmapDetector = (txt: string) => {
  return txt.match(/^\s*mindmap/) !== null;
};
