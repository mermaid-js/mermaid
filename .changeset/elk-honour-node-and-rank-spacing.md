---
'mermaid': patch
---

fix: the `elk` layout reads `nodeSpacing` and `rankSpacing` for flowchart, state, class, requirement and agentflow diagrams. They are read against their default of 50, so a diagram that does not set them is laid out exactly as before, `25` halves the gaps and `100` doubles them
