import { test } from '@playwright/test';
import { imgSnapshotTest } from '../helpers/util.ts';

test.describe('Git Graph diagram', () => {
  test('1: should render a simple gitgraph with commit on main branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph
       commit id: "1"
       commit id: "2"
       commit id: "3"
      `,
      {}
    );
  });
  test('Should render subgraphs with title margins and edge labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart LR

          subgraph TOP
              direction TB
              subgraph B1
                  direction RL
                  i1 --lb1-->f1
              end
              subgraph B2
                  direction BT
                  i2 --lb2-->f2
              end
          end
          A --lb3--> TOP --lb4--> B
          B1 --lb5--> B2
        `,
      { flowchart: { subGraphTitleMargin: { top: 10, bottom: 5 } } }
    );
  });
});
