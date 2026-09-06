---
'mermaid': minor
---

Add Domain Storytelling diagram type (beta)

Adds Domain Storytelling as a new diagram type to Mermaid (available as `domainstorytelling-beta`). Domain Storytelling, developed by Stefan Hofer and Henning Schwentner, is a collaborative modeling technique from Domain-Driven Design where domain experts tell stories about their work and software teams listen to understand the domain.

Features:

- Actors (people, systems, organizations) rendered as labeled icon nodes
- Work objects (documents, data, interfaces) rendered as labeled icon nodes
- Numbered activity arrows between actors and work objects forming a readable story sequence
- Annotations with bracket-shaped callout pointers for contextual notes
- Groups/swimlanes for organizing actors into bounded contexts or organizational units
- Optional sentence ids (`id S_…`) as stable annotation targets, for stories that use a sequence number more than once
- Built-in `mermaid-domainstorytelling` icon pack covering the base notation (`person`, `people`, `system`, `document`, `folder`, `call`, `email`, `conversation`, `info`), referenced by bare name with no `registerIconPacks` call; `person` and `document` are the defaults, and any Iconify icon can be used in `pack:icon` form
- Full dagre layout with configurable rank direction (LR/RL/TB/BT), node and rank spacing
- Sequence number circles positioned along activity arrows
- Theme integration across the base, default, dark, forest, and neutral themes: actor, workobject, sequence-circle, and group colors adapt per theme via dedicated `domainstorytellingActorColor`, `domainstorytellingWorkobjectColor`, `domainstorytellingSequenceColor`, and `domainstorytellingGroupColor` theme variables
- Schema-driven configuration: `rankdir`, `nodeSpacing`, `rankSpacing`, `diagramPadding`, `useMaxWidth`

This brings Domain Storytelling into Mermaid's text-based DSL ecosystem, making it easy to version-control and share domain stories alongside code.

Implementation includes a Langium grammar, parser, renderer using the new rendering-util/render pipeline, unit tests, Playwright e2e tests, and documentation.
