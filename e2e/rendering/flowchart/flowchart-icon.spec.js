import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

const themes = ['default', 'forest', 'dark', 'base', 'neutral'];

test.describe('when rendering flowchart with icons', () => {
  for (const theme of themes) {
    test(`should render icons from fontawesome library on theme ${theme}`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `flowchart TD
            A("fab:fa-twitter Twitter") --> B("fab:fa-facebook Facebook")
            B --> C("fa:fa-coffee Coffee")
            C --> D("fa:fa-car Car")
            D --> E("fab:fa-github GitHub")
        `,
        { theme }
      );
    });

    test(`should render registered icons on theme ${theme}`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `flowchart TD
            A("fa:fa-bell Bell")
        `,
        { theme }
      );
    });
  }

  /**
   * Test for GitHub issue #7185
   * SVG Logos have unintended opacity being applied when they use rect elements
   *
   */
});
