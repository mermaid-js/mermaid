import type { ExternalDiagramDefinition } from 'mermaid';

const id = 'zenuml';
const regexp = /^\s*zenuml/;

const detector = (txt: string) => {
  return txt.match(regexp) !== null;
};

const loader = async () => {
  const { diagram } = await import('./zenuml-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
