---
'mermaid': patch
---

fix(layout): let a diagram's own nodeSpacing/rankSpacing take effect in the unified dagre layout

The spacing resolution read the flowchart config before the value the diagram's
renderer set on the layout data - and since the flowchart keys have schema
defaults that always exist, every diagram's own spacing (class, state,
requirement, ...) was silently ignored in favour of flowchart's defaults. The
diagram-provided value now wins over the flowchart fallback; an explicit
top-level `nodeSpacing`/`rankSpacing` config override still takes precedence
over both.
