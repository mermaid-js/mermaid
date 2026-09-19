import { test } from '@playwright/test';
import { imgSnapshotTest, urlSnapshotTest } from '../helpers/util.ts';

// These precedence tests stay in TS rather than becoming .mmd fixtures: they
// pass site config through imgSnapshotTest's 4th argument (mermaid.initialize())
// and verify that an in-diagram %%{init}%% directive overrides it. The global
// mmd-snapshot runner renders fixtures with no options, so the fixture model
// (frontmatter only, no initialize()) cannot reproduce initialize/frontmatter
// precedence either. The non-precedence cases (No config, Settings from
// frontmatter, …) are pure snapshots and live as fixtures under e2e/diagrams.
test.describe('Configuration and directives - nodes should be light blue', () => {
  test('Settings from initialize overriding themeVariable - nodes should be red', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `

        %%{init: { 'theme': 'base', 'themeVariables':{ 'primaryColor': '#ff0000'}}}%%
graph TD
          A(Start) --> B[/We should/]
          A[/nodes should be red/] --> C[red]
          subgraph section
            B
            C
          end
        `,
      { theme: 'base', themeVariables: { primaryColor: '#ffff00' }, logLevel: 0 }
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
          A[/nodes should be grey/] --> C[End]
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
          A[/nodes should be red/] --> C[End]
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
          A[/nodes should be grey/] --> C[End]
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
          A[/nodes should be red/] --> C[End]
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
          A[/nodes should be red/] --> C[End]
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
          A[/nodes should be red/] --> C[End]
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
          A[/nodes should be red/] --> C[End]
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
