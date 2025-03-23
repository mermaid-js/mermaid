---
'mermaid': minor
---

fix: restore curve type configuration functionality for flowcharts. This fixes the issue where curve type settings were not being applied when configured through any of the following methods:

- Config
- Init directive (%%{ init: { 'flowchart': { 'curve': '...' } } }%%)
- LinkStyle command (linkStyle default interpolate ...)
