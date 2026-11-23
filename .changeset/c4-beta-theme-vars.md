---
'mermaid': minor
---

feat(c4-beta): theme element colours via c4 theme variables (`c4PersonBkg`/`c4PersonBorder`, `c4SystemBkg`/`c4SystemBorder`, `c4ContainerBkg`/`c4ContainerBorder`, `c4ComponentBkg`/`c4ComponentBorder`, `c4ExternalBkg`/`c4ExternalBorder`, `c4InfrastructureBkg`/`c4InfrastructureBorder`, `c4BoundaryBorder`) defined in all themes, driving the c4-beta outline element colours (white fill, identity-coloured border and label text) through theme CSS classes instead of hardcoded inline styles. Dark themes get readable lightened/darkened values. Tag style overrides still win over the theme defaults.
