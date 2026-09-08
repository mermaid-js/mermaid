---
'mermaid': patch
---

Circle, double circle, Delay and Display nodes size themselves from the label's height as well as its width, so a wrapped label stays inside the outline. Each was sized from the width alone and clipped any label taller than it was wide, which `flowchart.wrappingWidth: 120` made common.

This replaces the wrapping exemption those shapes carried along with stadium and diamond: it stopped them wrapping at all, so a long label produced a single-line node hundreds of pixels wide. Stadium needs no exemption — its `w >= 1.5h` floor already keeps a wrapped label from closing the caps into a circle — and diamond never needed one.
