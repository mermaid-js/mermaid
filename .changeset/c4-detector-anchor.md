---
'mermaid': patch
---

fix: Only detect a diagram as C4 when it starts with a C4 keyword

The C4 detector regex anchored only its first alternative, so `C4Container`, `C4Component`, `C4Dynamic` and `C4Deployment` matched anywhere in the text. Diagrams that merely mentioned one of these keywords (e.g. a flowchart node named `C4Container view`) were detected as C4 and failed to render. The alternation is now grouped so that the `^\s*` anchor applies to all five keywords.
