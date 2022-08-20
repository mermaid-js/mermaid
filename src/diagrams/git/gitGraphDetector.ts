export const gitGraphDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*gitGraph/) != null;
};
