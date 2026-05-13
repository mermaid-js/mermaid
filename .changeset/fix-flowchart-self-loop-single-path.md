---
'mermaid': patch
---

fix: render flowchart and state self-loop edges as a single SVG path

Self-loop edges in flowcharts and state diagrams now keep the existing dagre dummy-edge layout workaround internally, but merge those internal segments before SVG rendering so one logical self-loop is exposed as one rendered path.
