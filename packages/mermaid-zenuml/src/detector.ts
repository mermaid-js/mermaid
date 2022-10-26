export const id = 'zenuml';

export const detector = (txt: string) => {
  return txt.match(/^\s*zenuml/) !== null;
};

export const loadDiagram = async () => {
  const { diagram } = await import('./diagram-definition');
  return { id, diagram };
};
