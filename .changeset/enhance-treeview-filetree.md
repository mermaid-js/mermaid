---
'mermaid': minor
'@mermaid-js/parser': minor
---

Enhance treeView-beta with file tree features

Extends the existing treeView-beta diagram with features useful for representing file/directory structures:

- **Bare labels**: Node names no longer require quotes (`src/` instead of `"src/"`)
- **Auto-detected file icons**: 30+ file type icons (TypeScript, Python, Docker, etc.) resolved from filename/extension
- **Icon overrides**: `icon(docker)` syntax to manually specify an icon
- **CSS class annotations**: `:::highlight` syntax for styling individual nodes
- **Descriptions**: `## description text` appended after a node label for additional context
- **Comment support**: `%%` line comments within the tree body
- **Directory detection**: Trailing `/` on a label auto-sets the node type to directory with folder icon
- **New theme variables**: `iconColor` and `descriptionColor` for styling icons and descriptions
