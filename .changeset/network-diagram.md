---
'mermaid': minor
'@mermaid-js/parser': minor
---

feat: Add support for Network Topology diagrams (`networkDiagram` / `network`). Nodes can be declared with a typed icon (`router`, `switch`, `server`, `firewall`, `cloud`/`internet`, `database`/`db`, or a default rectangle for any other value) and connected with `---` / `--` links that can carry optional labels. The diagram supports subnets, directional arrows (`-->`, `<--`) and per-node metadata. Layout is computed via a deterministic force-directed simulation, with all sizes/spacing exposed under the `network` configuration key. Resolves #1227.
