import type { ExternalDiagramDefinition } from 'mermaid';

const id = 'zenuml';

export const regexp = /^\s*zenuml/;

const detector = (txt: string) => {
  return txt.match(regexp) !== null;
};

const loader = async () => {
  const { diagram } = await import('./diagram-definition');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
