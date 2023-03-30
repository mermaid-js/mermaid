import { imgSnapshotTest } from '../../helpers/util';

describe('Error Diagrams', () => {
  it('should render a simple ER diagram', () => {
    imgSnapshotTest(
      `
      error
      `,
      { logLevel: 1 }
    );
  });

  it('should render error diagram for actual errors', () => {
    imgSnapshotTest(
      `
    flowchart TD
      A[Christmas] --|Get money| B(Go shopping)
      `,
      { logLevel: 1 }
    );
  });

  it('should render error for wrong ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        ATLAS-ORGANIZATION ||--|{ ATLAS-PROJECTS : "has many"
        ATLAS-PROJECTS ||--|{ MONGODB-CLUSTERS : "has many"
        ATLAS-PROJECTS ||--|{ ATLAS-TEAMS : "has many"
        MONGODB-CLUSTERS ||..|{
        ATLAS-TEAMS ||..|{
      `,
      { logLevel: 1 }
    );
  });
});
