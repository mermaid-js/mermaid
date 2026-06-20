import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { cleanupComments } from '../../../diagram-api/comments.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a flow chart', function () {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
  });

  it('should handle a trailing whitespaces after statements', function () {
    const res = flow.parser.parse(cleanupComments('graph TD;\n\n\n %% Comment\n A-->B; \n B-->C;'));

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });

  it('should accept swimlane as a graph keyword', function () {
    flow.parser.parse('swimlane LR;A-->B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flow.parser.yy.getDirection()).toBe('LR');
    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
  });

  it('should parse flowchart node notes without adding layout nodes or edges', function () {
    flow.parser.parse(`flowchart TD
      A[A] --> B[B]

      note right of B
        description:
          Some properties of B
      end note
    `);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.map((node) => node.id)).toEqual(['A', 'B']);
    expect(data4Layout.edges).toHaveLength(1);
    expect(data4Layout.notes).toEqual([
      {
        position: 'right',
        target: 'B',
        text: 'description:\n  Some properties of B',
      },
    ]);
  });

  it('should parse graph node notes in each supported direction', function () {
    const graph = `graph LR
      A[A] --> B[B]
      B --> C[C]

      note left of A
        left note
      end note

      note right of B
        right note
      end note

      note top of B
        top note
      END_NOTE_WITH_SPACES

      note bottom of C
        bottom note
      end note
    `.replace('END_NOTE_WITH_SPACES', 'end note   ');

    flow.parser.parse(graph);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.map((node) => node.id)).toEqual(['A', 'B', 'C']);
    expect(data4Layout.edges).toHaveLength(2);
    expect(data4Layout.notes).toEqual([
      { position: 'left', target: 'A', text: 'left note' },
      { position: 'right', target: 'B', text: 'right note' },
      { position: 'top', target: 'B', text: 'top note' },
      { position: 'bottom', target: 'C', text: 'bottom note' },
    ]);
  });

  it('should continue parsing statements after node notes', function () {
    flow.parser.parse(`flowchart TD
      A[A]
      note right of A
        right note
      end note
      A --> B[B]
    `);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.map((node) => node.id)).toEqual(['A', 'B']);
    expect(data4Layout.edges).toHaveLength(1);
    expect(data4Layout.edges[0].start).toBe('A');
    expect(data4Layout.edges[0].end).toBe('B');
    expect(data4Layout.notes).toEqual([{ position: 'right', target: 'A', text: 'right note' }]);
  });

  it('should parse empty node notes', function () {
    flow.parser.parse(`flowchart TD
      A[A]
      note right of A
      end note
    `);

    expect(flow.parser.yy.getData().notes).toEqual([{ position: 'right', target: 'A', text: '' }]);
  });

  it('should keep regular nodes named note working', function () {
    flow.parser.parse(`flowchart
      note["I am a regular node named note"]
      note --> A[A]
    `);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.map((node) => node.id)).toEqual(['note', 'A']);
    expect(data4Layout.edges).toHaveLength(1);
    expect(data4Layout.edges[0].start).toBe('note');
    expect(data4Layout.edges[0].end).toBe('A');
    expect(data4Layout.notes).toEqual([]);
  });

  it('should keep complex flowchart layout data identical when node notes are removed', function () {
    const parseLayout = (diagram) => {
      flow.parser.yy = new FlowDB();
      flow.parser.yy.clear();
      flow.parser.parse(diagram);
      const data4Layout = flow.parser.yy.getData();

      return {
        direction: flow.parser.yy.getDirection(),
        nodes: data4Layout.nodes.map(({ id, label, shape, isGroup, parentId }) => ({
          id,
          label,
          shape,
          isGroup,
          parentId,
        })),
        edges: data4Layout.edges.map(
          ({ start, end, label, type, arrowTypeStart, arrowTypeEnd }) => ({
            start,
            end,
            label,
            type,
            arrowTypeStart,
            arrowTypeEnd,
          })
        ),
        notes: data4Layout.notes,
      };
    };
    const diagramWithNotes = `flowchart TD
      A[A] -->|Description2: A how to B| B[B]
      B --> D[D]
      B --> C[C]
      D --> F[F]
      C --> F
      F --> H[H]
      F --> G[G]
      F --> K[K]
      H --> M[M]
      G --> M
      K --> M

      note right of A
        Description1: Properties of A
      end note

      note top of A
        above
      end note

      note right of B
        description2:
        Some properties of B
      end note

      note right of K
        Description3:
        This note is right of K
      end note

      note left of F
        Description1: Properties of F
      end note

      note bottom of M
        Description5:This note is below M
      end note
    `;
    const diagramWithoutNotes = `flowchart TD
      A[A] -->|Description2: A how to B| B[B]
      B --> D[D]
      B --> C[C]
      D --> F[F]
      C --> F
      F --> H[H]
      F --> G[G]
      F --> K[K]
      H --> M[M]
      G --> M
      K --> M
    `;
    const withNotes = parseLayout(diagramWithNotes);
    const withoutNotes = parseLayout(diagramWithoutNotes);

    expect(withNotes.nodes).toEqual(withoutNotes.nodes);
    expect(withNotes.edges).toEqual(withoutNotes.edges);
    expect(withNotes.direction).toBe(withoutNotes.direction);
    expect(withNotes.notes).toEqual([
      { position: 'right', target: 'A', text: 'Description1: Properties of A' },
      { position: 'top', target: 'A', text: 'above' },
      { position: 'right', target: 'B', text: 'description2:\nSome properties of B' },
      { position: 'right', target: 'K', text: 'Description3:\nThis note is right of K' },
      { position: 'left', target: 'F', text: 'Description1: Properties of F' },
      { position: 'bottom', target: 'M', text: 'Description5:This note is below M' },
    ]);
  });

  it.each([
    ['flowchart', 'TD', 'TB'],
    ['flowchart', 'TB', 'TB'],
    ['flowchart', 'LR', 'LR'],
    ['flowchart', 'RL', 'RL'],
    ['flowchart', 'BT', 'BT'],
    ['graph', 'TD', 'TB'],
    ['graph', 'TB', 'TB'],
    ['graph', 'LR', 'LR'],
    ['graph', 'RL', 'RL'],
    ['graph', 'BT', 'BT'],
  ])('should parse node notes in %s %s', function (keyword, direction, expectedDirection) {
    flow.parser.parse(`${keyword} ${direction}
      A[A] --> B[B]
      note right of A
        ${keyword} ${direction} note
      end note
    `);

    const data4Layout = flow.parser.yy.getData();

    expect(flow.parser.yy.getDirection()).toBe(expectedDirection);
    expect(data4Layout.nodes.map((node) => node.id)).toEqual(['A', 'B']);
    expect(data4Layout.edges).toHaveLength(1);
    expect(data4Layout.notes).toEqual([
      { position: 'right', target: 'A', text: `${keyword} ${direction} note` },
    ]);
  });

  it('should handle node names with "end" substring', function () {
    const res = flow.parser.parse('graph TD\nendpoint --> sender');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('endpoint').id).toBe('endpoint');
    expect(vert.get('sender').id).toBe('sender');
    expect(edges[0].start).toBe('endpoint');
    expect(edges[0].end).toBe('sender');
  });

  it('should handle node names ending with keywords', function () {
    const res = flow.parser.parse('graph TD\nblend --> monograph');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('blend').id).toBe('blend');
    expect(vert.get('monograph').id).toBe('monograph');
    expect(edges[0].start).toBe('blend');
    expect(edges[0].end).toBe('monograph');
  });

  it('should allow default in the node name/id', function () {
    const res = flow.parser.parse('graph TD\ndefault --> monograph');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('default').id).toBe('default');
    expect(vert.get('monograph').id).toBe('monograph');
    expect(edges[0].start).toBe('default');
    expect(edges[0].end).toBe('monograph');
  });

  describe('special characters should be handled.', function () {
    const charTest = function (char, result) {
      const res = flow.parser.parse('graph TD;A(' + char + ')-->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('A').id).toBe('A');
      expect(vert.get('B').id).toBe('B');
      if (result) {
        expect(vert.get('A').text).toBe(result);
      } else {
        expect(vert.get('A').text).toBe(char);
      }
      flow.parser.yy.clear();
    };

    it("should be able to parse a '.'", function () {
      charTest('.');
      charTest('Start 103a.a1');
    });

    // it('should be able to parse text containing \'_\'', function () {
    //   charTest('_')
    // })

    it("should be able to parse a ':'", function () {
      charTest(':');
    });

    it("should be able to parse a ','", function () {
      charTest(',');
    });

    it("should be able to parse text containing '-'", function () {
      charTest('a-b');
    });

    it("should be able to parse a '+'", function () {
      charTest('+');
    });

    it("should be able to parse a '*'", function () {
      charTest('*');
    });

    it("should be able to parse a '<'", function () {
      charTest('<', '&lt;');
    });

    // it("should be able to parse a '>'", function() {
    //   charTest('>', '&gt;');
    // });

    // it("should be able to parse a '='", function() {
    //   charTest('=', '&equals;');
    // });
    it("should be able to parse a '&'", function () {
      charTest('&');
    });
  });

  it('should be possible to use direction in node ids', function () {
    let statement = '';

    statement = statement + 'graph TD;' + '\n';
    statement = statement + '  node1TB\n';

    const res = flow.parser.parse(statement);
    const vertices = flow.parser.yy.getVertices();
    const classes = flow.parser.yy.getClasses();
    expect(vertices.get('node1TB').id).toBe('node1TB');
  });

  it('should be possible to use direction in node ids', function () {
    let statement = '';

    statement = statement + 'graph TD;A--x|text including URL space|B;';
    const res = flow.parser.parse(statement);
    const vertices = flow.parser.yy.getVertices();
    const classes = flow.parser.yy.getClasses();
    expect(vertices.get('A').id).toBe('A');
  });

  it('should be possible to use numbers as labels', function () {
    let statement = '';

    statement = statement + 'graph TB;subgraph "number as labels";1;end;';
    const res = flow.parser.parse(statement);
    const vertices = flow.parser.yy.getVertices();

    expect(vertices.get('1').id).toBe('1');
  });

  it('should add accTitle and accDescr to flow chart', function () {
    const flowChart = `graph LR
      accTitle: Big decisions
      accDescr: Flow chart of the decision making process
      A[Hard] -->|Text| B(Round)
      B --> C{Decision}
      C -->|One| D[Result 1]
      C -->|Two| E[Result 2]
      `;

    flow.parser.parse(flowChart);
    expect(flow.parser.yy.getAccTitle()).toBe('Big decisions');
    expect(flow.parser.yy.getAccDescription()).toBe('Flow chart of the decision making process');
  });
  it('should add accTitle and a multi line accDescr to flow chart', function () {
    const flowChart = `graph LR
      accTitle: Big decisions

      accDescr {
        Flow chart of the decision making process
        with a second line
      }

      A[Hard] -->|Text| B(Round)
      B --> C{Decision}
      C -->|One| D[Result 1]
      C -->|Two| E[Result 2]
`;

    flow.parser.parse(flowChart);
    expect(flow.parser.yy.getAccTitle()).toBe('Big decisions');
    expect(flow.parser.yy.getAccDescription()).toBe(
      `Flow chart of the decision making process
with a second line`
    );
  });

  for (const unsafeProp of ['__proto__', 'constructor']) {
    it(`should work with node id ${unsafeProp}`, function () {
      const flowChart = `graph LR
      ${unsafeProp} --> A;`;

      expect(() => {
        flow.parser.parse(flowChart);
      }).not.toThrow();
    });

    it(`should work with tooltip id ${unsafeProp}`, function () {
      const flowChart = `graph LR
      click ${unsafeProp} callback "${unsafeProp}";`;

      expect(() => {
        flow.parser.parse(flowChart);
      }).not.toThrow();
    });

    it(`should work with class id ${unsafeProp}`, function () {
      const flowChart = `graph LR
      ${unsafeProp} --> A;
      classDef ${unsafeProp} color:#ffffff,fill:#000000;
      class ${unsafeProp} ${unsafeProp};`;

      expect(() => {
        flow.parser.parse(flowChart);
      }).not.toThrow();
    });

    it(`should work with subgraph id ${unsafeProp}`, function () {
      const flowChart = `graph LR
      ${unsafeProp} --> A;
      subgraph ${unsafeProp}
        C --> D;
      end;`;

      expect(() => {
        flow.parser.parse(flowChart);
      }).not.toThrow();
    });
  }
});
