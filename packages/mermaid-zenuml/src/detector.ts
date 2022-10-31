export const id = 'zenuml';

export const regexp = /^\s*zenuml/;

export const detector = (txt: string) => {
  return txt.match(regexp) !== null;
};

export const loadDiagram = async () => {
  const { diagram } = await import('./diagram-definition');
  return { id, diagram };
};
