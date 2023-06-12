import type { ExternalDiagramDefinition } from '../../diagram-api/types.js';
const id = 'mindmap';

const detector = (txt: string) => {
  return /^\s*mindmap/.test(txt);
};

const loader = async () => {
  const { diagram } = await import('./mindmap-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
