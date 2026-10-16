---
'mermaid': patch
---

fix: parse CSS comments in flowchart `style` and `linkStyle` declarations. A comment only lexed by accident before, so `/*a*/` parsed while `/*a */`, `/*émeraude*/` and `/*a[b]*/` were syntax errors.
