# Network Diagram (v\<MERMAID_RELEASE_VERSION\>+)

## Introduction

A network diagram is a visual representation of a network topology, showing how
devices such as routers, switches, servers, firewalls, clouds and databases are
connected together. It is intended for documenting LAN/WAN layouts, lab/testbed
setups and cloud network architectures.

## Usage

This diagram is useful for network engineers, infrastructure architects, SREs
and educators who need to show how a small number of network devices are
connected to each other.

The layout is computed using a force-directed simulation, so node positions are
generated automatically from the connections in the graph.

## Syntax

```
networkDiagram
    node <id> [: <type>] ["<label>"] [key="value" ...]
    <id> <arrow> <id> [: "<link label>"]
    subnet <id> ["<label>"] { ... }
```

- `node <id>` declares a node. The `id` is used to reference the node in links.
- `: <type>` (optional) picks the icon shape. Built-in types are `router`,
  `switch`, `server`, `firewall`, `cloud` (alias `internet`), `database`
  (alias `db`). Any other value falls back to a default rectangular shape.
- `"<label>"` (optional) overrides the displayed label. Defaults to the `id`.
- `key="value"` pairs attach metadata to the node and surface as a tooltip
  via the SVG `<title>` element. Values must be quoted strings.
- `<arrow>` is one of `---` / `--` (undirected), `-->` (forward), `<--`
  (backward) or `<-->` (bidirectional).
- An optional link label can be added after the link with `: "<label>"`.
- `subnet <id> { ... }` groups nodes inside a labelled, dashed boundary.
  Subnets may contain `node` declarations and links.

Nodes referenced from a link but never declared explicitly are created
automatically using the default shape.

## Examples

```mermaid-example
---
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
    sw2 --- server : "secondary"
```

```mermaid-example
networkDiagram
    title DMZ
    node internet : cloud "Internet"
    node fw : firewall "Edge Firewall"
    node sw : switch "DMZ Switch"
    node web : server "Web Server"
    node db : database "Database"
    internet --- fw
    fw --- sw
    sw --- web
    web --- db
```

```mermaid-example
---
title: "VPC with directional traffic"
---
networkDiagram
    node user : cloud "User"
    subnet vpc "Production VPC" {
      node lb : switch "Load Balancer"
      node web : server "Web Tier" ip="10.0.1.10"
      node app : server "App Tier" ip="10.0.2.10"
      node db : database "Database" ip="10.0.3.10"
      lb --> web
      web --> app
      app --> db
    }
    user --> lb : "https"
```

## Node Types

| Type                 | Shape                                       |
| -------------------- | ------------------------------------------- |
| `router`             | Circle with four directional arrows         |
| `switch`             | Rounded rectangle with bidirectional arrows |
| `server`             | Tall rounded rectangle with chassis lines   |
| `firewall`           | Rectangle with a brick-wall pattern         |
| `cloud` / `internet` | Cloud silhouette                            |
| `database` / `db`    | Cylinder                                    |
| (anything else)      | Rounded rectangle (default)                 |

## Configuration

The diagram accepts the standard accessibility (`accTitle`, `accDescr`) and
`title` directives.

Diagram-specific options under `network` in the Mermaid config:

| Option              | Default | Description                                             |
| ------------------- | ------- | ------------------------------------------------------- |
| `padding`           | `20`    | Padding around the diagram in pixels.                   |
| `nodeSpacing`       | `140`   | Target distance between connected nodes.                |
| `iconSize`          | `60`    | Width/height of each node icon in pixels.               |
| `labelFontSize`     | `14`    | Font size for node labels.                              |
| `linkLabelFontSize` | `11`    | Font size for link labels.                              |
| `iterations`        | `300`   | Number of force-simulation iterations before rendering. |
