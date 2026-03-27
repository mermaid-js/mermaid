import type { DiagramMetadata } from '../types.js';

export default {
  id: 'wardley',
  name: 'Wardley Map',
  description: 'Visualize value chains and component evolution using Wardley mapping',
  examples: [
    {
      title: 'Basic Wardley Map',
      isDefault: true,
      code: `wardleyMap
  anchor user "User" [0.5, 0.95]
  component web "Web UI" [0.55, 0.85]
  component api "API Service" [0.65, 0.75]
  component db "Database" [0.8, 0.5]
  component cache "Cache Layer" [0.7, 0.6]

  user -> web
  web -> api
  api -> db
  api -> cache
  cache -> db

  evolve web 0.6
  evolve api 0.75
  evolve db 0.85
  evolve cache 0.65`,
    },
    {
      title: 'Component Types and Modifiers',
      code: `wardleyMap
  anchor customer "Customer" [0.95, 0.5]
  component web "Web App" [0.85, 0.6]
  component api "API" [0.7, 0.65] build
  component monitor "Monitoring" [0.4, 0.85] market
  component platform "Platform" [0.3, 0.6] ecosystem
  component legacy "Legacy DB" [0.5, 0.8] inertia
  component vendor "Vendor CRM" [0.6, 0.7] buy

  customer -> web
  web -> api
  api -> legacy
  api -> vendor`,
    },
    {
      title: 'Edge Types and Annotations',
      code: `wardleyMap
  component api "API Gateway" [0.7, 0.65]
  component auth "Auth Service" [0.6, 0.7]
  component db "Database" [0.5, 0.8]
  component cache "Cache" [0.55, 0.75]

  api -> auth
  api -> db
  api +> cache ; "data flow"
  auth => db`,
    },
    {
      title: 'Evolution with Rename',
      code: `wardleyMap
  component api "API v1" [0.4, 0.7]
  component db "MySQL" [0.5, 0.5]
  component infra "On-Prem" [0.3, 0.3]

  api -> db
  db -> infra

  evolve api 0.7
  evolve db -> cloudDb 0.85
  evolve infra -> cloud 0.9`,
    },
    {
      title: 'Notes and Annotations',
      code: `wardleyMap
  component api "API" [0.6, 0.7]
  component db "Database" [0.5, 0.5]
  component cache "Cache" [0.7, 0.6]

  api -> db
  api -> cache

  note "Key bottleneck area" [0.55, 0.65]
  annotation 1 "Critical path" api
  annotation 2 "Needs migration" db`,
    },
    {
      title: 'Areas (Pioneers/Settlers/Town Planners)',
      code: `wardleyMap
  pioneers "Explore" [0.0, 0.0, 0.25, 1.0]
  settlers "Build" [0.25, 0.0, 0.5, 1.0]
  townplanners "Scale" [0.5, 0.0, 1.0, 1.0]

  component novel "Novel Tech" [0.1, 0.5]
  component growing "Growing Svc" [0.35, 0.6]
  component mature "Mature Infra" [0.8, 0.4]`,
    },
    {
      title: 'Pipeline',
      code: `wardleyMap
  anchor user "User" [0.2, 0.95]

  pipeline compute "Compute" [0.5, 0.3, 0.9] {
    bare "Bare Metal" [0.35]
    vm "VMs" [0.55]
    container "Containers" [0.72]
    serverless "Serverless" [0.88]
  }

  user -> compute`,
    },
    {
      title: 'Submap and Accelerators',
      code: `wardleyMap
  component web "Web App" [0.85, 0.6]
  component api "API" [0.6, 0.7]
  component legacy "Legacy" [0.3, 0.5]

  submap auth "Auth Subsystem" [0.5, 0.5] ref "auth-map"

  web -> api
  api -> auth
  api -> legacy

  accelerator api
  deaccelerator legacy`,
    },
    {
      title: 'Custom Axis Labels',
      code: `wardleyMap
  xAxis "Uncharted", "Emerging", "Good", "Best"
  yAxis "Invisible", "Visible"

  anchor user "End User" [0.15, 0.95]
  component app "Application" [0.4, 0.8]
  component infra "Infrastructure" [0.85, 0.3]

  user -> app
  app -> infra`,
    },
    {
      title: 'Full-Featured Map',
      code: `wardleyMap
  accTitle: Platform Architecture
  accDescr: Full platform map with all feature types

  xAxis "Genesis", "Custom", "Product", "Commodity"

  pioneers "Innovation" [0.0, 0.0, 0.25, 1.0]

  anchor customer "Customer" [0.95, 0.5]
  component web "Web App" [0.85, 0.6]
  component api "API Gateway" [0.7, 0.65]
  component auth "Auth Service" [0.6, 0.7]
  component db "Database" [0.5, 0.8] inertia
  component cache "Cache" [0.55, 0.75] build
  component infra "Infrastructure" [0.3, 0.9]
  component monitor "Monitoring" [0.4, 0.85] market

  customer -> web
  web -> api
  api -> auth
  api -> db
  api +> cache ; "data flow"
  auth => db

  evolve api 0.8
  evolve db -> cloudDb 0.9

  note "Key bottleneck" [0.55, 0.65]
  annotation 1 "Critical path" api

  accelerator api
  deaccelerator infra`,
    },
  ],
} satisfies DiagramMetadata;
