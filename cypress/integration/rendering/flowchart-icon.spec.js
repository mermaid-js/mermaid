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
});
