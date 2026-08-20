import { test } from '@playwright/test';

import { imgSnapshotTest } from '../../helpers/util.ts';

// These specs feed deliberately-broken input and assert that mermaid renders
// its error diagram (verified by imgSnapshotTest). The page errors mermaid
// raises for invalid syntax are expected; Playwright does not fail a test on
// page errors, so no handler is needed.
test.describe('Error Diagrams', () => {
  test('should render a simple ER diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      error
      `,
      { logLevel: 1, rejectErrorDiagram: false }
    );
  });

  test('should render error diagram for actual errors', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    flowchart TD
      A[Christmas] --|Get money| B(Go shopping)
      `,
      { logLevel: 1, rejectErrorDiagram: false }
    );
  });

  test('should render error for wrong ER diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        ATLAS-ORGANIZATION ||--|{ ATLAS-PROJECTS : "has many"
        ATLAS-PROJECTS ||--|{ MONGODB-CLUSTERS : "has many"
        ATLAS-PROJECTS ||--|{ ATLAS-TEAMS : "has many"
        MONGODB-CLUSTERS ||..|{
        ATLAS-TEAMS ||..|{
      `,
      { logLevel: 1, rejectErrorDiagram: false }
    );
  });
});
