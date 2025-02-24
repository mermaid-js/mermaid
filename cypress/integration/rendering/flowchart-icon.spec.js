import { imgSnapshotTest } from '../../helpers/util.ts';

const themes = ['default', 'forest', 'dark', 'base', 'neutral'];

themes.forEach((theme, index) => {
  describe('Flowchart Icon', () => {
    it(`${index + 1}-icon: verify if icons are working from fontawesome library ${theme} theme`, () => {
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
  });
});

themes.forEach((theme, index) => {
  describe('Flowchart Icon', () => {
    it(`${index + 1}-icon: verify if registered icons are working on ${theme} theme`, () => {
      imgSnapshotTest(
        `flowchart TD
            A("fa:fa-bell Bell") 
        `,
        { theme }
      );
    });
  });
});
