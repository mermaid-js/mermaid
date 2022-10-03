/**
 * Detector function that will be called by mermaid to determine if the diagram is this type of digram.
 *
 * @param txt The diagram text will be passed to the detector
 * @returns True if the diagram text matches a diagram of this type
 */

export const detector = (txt: string) => {
  return txt.match(/^\s*example-diagram/) !== null;
};
