import type { DiagramMetadata } from '../types.js';

export default {
  id: 'treeView',
  name: 'TreeView',
  description: 'Visualize hierarchical data as a tree structure',
  examples: [
    {
      title: 'Basic TreeView',
      isDefault: true,
      code: `treeView-beta
            "docs"
                "build"
                "make.bat"
                "Makefile"
                "out"
                "source"
                    "build"
                    "static"
                        "_templates"
                        "div. Files"`,
    },
    {
      title: 'File Tree with Icons',
      isDefault: false,
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
      title: 'Annotations',
      isDefault: false,
      code: `treeView-beta
            src/
                App.tsx :::highlight icon(react) ## main component
                index.js ## entry point
                styles.css
            data/
                model.bin icon(database)
            .env ## environment variables
            Dockerfile
            package.json`,
    },
  ],
} satisfies DiagramMetadata;
