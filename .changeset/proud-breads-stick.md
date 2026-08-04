---
'mermaid': patch
---

deprecate: Deprecate the `mermaidAPI.setConfig()` function

Calling this function has no observable effect, as the next time a
`render()` or `parse()` is called, the `currentConfig` is cleared.

commit: 2cd6dcf735533b323507e3e889ffdea870540b43
author: @aloisklink
