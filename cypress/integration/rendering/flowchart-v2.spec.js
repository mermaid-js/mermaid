/* eslint-env jest */
import { imgSnapshotTest, renderGraph } from '../../helpers/util';

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

  it('4: Length of edges', () => {
    imgSnapshotTest(
      `flowchart TD
      L1 --- L2
      L2 --- C
      M1 ---> C
      R1 .-> R2
      R2 <.-> C
      C -->|Label 1| E1
      C <-- Label 2 ---> E2
      C ----> E3
      C <-...-> E4
      C ======> E5
      `,
      { flowchart: { diagramPadding: 0 } }
    );
  });
  it('5: should render escaped without html labels', () => {
    imgSnapshotTest(
      `flowchart TD
        a["<strong>Haiya</strong>"]---->b
      `,
      {htmlLabels: false, flowchart: {htmlLabels: false}}
    );
  });
  it('6: should render non-escaped with html labels', () => {
    imgSnapshotTest(
      `flowchart TD
        a["<strong>Haiya</strong>"]===>b
      `,
      {htmlLabels: true, flowchart: {htmlLabels: true}, securityLevel: 'loose'}
    );
  });
  it('7: should render a flowchart when useMaxWidth is true (default)', () => {
    renderGraph(
      `flowchart TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { useMaxWidth: true } }
    );
    cy.get('svg')
      .should((svg) => {
        expect(svg).to.have.attr('width', '100%');
        expect(svg).to.have.attr('height');
        // use within because the absolute value can be slightly different depending on the environment ±5%
        const height = parseFloat(svg.attr('height'));
        expect(height).to.be.within(446 * .95, 446 * 1.05);
        const style = svg.attr('style');
        expect(style).to.match(/^max-width: [\d.]+px;$/);
        const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
        expect(maxWidthValue).to.be.within(300 * .95, 300 * 1.05);
      });
  });
  it('8: should render a flowchart when useMaxWidth is false', () => {
    renderGraph(
      `flowchart TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { useMaxWidth: false } }
    );
    cy.get('svg')
      .should((svg) => {
        const height = parseFloat(svg.attr('height'));
        const width = parseFloat(svg.attr('width'));
        // use within because the absolute value can be slightly different depending on the environment ±5%
        expect(height).to.be.within(446 * .95, 446 * 1.05);
        expect(width).to.be.within(300 * .95, 300 * 1.05);
        expect(svg).to.not.have.attr('style');
      });
  });
  it('50: handle nested subgraphs in reverse order', () => {
    imgSnapshotTest(
      `flowchart LR
        a -->b
        subgraph A
        B
        end
        subgraph B
        b
        end
      `,
      {htmlLabels: true, flowchart: {htmlLabels: true}, securityLevel: 'loose'}
    );
  });
  it('51: handle nested subgraphs in reverse order', () => {
    imgSnapshotTest(
      `flowchart LR
        a -->b
        subgraph A
        B
        end
        subgraph B
        b
        end
      `,
      {htmlLabels: true, flowchart: {htmlLabels: true}, securityLevel: 'loose'}
    );
  });
});
