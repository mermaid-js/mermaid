/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util';

describe('State diagram', () => {
  it('should render a flowchart full of circles', () => {
    imgSnapshotTest(
      `
    stateDiagram
    State1: The state with a note
    note right of State1
      Important information! You\ncan write
      notes with multiple lines...
      Here is another line...
      And another line...
    end note
    `,
      {}
    );
  });
});
