export const mindmapDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*mindmap/) != null;
};
