export const id = 'mindmap';

export const detector = (txt: string) => {
  return txt.match(/^\s*mindmap/) !== null;
};

export const loadDiagram = async () => {
  const { diagram } = await import('./diagram-definition');
  return { id, diagram };
};
