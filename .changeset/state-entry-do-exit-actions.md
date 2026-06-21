---
'mermaid': minor
---

feat(state): support entry/do/exit actions in state diagrams

State body lines prefixed with `entry /`, `do /`, or `exit /` are now collected as structured actions and rendered in a UML actions compartment beneath the state name, rather than replacing the name as plain descriptions. Lines without one of these keywords are still treated as ordinary descriptions.

Addresses mermaid-js/mermaid#2899
