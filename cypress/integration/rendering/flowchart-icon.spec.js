import { imgSnapshotTest } from '../../helpers/util.ts';

const themes = ['default', 'forest', 'dark', 'base', 'neutral'];

describe('when rendering flowchart with icons', () => {
  for (const theme of themes) {
    it(`should render icons from fontawesome library on theme ${theme}`, () => {
      imgSnapshotTest(
        `flowchart TD
            A("fab:fa-twitter Twitter") --> B("fab:fa-facebook Facebook")
            B --> C("fa:fa-coffee Coffee")
            C --> D("fa:fa-car Car")
            D --> E("fab:fa-github GitHub")
        `,
        { theme }
      );
    });

    it(`should render registered icons on theme ${theme}`, () => {
      imgSnapshotTest(
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
  describe('iconShape with rect elements (issue #7185)', () => {
    it('should render single AWS icon with rect elements without unintended opacity', () => {
      imgSnapshotTest(
        `flowchart TB
          Cloudwatch@{ icon: "aws:arch-amazon-cloudwatch" }
        `,
        {}
      );
    });

    it('should render multiple AWS icons with rect elements in a flowchart', () => {
      imgSnapshotTest(
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

    it('should render AWS icons with labels and rect elements', () => {
      imgSnapshotTest(
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
