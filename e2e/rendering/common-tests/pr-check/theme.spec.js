import { test, expect } from '@playwright/test';
import { imgSnapshotTest } from '../../../helpers/util.ts';

test('themeCSS - should work', async ({ page }, testInfo) => {
  const themeCSS = `.nodeLabel {
          font-variant-caps: petite-caps;
  }`;
  await imgSnapshotTest(page, testInfo, "flowchart TD; A['Hello World']", {
    themeCSS,
  });
  await expect(page.locator('.nodeLabel')).toHaveCSS('font-variant-caps', 'petite-caps');
});

// Security: an unbalanced `}` in themeCSS must not break out of its scope and
// restyle the whole document. The malicious payload lives in the %%{init}%%
// directive, so these stay in TS — a plain .mmd fixture with the directive
// stripped (as the migration produced) renders an unstyled flowchart and tests
// nothing.
test.describe('themeCSS balancing, it', () => {
  test('should not allow unbalanced CSS definitions', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
  %%{init: { 'themeCSS': '} * { background: red }' } }%%
  flowchart TD
    a --> b
          `,
      {}
    );
  });
  test('should not allow unbalanced CSS definitions 2', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
  %%{init: { 'themeCSS': '} * { background: red }' } }%%
  flowchart TD
    a2 --> b2
          `,
      {}
    );
  });
});
