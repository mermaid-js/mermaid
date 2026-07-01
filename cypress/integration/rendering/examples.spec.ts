import { diagramData } from '../../../packages/examples/src/index.ts';
import { imgSnapshotTest } from '../../helpers/util.ts';

describe('diagram examples', () => {
  for (const diagram of diagramData) {
    describe(diagram.name, () => {
      for (const example of diagram.examples) {
        it(`renders ${example.title}`, () => {
          // The e2e viewer injects the diagram code into the page with
          // innerHTML, so a raw `<` (e.g. class annotations like
          // `<<interface>>`) would be parsed as an HTML tag and corrupt the
          // source. Escape it like the handwritten rendering specs do.
          imgSnapshotTest(example.code.replace(/</g, '&lt;'), {
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
