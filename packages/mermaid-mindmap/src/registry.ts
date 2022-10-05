export const id = 'mindmap';

const detector = (txt: string) => {
  return txt.match(/^\s*mindmap/) !== null;
};

export const loadDiagram = async () => {
  const { mindmap } = await import('./add-diagram');
  return { id, diagram: mindmap };
};

export default {
  id,
  detector,
  loadDiagram,
};
