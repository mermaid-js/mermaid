---
'mermaid': minor
'@mermaid-js/examples': minor
---

feat: add UML component diagrams (`component-beta`)

Adds a new beta diagram type for UML component diagrams: components (with
optional stereotypes), interfaces, ports on component borders, actors, packages
and nested components, provided/required interface relationships (drawn as the
UML lollipop/socket, including the ball-and-socket assembly when an interface is
both provided and required), dependency/association/plain links with labels,
notes, and the usual `classDef`/`class`/`style`/`title`/`accTitle`/`accDescr`
support.

Based on a syntax proposed by @scottcampbelldata on mermaid-js/mermaid#1462.
