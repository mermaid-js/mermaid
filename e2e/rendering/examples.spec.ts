import { test } from '@playwright/test';
import { imgSnapshotTest } from '../helpers/util.ts';
import { diagramData } from '../../packages/examples/src/index.ts';

test.describe('diagram examples', () => {
  for (const diagram of diagramData) {
    test.describe(diagram.name, () => {
      for (const example of diagram.examples) {
        test(`renders ${example.title}`, async ({ page }, testInfo) => {
          // The e2e viewer injects the diagram code into the page with
          // innerHTML, so a raw `<` (e.g. class annotations like
          // `<<interface>>`) would be parsed as an HTML tag and corrupt the
          // source. Escape it like the handwritten rendering specs do.
          await imgSnapshotTest(page, testInfo, example.code.replace(/</g, '&lt;'), {
            // Example titles can contain characters that are unsafe in
            // screenshot file names (e.g. `/`), so build a sanitized name
            // instead of relying on the test title.
            name: `examples-${diagram.id}-${example.title}`.replace(/\W+/g, '-'),
          });
        });
      }
    });
  }
});
