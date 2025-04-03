import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'architecture';

const detector: DiagramDetector = (txt) => {
  return /^\s*architecture/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./architectureDiagram.js');
  return { id, diagram };
};

const architecture: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Architecture Diagram',
  description: 'Visualize system architecture and components',
  examples: [
    {
      isDefault: true,
      code: `architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(server)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db`,
      title: 'Basic System Architecture',
    },
  ],
};

export default architecture;
