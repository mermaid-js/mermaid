---
'mermaid': minor
---

feat(wardley): add `(ecosystem)` source strategy and pioneers/settlers/townplanners attitude zones

Extends the `wardley-beta` diagram to match more of the OWM syntax:

- `(ecosystem)` decorator on a component, drawn as concentric circles with a diagonal-hatch ring (matches OWM's ecosystem-play symbol).
- Attitude zones using OWM's canonical 4-coordinate form `keyword [v1, m1, v2, m2]` for the two opposing corners. Renders as a translucent labelled rectangle in the OWM colour palette:
  - `pioneers` — light blue
  - `settlers` — medium blue
  - `townplanners` — purple
- `explorers` is accepted as an alias for `pioneers`, `villagers` as an alias for `settlers`.
- Strategy and attitude words are keywords only inside a decorator or at the start of an attitude line, so names such as `buyer`, `market research`, `ecosystem` or `settlers app` still parse.
- Zone and ecosystem colours can be themed through `themeVariables.wardley`: `pioneersStroke`, `pioneersFill`, `settlersStroke`, `settlersFill`, `townplannersStroke`, `townplannersFill`, `ecosystemOuterFill`, `ecosystemMiddleFill` and `ecosystemInnerFill`.

Example:

```mermaid
wardley-beta
component Developer Platform [0.78, 0.10] (ecosystem)
pioneers [0.95, 0.05, 0.55, 0.30]
settlers [0.95, 0.35, 0.55, 0.65]
townplanners [0.95, 0.70, 0.55, 0.95]
```
