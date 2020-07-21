/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util';

describe('Flowchart v2', () => {
  it('1: should render a simple flowchart', () => {
    imgSnapshotTest(
      `flowchart TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      {}
    );
  });

  it('2: should render a simple flowchart with diagramPadding set to 0', () => {
    imgSnapshotTest(
      `flowchart TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      %% this is a comment
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { diagramPadding: 0 } }
    );
  });

    it('3: a link with correct arrowhead to a subgraph', () => {
    imgSnapshotTest(
      `flowchart TD
        P1
        P1 -->P1.5
        subgraph P1.5
          P2
          P2.5(( A ))
          P3
        end
        P2 --> P4
        P3 --> P6
        P1.5 --> P5
      `,
      { flowchart: { diagramPadding: 0 } }
    );
  });
});
