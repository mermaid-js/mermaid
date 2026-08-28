---
'@mermaid-js/layout-elk': patch
---

fix: edges leave diamonds, stadiums and other non-rectangular shapes without kinking.

ELK routes to ports on a node's bounding box and always leaves one perpendicular to the side it sits on. For a rectangle that port is the attachment point; for anything else the outline is inside the box, so the attachment has to move inwards — and the direction it moves in decides whether the edge stays orthogonal.

It used to move along the ray from the node's centre, which lands on the outline at a different offset along the side than the port ELK chose, so the opening segment came out diagonal. The attachment now walks the outline along the edge's own departure axis, staying collinear with ELK's stub: the edge leaves the outline, crosses the box, and carries on in one straight line. Rectangular nodes are unaffected.
