import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../../helpers/util.ts';

const testOptions = [
  { description: '', options: { logLevel: 1 } },
  { description: 'ELK: ', options: { logLevel: 1, layout: 'elk' } },
  { description: 'HD: ', options: { logLevel: 1, look: 'handDrawn' } },
];

test.describe('Entity Relationship Diagram Unified', () => {
  testOptions.forEach(({ description, options }) => {
    test(`${description}should render multiple ER diagrams`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        [
          `
      erDiagram
          CUSTOMER ||--o{ ORDER : places
          ORDER ||--|{ LINE-ITEM : contains
        `,
          `
      erDiagram
          CUSTOMER ||--o{ ORDER : places
          ORDER ||--|{ LINE-ITEM : contains
        `,
        ],
        options
      );
    });

    test(`${description}should render a simple ER diagram with a title`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `---
  title: simple ER diagram
  ---
  erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains
  `,
        options
      );
    });
  });
});
