import type { ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'c4';

const detector = (txt: string) => {
  return /^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/.test(txt);
};

const loader = async () => {
  const { diagram } = await import('./c4Diagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
