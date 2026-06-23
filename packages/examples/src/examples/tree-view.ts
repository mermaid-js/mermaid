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
