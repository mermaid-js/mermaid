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
      `---
config:
  treeView:
    showIcons: true
---
treeView-beta
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

  it('should render icon() overrides from registered iconify packs', () => {
    imgSnapshotTest(
      `treeView-beta
            data/
                model.bin icon(fa:bell)
                weights.h5 icon(folder)
            src/
                index.js`
    );
  });

  it('should pick file icons from the filenameIcons and extensionIcons config maps', () => {
    imgSnapshotTest(
      `---
config:
  treeView:
    showIcons: true
    defaultIconPack: material-icon-theme
    filenameIcons:
      README.md: 'fa:bell'
    extensionIcons:
      .ts: typescript
      .py: none
      .xyz: javascript
---
treeView-beta
            src/
                main.py
                data.xyz
                index.ts
                unmapped.bin
            README.md`
    );
  });

  it('should resolve unprefixed icon() overrides via defaultIconPack', () => {
    imgSnapshotTest(
      `---
config:
  treeView:
    defaultIconPack: fa
---
treeView-beta
            src/
                alarm.txt icon(bell)
                index.js`
    );
  });

  it('should render the unknown-icon fallback for unregistered icons', () => {
    imgSnapshotTest(
      `treeView-beta
            src/
                index.js icon(unregistered:icon)`
    );
  });

  it('should hide default icons with icon(none) and icon()', () => {
    imgSnapshotTest(
      `---
config:
  treeView:
    showIcons: true
---
treeView-beta
            src/
                index.js icon(none)
                App.tsx icon()
            package.json`
    );
  });

  it('should preserve consecutive spaces and unicode in labels', () => {
    imgSnapshotTest(
      `treeView-beta
            src/
                But  _  _ton💓.tsx
                index.js`
    );
  });

  it('should render emoji as icons with the default icons hidden', () => {
    imgSnapshotTest(
      `treeView-beta
            🚀 rocket-app/
                📦 packages/
                    🎨 ui/
                📝 README.md`
    );
  });

  it('should render combined annotations', () => {
    imgSnapshotTest(
      `treeView-beta
            my-project/
                src/
                    App.tsx :::highlight icon(fa:bell) ## main component
                    index.js ## entry point
                    styles.css
                .env ## environment variables
                Dockerfile
                package.json`
    );
  });
});
