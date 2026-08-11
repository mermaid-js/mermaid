---
'mermaid': minor
---

feat(state): support entry/do/exit actions in state diagrams

State body lines prefixed with `entry /`, `do /`, or `exit /` are now collected as structured actions and rendered in a UML actions compartment beneath the state name, rather than replacing the name as plain descriptions. Lines without one of these keywords are still treated as ordinary descriptions.

Note: an existing diagram whose plain description happens to begin with `entry /`, `do /`, or `exit /` (case-insensitive) will now render that line as an action below the state name rather than as the title. Collision is unlikely and the new rendering is the more correct one.

Addresses mermaid-js/mermaid#2899
