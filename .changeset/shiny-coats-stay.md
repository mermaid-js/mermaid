---
'@mermaid-js/parser': major
---

chore: upgrade to Langium v4

Upgrade `@mermaid-js/parser` to use Langium v4,
see https://github.com/eclipse-langium/langium/releases/tag/v4.0.0
for more details.

The major breaking changes that impact consumers of this package are:

- Due to various type-related changes, `langium` now requires version `>= 5.8.0`
  of TypeScript.
- The generated type names from `ast.ts` have been moved from `<typeName>` to
  `<typeName>.$type`
  ([langium#1942](https://github.com/eclipse-langium/langium/pull/1942)).

This also removes a transitive dependency on lodash versions that are vulnerable
to CVE-2025-13465, although
[chevrotain doesn't use the affected functions](https://github.com/Chevrotain/chevrotain/blob/21f20cd9754f8d5e85243fd9286d1fff397363ab/packages/website/docs/changes/CHANGELOG.md?plain=1#L5-L8),
so this is only to silence security scanners.
