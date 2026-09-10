---
'mermaid': patch
---

fix(block): stop block rendering from crashing when DOM nodes carry own enumerable properties

Rendering a `block` diagram threw inside `mermaid.render()` in any environment that hangs its own
enumerable properties off DOM elements — React attaches `__reactFiber$…` and `__reactProps$…`, so the
crash showed up as `Converting circular structure to JSON`, `Do not know how to serialize a BigInt`
or `Maximum call stack size exceeded` depending on what the fiber graph held.

Sizing a block stored the measured element on `block.size.node`, putting a live DOM reference inside
the model (and retaining the node after it was removed from the document). The layout step then
serialized that tree eagerly for a debug log, on every render, regardless of log level — so anything
in it that JSON cannot represent turned a render into a thrown error. The element is no longer kept
after it has been measured, and the tree is passed to the logger instead of being pre-serialized.
