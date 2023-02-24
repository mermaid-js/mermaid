import type { ExternalDiagramDefinition } from '../../diagram-api/types';

const id = 'c4';

const detector = (txt: string) => {
  return txt.match(/^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./c4Diagram');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
