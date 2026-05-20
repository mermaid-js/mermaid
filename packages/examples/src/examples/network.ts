import type { DiagramMetadata } from '../types.js';

export default {
  id: 'network',
  name: 'Network Diagram',
  description: 'Visualize network topologies with routers, switches, servers and other devices',
  examples: [
    {
      title: 'Simple LAN',
      isDefault: true,
      code: `---
title: "Simple LAN"
---
networkDiagram
    node router : router "Router"
    node sw1 : switch "Switch 1"
    node sw2 : switch "Switch 2"
    node server : server "Server"
    router --- sw1
    router --- sw2
    sw1 --- server : "primary"
    sw2 --- server : "secondary"`,
    },
    {
      title: 'DMZ',
      code: `networkDiagram
    title DMZ
    node internet : cloud "Internet"
    node fw : firewall "Edge Firewall"
    node sw : switch "DMZ Switch"
    node web : server "Web Server"
    node db : database "Database"
    internet --- fw
    fw --- sw
    sw --- web
    web --- db`,
    },
  ],
} satisfies DiagramMetadata;
