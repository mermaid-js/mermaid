---
'mermaid': minor
---

Add Cynefin framework diagram type (beta)

Adds the Cynefin framework as a new diagram type to Mermaid (available as `cynefin-beta`). The Cynefin framework, created by Dave Snowden, is a decision-making framework that categorizes problems into five complexity domains, widely used in agile, incident management, strategy, and organizational design.

Features:

- Five fixed domains in canonical layout: Complex, Complicated, Clear, Chaotic, and Confusion
- Wavy organic boundaries between domains using deterministic SVG bezier curves
- The "cliff" between Clear and Chaotic (catastrophic transition indicator)
- Confusion/Disorder center ellipse overlay
- Domain metadata including decision models (Probe/Sense/Respond etc.) and practice types
- Items placed as text badges within each domain
- Transition arrows between domains with optional labels
- Full theme integration across all five mermaid themes
- Schema-driven configuration: width, height, padding, showDomainDescriptions, boundaryAmplitude
- Accessibility: ARIA roles, labels, descriptions

This is the first text-based DSL for Cynefin diagrams in any diagramming tool.

Implementation includes Langium grammar, modular renderer, unit tests, integration tests, Cypress e2e tests, and comprehensive documentation.
