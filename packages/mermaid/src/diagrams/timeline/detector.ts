import type { ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'timeline';

const detector = (txt: string) => {
  return txt.match(/^\s*timeline/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./timeline-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
