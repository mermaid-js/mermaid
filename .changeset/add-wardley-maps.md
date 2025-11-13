---
'mermaid': minor
---

Add Wardley Maps diagram type (beta)

Adds Wardley Maps as a new diagram type to Mermaid (available as `wardley-beta`). Wardley Maps are visual representations of business strategy that help map value chains and component evolution.

Features:

- Component positioning with [visibility, evolution] coordinates (OWM format)
- Anchors for users/customers
- Multiple link types: dependencies, flows, labeled links
- Evolution arrows and trend indicators
- Custom evolution stages with optional dual labels
- Custom stage widths using @boundary notation
- Pipeline components with visibility inheritance
- Annotations, notes, and visual elements
- Source strategy markers: build, buy, outsource, market
- Inertia indicators
- Theme integration

Implementation includes parser, D3.js renderer, unit tests, E2E tests, and comprehensive documentation.
