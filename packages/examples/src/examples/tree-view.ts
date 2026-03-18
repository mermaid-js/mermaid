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
  ],
} satisfies DiagramMetadata;
