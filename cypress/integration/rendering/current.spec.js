import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Current diagram', () => {
  it('should render a state with states in it', () => {
    imgSnapshotTest(
      `
      stateDiagram
      state PersonalizedCockpit {
        Other
        state  Parent {
          C
        }
    }
    `,
      {
        logLevel: 0,
      }
    );
  });
});
