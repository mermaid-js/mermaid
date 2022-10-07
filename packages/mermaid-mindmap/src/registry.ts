export const id = 'mindmap';

export const detector = (txt: string) => {
  return txt.match(/^\s*mindmap/) !== null;
};

export const loadDiagram = async () => {
  const { mindmap } = await import('./add-diagram');
  return { id, diagram: mindmap };
};
