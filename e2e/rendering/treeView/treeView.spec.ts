import { test } from '@playwright/test';

import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('TreeView Diagram', () => {
  test('should render a simple treeView diagram with quoted labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `treeView-beta
            "file1.ts"`
    );
  });

  test('should render a complex treeView diagram with quoted labels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('should render with multiple roots and quoted labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('should render with custom config and quoted labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('should render bare (unquoted) labels with icons', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('should render :::class annotations for highlighting', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('should render ## descriptions', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `treeView-beta
            src/
                index.js ## app entry point
                config.ts ## runtime configuration
                utils/ ## shared helpers
            package.json ## project manifest
            README.md`
    );
  });

  test('should render icon() overrides from registered iconify packs', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `treeView-beta
            data/
                model.bin icon(fa:bell)
                weights.h5 icon(folder)
            src/
                index.js`
    );
  });

  test('should pick file icons from the filenameIcons and extensionIcons config maps', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('should resolve unprefixed icon() overrides via defaultIconPack', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('should render the unknown-icon fallback for unregistered icons', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `treeView-beta
            src/
                index.js icon(unregistered:icon)`
    );
  });

  test('should hide default icons with icon(none) and icon()', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('should preserve consecutive spaces and unicode in labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `treeView-beta
            src/
                But  _  _ton💓.tsx
                index.js`
    );
  });

  test('should render emoji as icons with the default icons hidden', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `treeView-beta
            🚀 rocket-app/
                📦 packages/
                    🎨 ui/
                📝 README.md`
    );
  });

  test('should render combined annotations', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
