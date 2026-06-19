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
  test.describe('iconShape with rect elements (issue #7185)', () => {
    test('should render single AWS icon with rect elements without unintended opacity', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `flowchart TB
          Cloudwatch@{ icon: "aws:arch-amazon-cloudwatch" }
        `,
        {}
      );
    });

    test('should render multiple AWS icons with rect elements in a flowchart', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `flowchart TB
          Cloudwatch@{ icon: "aws:arch-amazon-cloudwatch" }
          Cloudfront@{ icon: "aws:arch-amazon-route-53" }
          Route53@{ icon: "aws:arch-amazon-eks-cloud" }
          Cloudwatch --> Cloudfront
          Cloudfront --> Route53
        `,
        {}
      );
    });

    test('should render AWS icons with labels and rect elements', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `flowchart TB
          Cloudwatch@{ icon: "aws:arch-amazon-cloudwatch", label: "CloudWatch" }
          Route53@{ icon: "aws:arch-amazon-route-53", label: "Route 53" }
          EKS@{ icon: "aws:arch-amazon-eks-cloud", label: "EKS Cloud" }
          Cloudwatch --> Route53
          Route53 --> EKS
        `,
        {}
      );
    });
  });
});
