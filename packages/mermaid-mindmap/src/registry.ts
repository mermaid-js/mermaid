export const id = 'mindmap';

const detectorFunction = (txt: string) => {
  return txt.match(/^\s*mindmap/) !== null;
};

export const loadDiagram = async () => {
  const diagram = await import('./add-diagram');
  return { id, detector, diagram };
};
export const detector = async (txt: string) => {
  if (detectorFunction(txt)) {
    const diagram = await import('./add-diagram');
    return { id, diagram };
  } else {
    return false;
  }
};

export const id = 'mindmap';

export default {
  id,
  detector,
  loadDiagram,
};
