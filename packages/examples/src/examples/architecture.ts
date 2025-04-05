import type { DiagramMetadata } from '../types.js';

export default {
  id: 'architecture',
  name: 'Architecture Diagram',
  description: 'Visualize system architecture and components',
  examples: [
    {
      title: 'Basic System Architecture',
      code: `architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(server)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db`,
      isDefault: true,
    },
  ],
} satisfies DiagramMetadata;
