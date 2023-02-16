import type { ExternalDiagramDefinition } from 'mermaid';

const id = 'example-diagram';

const detector = (txt: string) => {
  return txt.match(/^\s*example-diagram/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./diagram-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
