export const mindmapDetector = (txt: string) => {
  return txt.match(/^\s*mindmap/) !== null;
};
