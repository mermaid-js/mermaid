import { imgSnapshotTest } from '../../../helpers/util';

describe('TreeView Diagram', () => {
  it('should render a simple treeView diagram with quoted labels', () => {
    imgSnapshotTest(
      `treeView-beta
            "file1.ts"`
    );
  });

  it('should render a complex treeView diagram with quoted labels', () => {
    imgSnapshotTest(
      `treeView-beta
            "root"
                "folder1"
                    "file1.js"
                    "file2.ts"
                "folder2"
                    "file3.spec.ts"
                    "folder3"
                        "file4.ts"
                        "file5.ts"
                        "folder4"
                            "file6.ts"
                "file7.ts"`
    );
  });

  it('should render with multiple roots and quoted labels', () => {
    imgSnapshotTest(
      `treeView-beta
            "folder1"
                "file1.js"
                "file2.ts"
            "folder2"
                "file3.spec.ts"
                "folder3"
                    "file4.ts"
                    "file5.ts"
                    "folder4"
                        "file6.ts"
            "file7.ts"`
    );
  });

  it('should render with custom config and quoted labels', () => {
    imgSnapshotTest(
      `
---
config:
  treeView:
      rowIndent: 80
      lineThickness: 3
  themeVariables:
      treeView:
          labelFontSize: '20px'
          labelColor: '#FF0000'
          lineColor: '#00FF00'
---      
treeView-beta
      "folder1"
          "file1.js"
          "file2.ts"
      "folder2"
          "file3.spec.ts"
          "folder3"
              "file4.ts"
              "file5.ts"
              "folder4"
                  "file6.ts"
      "file7.ts"
    `
    );
  });

  it('should render bare (unquoted) labels with icons', () => {
    imgSnapshotTest(
      `treeView-beta
            my-project/
                src/
                    components/
                        Button.tsx
                        Header.tsx
                    App.tsx
                    index.js
                .gitignore
                package.json
                README.md`
    );
  });

  it('should render :::class annotations for highlighting', () => {
    imgSnapshotTest(
      `treeView-beta
            src/
                components/
                    Button.tsx :::highlight
                    Header.tsx
                App.tsx :::highlight
                index.js
            package.json`
    );
  });

  it('should render ## descriptions', () => {
    imgSnapshotTest(
      `treeView-beta
            src/
                index.js ## app entry point
                config.ts ## runtime configuration
                utils/ ## shared helpers
            package.json ## project manifest
            README.md`
    );
  });

  it('should render icon() overrides', () => {
    imgSnapshotTest(
      `treeView-beta
            data/
                model.bin icon(database)
                weights.h5 icon(database)
            src/
                index.js`
    );
  });

  it('should render combined annotations', () => {
    imgSnapshotTest(
      `treeView-beta
            my-project/
                src/
                    App.tsx :::highlight icon(react) ## main component
                    index.js ## entry point
                    styles.css
                .env ## environment variables
                Dockerfile
                package.json`
    );
  });
});
