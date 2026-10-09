import type { DiagramMetadata } from '../types.js';

export default {
  id: 'treeView',
  name: 'TreeView',
  description: 'Visualize hierarchical data as a tree structure',
  examples: [
    {
      title: 'Project File Structure',
      isDefault: true,
      code: `treeView-beta
            my-project/
                src/
                    components/
                        Button.tsx
                        Header.tsx
                    App.tsx
                    index.js
                .gitignore
                package.json
                README.md`,
    },
    {
      title: 'Shared Drive with Quoted Names',
      isDefault: false,
      code: `treeView-beta
            "Team Drive"
                "Quarterly Reports"
                    "Q1 Review.pdf"
                    "Q2 Review.pdf"
                "Brand Assets"
                    "logo.svg"
                    "style guide.md"
                "Meeting Notes"`,
    },
    {
      title: 'Annotations',
      isDefault: false,
      code: `---
config:
  treeView:
    showIcons: true
---
treeView-beta
            src/
                App.tsx :::highlight icon(logos:react) ## main component
                index.js ## entry point
                styles.css icon(none)
            data/
                model.bin icon(logos:mysql)
            .env ## environment variables
            Dockerfile
            package.json`,
    },
    {
      title: 'File-Type Icons via Config Maps',
      isDefault: false,
      code: `---
config:
  treeView:
    showIcons: true
    defaultIconPack: material-icon-theme
    filenameIcons:
      Dockerfile: docker
    extensionIcons:
      .ts: typescript
      .tsx: react-ts
      .txt: none
---
treeView-beta
            my-project/
                src/
                    App.tsx
                    utils.ts
                Dockerfile
                notes.txt
                README.md`,
    },
    {
      title: 'Unicode Icons in Filenames',
      isDefault: false,
      code: `treeView-beta
            🚀 rocket-app/
                📦 packages/
                    🎨 ui/
                    🛠️ utils/
                🧪 tests/
                📝 README.md
                ⚙️ config.yaml`,
    },
  ],
} satisfies DiagramMetadata;
