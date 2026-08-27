---
'mermaid': patch
---

fix(docs): stop `docs:build` deleting the committed `docs/` directory when a later step fails.

`docs:build` ran `rimraf ../../docs` as its first step, before `docs:code` (typedoc) and `docs:spellcheck`. A failure in either left the whole committed `docs/` tree deleted and never regenerated, handing the contributor ~150 staged deletions with no obvious cause — and a pre-commit hook that could not succeed, since `docs:build` is wired to any change under `src/docs/**`.

The deletion is still needed so that pages whose source was removed do not linger, so it now runs immediately before the step that regenerates the directory, after the two steps that can realistically fail.
