/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util';

describe('State diagram', () => {
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
