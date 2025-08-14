import { imgSnapshotTest } from '../../helpers/util';

const looks = ['classic'] as const;

looks.forEach((look) => {
  describe(`SequenceDiagram image participants in ${look} look`, () => {
    it(`single participant with image`, () => {
      const diagram = `sequenceDiagram
participant Bob@{ type: "image", "image": "https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg" }
Note over Bob: Image participant`;
      imgSnapshotTest(diagram, { look });
    });

    it(`two participants, one image and one normal`, () => {
      const diagram = `sequenceDiagram
participant Bob@{ type: "image", "image": "https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg" }
participant Alice
Bob->>Alice: Hello`;
      imgSnapshotTest(diagram, { look });
    });

    it(`two image participants`, () => {
      const diagram = `sequenceDiagram
participant Bob@{ type: "image", "image": "https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg" }
participant Alice@{ type: "image", "image": "https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg" }
Bob->>Alice: Hello
Alice-->>Bob: Hi`;
      imgSnapshotTest(diagram, { look });
    });

    it(`with markdown htmlLabels:true content`, () => {
      const diagram = `sequenceDiagram
participant Bob@{ type: "image", "image": "https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg" }
participant Alice
Bob->>Alice: This is **bold** </br>and <strong>strong</strong>
Note over Bob,Alice: Mixed <em>HTML</em> and **markdown**`;
      imgSnapshotTest(diagram, { look });
    });

    it(`with markdown htmlLabels:false content`, () => {
      const diagram = `sequenceDiagram
participant Bob@{ type: "image", "image": "https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg" }
participant Alice
Bob->>Alice: This is **bold** </br>and <strong>strong</strong>`;
      imgSnapshotTest(diagram, {
        look,
        htmlLabels: false,
        flowchart: { htmlLabels: false },
      });
    });

    it(`with styles applied to participant`, () => {
      const diagram = `
      sequenceDiagram
        participant Bob@{ type: "image", "image": "https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg" }
        participant Alice
        Bob->>Alice: Styled participant
`;
      imgSnapshotTest(diagram, { look });
    });

    it(`with classDef and class application`, () => {
      const diagram = `
      sequenceDiagram
        participant Bob@{ type: "image", "image": "https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg" }
        participant Alice
        Bob->>Alice: Classed participant
`;
      imgSnapshotTest(diagram, { look });
    });
  });
});

// Mixed scenario: multiple interactions, still no direction line.
describe('SequenceDiagram image participant with multiple interactions', () => {
  const imageUrl = 'https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg';
  it('image participant interacts with two normal participants', () => {
    const diagram = `sequenceDiagram
participant Bob@{ type: "image", "image": "${imageUrl}" }
participant Alice
participant Carol
Bob->>Alice: Ping
Alice-->>Bob: Pong
Bob->>Carol: Notify
Note right of Bob: Image side note`;
    imgSnapshotTest(diagram);
  });
});
