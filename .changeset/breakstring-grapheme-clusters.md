---
'mermaid': patch
---

fix: where `Intl.Segmenter` is available, wrapLabel no longer hyphenates inside a grapheme cluster, so an emoji keeps its skin tone and a letter keeps its combining mark
