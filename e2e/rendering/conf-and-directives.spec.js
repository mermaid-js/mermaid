import { test } from '@playwright/test';
import { imgSnapshotTest, urlSnapshotTest } from '../helpers/util.ts';

test.describe('Configuration and directives - nodes should be light blue', () => {
  test('No config - use default', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      graph TD
          A(Default) --> B[/Another/]
          A --> C[End]
          subgraph section
            B
            C
          end
        `,
      {}
    );
  });
  test('Settings from initialize - nodes should be green', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
graph TD
          A(Forest) --> B[/Another/]
          A --> C[End]
          subgraph section
            B
            C
          end          `,
      { theme: 'forest' }
    );
  });
  test('Settings from initialize overriding themeVariable - nodes should be red', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `

        %%{init: { 'theme': 'base', 'themeVariables':{ 'primaryColor': '#ff0000'}}}%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { theme: 'base', themeVariables: { primaryColor: '#ff0000' }, logLevel: 0 }
    );
  });
  test('Settings from directive - nodes should be grey', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
        %%{init: { 'logLevel': 0, 'theme': 'neutral'} }%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      {}
    );
  });
  test('Settings from frontmatter - nodes should be grey', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
---
config:
  theme: neutral
---
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      {}
    );
  });

  test('Settings from directive overriding theme variable - nodes should be red', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
          %%{init: {'theme': 'base', 'themeVariables':{ 'primaryColor': '#ff0000'}}}%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      {}
    );
  });
  test('Settings from initialize and directive - nodes should be grey', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      %%{init: { 'logLevel': 0, 'theme': 'neutral'} }%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { theme: 'forest' }
    );
  });
  test('Theme from initialize, directive overriding theme variable - nodes should be red', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      %%{init: {'theme': 'base', 'themeVariables':{ 'primaryColor': '#ff0000'}}}%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { theme: 'base' }
    );
  });
  test('Theme from initialize, frontmatter overriding theme variable - nodes should be red', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
---
config:
  theme: base
  themeVariables:
    primaryColor: '#ff0000'
---
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { theme: 'forest' }
    );
  });
  test('Theme from initialize, frontmatter overriding theme variable, directive overriding primaryColor - nodes should be red', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
---
config:
  theme: base
  themeVariables:
    primaryColor: '#00ff00'
---
%%{init: {'theme': 'base', 'themeVariables':{ 'primaryColor': '#ff0000'}}}%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { theme: 'forest' }
    );
  });

  test('should render if values are not quoted properly', async ({ page }, testInfo) => {
    // #ff0000 is not quoted properly, and will evaluate to null.
    // This test ensures that the rendering still works.
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
  theme: base
  themeVariables:
    primaryColor: #ff0000
---
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { theme: 'forest' }
    );
  });

  test('Theme variable from initialize, theme from directive - nodes should be red', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      %%{init: { 'logLevel': 0, 'theme': 'base'} }%%
graph TD
          A(Start) --> B[/Another/]
          A[/Another/] --> C[End]
          subgraph section
            B
            C
          end
        `,
      { themeVariables: { primaryColor: '#ff0000' } }
    );
  });
  test.describe('when rendering several diagrams', () => {
    test('diagrams should not taint later diagrams', async ({ page }, testInfo) => {
      const url = '/theme-directives.html';
      await urlSnapshotTest(page, testInfo, url, {});
    });
  });
});
