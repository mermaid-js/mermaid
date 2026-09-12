---
'mermaid': patch
---

fix: use Unicode-safe base64 encoding for the `data-points` debug attribute in `insertEdge`. Raw `window.btoa` throws `InvalidCharacterError` when the serialized edge points contain characters outside the Latin1 range (e.g. when a browser extension interferes with object serialization in the page), which aborted rendering of the whole diagram.
