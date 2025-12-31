---
"mermaid": patch
---

fix: correct Y-axis coordinate calculation in architecture diagram layout

Corrects inverted Y-axis logic in `shiftPositionByArchitectureDirectionPair` which
caused nodes connected via Top/Bottom directions to be placed far from their
intended positions.
