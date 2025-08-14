import { imgSnapshotTest } from '../../helpers/util';

const looks = ['classic'] as const;

looks.forEach((look) => {
  describe(`SequenceDiagram icon participants in ${look} look`, () => {
    it(`single participant with icon`, () => {
      const diagram = `sequenceDiagram
participant Bob@{ type: "icon", icon: "fa:bell" }
Note over Bob: Icon participant`;
      imgSnapshotTest(diagram, { look });
    });

    it(`two participants, one icon and one normal`, () => {
      const diagram = `sequenceDiagram
participant Bob@{ type: "icon", icon: "fa:bell" }
participant Alice
Bob->>Alice: Hello`;
      imgSnapshotTest(diagram, { look });
    });

    it(`two icon participants`, () => {
      const diagram = `sequenceDiagram
participant Bob@{ type: "icon", icon: "fa:bell" }
participant Alice@{ type: "icon", icon: "fa:user" }
Bob->>Alice: Hello
Alice-->>Bob: Hi`;
      imgSnapshotTest(diagram, { look });
    });

    it(`with markdown htmlLabels:true content`, () => {
      // html/markdown in messages/notes (participants themselves don't support label/form/w/h)
      const diagram = `sequenceDiagram
participant Bob@{ type: "icon", icon: "fa:bell" }
participant Alice
Bob->>Alice: This is **bold** </br>and <strong>strong</strong>
Note over Bob,Alice: Mixed <em>HTML</em> and **markdown**`;
      imgSnapshotTest(diagram, { look });
    });

    it(`with markdown htmlLabels:false content`, () => {
      const diagram = `sequenceDiagram
participant Bob@{ type: "icon", icon: "fa:bell" }
participant Alice
Bob->>Alice: This is **bold** </br>and <strong>strong</strong>`;
      imgSnapshotTest(diagram, {
        look,
        htmlLabels: false,
        flowchart: { htmlLabels: false },
      });
    });

    it(`with styles applied to participant`, () => {
      // style by participant id
      const diagram = `
      sequenceDiagram
        participant Bob@{ type: "icon", icon: "fa:bell" }
        participant Alice
        Bob->>Alice: Styled participant
`;
      imgSnapshotTest(diagram, { look });
    });

    it(`with classDef and class application`, () => {
      const diagram = `
      sequenceDiagram
        participant Bob@{ type: "icon", icon: "fa:bell" }
        participant Alice
        Bob->>Alice: Classed participant
`;
      imgSnapshotTest(diagram, { look });
    });
  });
});

// Colored emoji icon tests (analogous to the flowchart colored icon tests), no direction line.
describe('SequenceDiagram colored icon participant', () => {
  it('colored emoji icon without styles', () => {
    const icon = 'fluent-emoji:tropical-fish';
    const diagram = `
    sequenceDiagram
      participant Bob@{ type: "icon", icon: "${icon}" }
      Note over Bob: colored emoji icon
`;
    imgSnapshotTest(diagram);
  });

  it('colored emoji icon with styles', () => {
    const icon = 'fluent-emoji:tropical-fish';
    const diagram = `
    sequenceDiagram
      participant Bob@{ type: "icon", icon: "${icon}" }
`;
    imgSnapshotTest(diagram);
  });
});

// Mixed scenario: multiple interactions, still no direction line.
describe('SequenceDiagram icon participant with multiple interactions', () => {
  const icon = 'fa:bell-slash';
  it('icon participant interacts with two normal participants', () => {
    const diagram = `sequenceDiagram
participant Bob@{ type: "icon", icon: "${icon}" }
participant Alice
participant Carol
Bob->>Alice: Ping
Alice-->>Bob: Pong
Bob->>Carol: Notify
Note right of Bob: Icon side note`;
    imgSnapshotTest(diagram);
  });
});
