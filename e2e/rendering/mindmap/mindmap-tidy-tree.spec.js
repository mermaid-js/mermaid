import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Mindmap Tidy Tree', () => {
  test('1-tidy-tree: should render a simple mindmap without children', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      ` ---
      config:
        layout: tidy-tree
      ---
      mindmap
      root((mindmap))
        A
        B
      `
    );
  });
  test('2-tidy-tree: should render a simple mindmap', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      ` ---
      config:
        layout: tidy-tree
      ---
      mindmap
      root((mindmap is a long thing))
        A
        B
        C
        D
      `
    );
  });
  test('3-tidy-tree: should render a  mindmap with different shapes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      ` ---
      config:
        layout: tidy-tree
      ---
      mindmap
      root((mindmap))
        Origins
          Long history
          ::icon(fa fa-book)
          Popularisation
            British popular psychology author Tony Buzan
        Research
          On effectiveness&lt;br/>and features
          On Automatic creation
            Uses
                Creative techniques
                Strategic planning
                Argument mapping
        Tools
              id)I am a cloud(
                  id))I am a bang((
                    Tools
      `
    );
  });
  test('4-tidy-tree: should render a mindmap with children', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      ` ---
      config:
        layout: tidy-tree
      ---
       mindmap
      ((This is a mindmap))
        child1
         grandchild 1
         grandchild 2
        child2
         grandchild 3
         grandchild 4
        child3
         grandchild 5
         grandchild 6
      `
    );
  });
  test('5-tidy-tree: should keep root edges connected to a rectangular root (issue #7572)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      ` ---
      config:
        layout: tidy-tree
      ---
      mindmap
          A
              B
              C
              D
              E
              F
              G
      `
    );
  });
});
