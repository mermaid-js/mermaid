import type { ExternalDiagramDefinition } from 'mermaid';

const id = 'timeline';

const detector = (txt: string) => {
  return txt.match(/^\s*timeline/) !== null;
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
