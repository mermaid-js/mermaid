---
'mermaid': minor
'@mermaid-js/parser': minor
---

feat(c4-beta): new experimental `c4-beta` diagram type with a Structurizr-inspired syntax for C4 model diagrams (person/softwareSystem/container/component elements, deploymentNode (with optional `instances` counts) and infrastructureNode for deployment diagrams, a built-in `:::external` convention tag, nested boundaries via `{}` blocks, `-->` relationships with description and technology), parsed with a langium grammar and rendered through the unified rendering pipeline. The legacy C4 syntax is unaffected.
