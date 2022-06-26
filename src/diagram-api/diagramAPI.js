const diagrams = {};

export const registerDiagram = (id, parser, identifier, renderer) => {
  diagrams[id] = { parser, identifier, renderer };
};

export const getDiagrams = () => {
  return diagrams;
};
