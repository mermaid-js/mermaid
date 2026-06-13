import type { DiagramMetadata } from '../types.js';

export default {
  id: 'architecture',
  name: 'Architecture Diagram',
  description: 'Visualize system architecture and components',
  examples: [
    {
      title: 'Basic System Architecture',
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
    },
    {
      title: 'Web App with Frontend and Backend Groups',
      code: `architecture-beta
    group frontend(cloud)[Frontend]
    group backend(cloud)[Backend]

    service web(internet)[Website] in frontend
    service mobile(internet)[Mobile App] in frontend
    service api(server)[API Server] in backend
    service auth(server)[Auth Service] in backend
    service db(database)[Database] in backend
    service files(disk)[File Storage] in backend

    web:R --> L:api
    mobile:R --> L:api
    api:R --> L:auth
    api:B --> T:db
    db:R -- L:files`,
    },
    {
      title: 'Load Balancing with Junctions',
      code: `architecture-beta
    service user(internet)[User]
    service lb(server)[Load Balancer]
    service app1(server)[App Server 1]
    service app2(server)[App Server 2]
    junction fanout

    user:R -- L:lb
    lb:R -- L:fanout
    app1:B -- T:fanout
    app2:T -- B:fanout`,
    },
  ],
} satisfies DiagramMetadata;
