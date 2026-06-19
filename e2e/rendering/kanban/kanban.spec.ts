import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Kanban diagram', () => {
  test('1: should render a kanban with a single section', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id1[Todo]
    docs[Create Documentation]
    docs[Create Blog about the new diagram]
      `,
      {}
    );
  });
  test('2: should render a kanban with multiple sections', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id1[Todo]
    docs[Create Documentation]
  id2
    docs[Create Blog about the new diagram]
      `,
      {}
    );
  });
  test('3: should render a kanban with a single wrapping node', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id1[Todo]
    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]
      `,
      {}
    );
  });
  test('4: should handle the height of a section with a wrapping node at the end', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id1[Todo]
    id2[One line]
    id3[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]
      `,
      {}
    );
  });
  test('5: should handle the height of a section with a wrapping node at the top', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id1[Todo]
    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]
    id3[One line]
      `,
      {}
    );
  });
  test('6: should handle the height of a section with a wrapping node in the middle', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id1[Todo]
    id2[One line]
    id3[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]
    id4[One line]
      `,
      {}
    );
  });
  test('6: should handle assignments', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id1[Todo]
    docs[Create Documentation]
  id2[In progress]
    docs[Create Blog about the new diagram]@{ assigned: 'knsv' }
      `,
      {}
    );
  });
  test('7: should handle prioritization', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id2[In progress]
    vh[Very High]@{ priority: 'Very High' }
    h[High]@{ priority: 'High' }
    m[Default priority]
    l[Low]@{ priority: 'Low' }
    vl[Very Low]@{ priority: 'Very Low' }
      `,
      {}
    );
  });
  test('7: should handle external tickets', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id1[Todo]
    docs[Create Documentation]
  id2[In progress]
    docs[Create Blog about the new diagram]@{ ticket: MC-2037 }
      `,
      {}
    );
  });
  test('8: should handle assignments, prioritization and tickets ids in the same item', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `kanban
  id2[In progress]
    docs[Create Blog about the new diagram]@{ priority: 'Very Low', ticket: MC-2037, assigned: 'knsv' }
      `,
      {}
    );
  });
  test('10: Full example', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
  kanban:
    ticketBaseUrl: 'https://abc123.atlassian.net/browse/#TICKET#'
---
kanban
  id1[Todo]
    docs[Create Documentation]
    docs[Create Blog about the new diagram]
  id7[In progress]
    id6[Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.]
    id8[Design grammar]@{ assigned: 'knsv' }
  id9[Ready for deploy]
  id10[Ready for test]
  id11[Done]
    id5[define getData]
    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}
    id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }
    id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
    id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id12[Can't reproduce]
      `,
      {}
    );
  });
});
