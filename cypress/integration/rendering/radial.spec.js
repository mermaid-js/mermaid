import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const testOptions = [
  { description: '', options: { logLevel: 1 } },
  { description: 'HD: ', options: { logLevel: 1, look: 'handDrawn' } },
];

describe('Radial Layout', () => {
  testOptions.forEach(({ description, options }) => {
    it(`${description}should render a simple radial layout`, () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'default', 'layout': 'radial'}}%%
        flowchart TD
          A[Root Node] --> B[Layer 1 Node A]
          A --> C[Layer 1 Node C]
          A --> D[Layer 1 Node D]
        `,
        options
      );
    });

    it(`${description}should render a complex radial layout with multiple levels`, () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'default', 'layout': 'radial'}}%%
        flowchart TD
          A[Root Node] --> B[Layer 1 Node A]
          A --> C[Layer 1 Node C]
          A --> D[Layer 1 Node D]
          B --> E[Layer 2 Node E]
          B --> F[Layer 2 Node F]
          C --> G[Layer 2 Node G]
          C --> H[Layer 2 Node H]
          D --> I[Layer 2 Node I]
          D --> J[Layer 2 Node J]
        `,
        options
      );
    });

    it(`${description}should render a radial layout with styled nodes and edges`, () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'default', 'layout': 'radial'}}%%
        flowchart TD
          A[Root Node] --> B[Layer 1 Node A]
          A ---> C[Layer 1 Node C]
          A ==> D[Layer 1 Node D]
          B -.-> E[Layer 2 Node E]
          B --> F[Layer 2 Node F]
          
          classDef root fill:#f96,stroke:#333,stroke-width:2px;
          classDef level1 fill:#bbf,stroke:#33f,stroke-width:1px;
          classDef level2 fill:#fbb,stroke:#f33,stroke-width:1px;
          
          class A root;
          class B,C,D level1;
          class E,F level2;
        `,
        options
      );
    });

    it(`${description}should render a radial layout with node shapes`, () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'default', 'layout': 'radial'}}%%
        flowchart TD
          A((Root)) --> B[Square]
          A --> C(Round)
          A --> D>Flag]
          B --> E{Diamond}
          B --> F[[Database]]
          C --> G[[/Trapezoid/]]
          C --> H[/Trapezoid\\]
          D --> I[/Parallelogram/]
          D --> J[\\Parallelogram\\]
        `,
        options
      );
    });

    it(`${description}should handle a radial layout with subgraphs`, () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'default', 'layout': 'radial'}}%%
        flowchart TD
          A[Root Node] --> B[Layer 1 Node B]
          A --> C[Layer 1 Node C]
          
          subgraph GroupB
            B --> D[Layer 2 Node D]
            B --> E[Layer 2 Node E]
          end
          
          subgraph GroupC
            C --> F[Layer 2 Node F]
            C --> G[Layer 2 Node G]
          end
        `,
        options
      );
    });

    it(`${description}should handle nested subgraphs in radial layout`, () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'default', 'layout': 'radial'}}%%
        flowchart TD
          R[Root Outer]
          subgraph S1[Level 1 Subgraph]
            S1_N1[L1 Node1]
            S1_N2[L1 Node2]
            subgraph S2[Level 2 Subgraph]
              S2_N1[L2 Node1]
              S2_N2[L2 Node2]
              S2_N1 --> S2_N2
            end
            S1_N1 --> S2_N1
            S1_N2 --> S2_N2
          end
          R --> S1_N1
          R --> S1
        `,
        options
      );
    });

    it(`${description}should handle empty subgraph in radial layout`, () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'default', 'layout': 'radial'}}%%
        flowchart TD
          subgraph EMPTY_SUB[Empty Subgraph Title]
          end
          X[Outside] --> EMPTY_SUB
        `,
        options
      );
    });

    it(`${description}should handle sibling subgraphs with cross-edges in radial layout`, () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'default', 'layout': 'radial'}}%%
        flowchart TD
          TOP[Main Top]
          subgraph SIB_A[Sibling A]
            A1[Node A1]
            A2[Node A2]
            A1 --> A2
          end
          subgraph SIB_B[Sibling B]
            B1[Node B1]
            B2[Node B2]
            B1 --> B2
          end
          TOP --> A1
          TOP --> B1
          A2 --> B1
          B2 --> A1
        `,
        options
      );
    });

    it(`${description}should render a radial tech stack diagram`, () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'default', 'layout': 'radial'}}%%
        flowchart TD
          APP[Application] --> FE[Frontend]
          APP --> BE[Backend]
          APP --> DB[Database]
          APP --> INFRA[Infrastructure]
          FE --> REACT[React]
          FE --> REDUX[Redux]
          BE --> NODE[Node.js]
          BE --> EXPRESS[Express]
          DB --> MONGO[MongoDB]
          INFRA --> DOCKER[Docker]
          INFRA --> AWS[AWS]
        `,
        options
      );
    });
  });
});
