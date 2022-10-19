// @ts-ignore: TODO Fix ts errors
export const id = 'example-diagram';

/**
 * Detector function that will be called by mermaid to determine if the diagram is this type of diagram.
 *
 * @param txt The diagram text will be passed to the detector
 * @returns True if the diagram text matches a diagram of this type
 */

export const detector = (txt: string) => {
  return txt.match(/^\s*example-diagram/) !== null;
};

export const loadDiagram = async () => {
  const { diagram } = await import('./diagram-definition');
  return { id, diagram };
};
