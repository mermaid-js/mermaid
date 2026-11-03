import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { getConfig, setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing directions', function () {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
    flow.parser.yy.setGen('gen-2');
  });

  it('should handle basic shape data statements', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded}`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
  });
  it('should handle basic shape data statements', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded }`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
  });

  it('should handle basic shape data statements with &', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded } & E`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(2);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
    expect(data4Layout.nodes[1].label).toEqual('E');
  });
  it('should handle shape data statements with edges', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded } --> E`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(2);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
    expect(data4Layout.nodes[1].label).toEqual('E');
  });
  it('should handle basic shape data statements with amp and edges 1', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded } & E --> F`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(3);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
    expect(data4Layout.nodes[1].label).toEqual('E');
  });
  it('should handle basic shape data statements with amp and edges 2', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded } & E@{ shape: rounded } --> F`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(3);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
    expect(data4Layout.nodes[1].label).toEqual('E');
  });
  it('should handle basic shape data statements with amp and edges 3', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded } & E@{ shape: rounded } --> F & G@{ shape: rounded }`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(4);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
    expect(data4Layout.nodes[1].label).toEqual('E');
  });
  it('should handle basic shape data statements with amp and edges 4', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded } & E@{ shape: rounded } --> F@{ shape: rounded } & G@{ shape: rounded }`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(4);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
    expect(data4Layout.nodes[1].label).toEqual('E');
  });
  it('should handle basic shape data statements with amp and edges 5, trailing space', function () {
    const res = flow.parser.parse(`flowchart TB
         D@{ shape: rounded } & E@{ shape: rounded } --> F{ shape: rounded } & G{ shape: rounded }    `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(4);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
    expect(data4Layout.nodes[1].label).toEqual('E');
  });
  it('should no matter of there are no leading spaces', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{shape: rounded}`);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
  });

  it('should no matter of there are many leading spaces', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{       shape: rounded}`);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
  });

  it('should be forgiving with many spaces before the end', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded         }`);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
  });
  it('should be possible to add multiple properties on the same line', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded , label: "DD"}`);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('DD');
  });
  it('should be possible to link to a node with more data', function () {
    const res = flow.parser.parse(`flowchart TB
      A --> D@{
        shape: circle
        other: "clock"
     }

      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(2);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('A');
    expect(data4Layout.nodes[1].label).toEqual('D');
    expect(data4Layout.nodes[1].shape).toEqual('circle');

    expect(data4Layout.edges.length).toBe(1);
  });
  it('should not disturb adding multiple nodes after each other', function () {
    const res = flow.parser.parse(`flowchart TB
      A[hello]
      B@{
        shape: circle
        other: "clock"
     }
      C[Hello]@{
        shape: circle
        other: "clock"
     }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(3);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('hello');
    expect(data4Layout.nodes[1].shape).toEqual('circle');
    expect(data4Layout.nodes[1].label).toEqual('B');
    expect(data4Layout.nodes[2].shape).toEqual('circle');
    expect(data4Layout.nodes[2].label).toEqual('Hello');
  });
  it('should use handle bracket end (}) character inside the shape data', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: "This is }"
        other: "clock"
     }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is }');
  });
  it('should error on nonexistent shape', function () {
    expect(() => {
      flow.parser.parse(`flowchart TB
      A@{ shape: this-shape-does-not-exist }
      `);
    }).toThrow('No such shape: this-shape-does-not-exist.');
  });
  it('should error on internal-only shape', function () {
    expect(() => {
      // this shape does exist, but it's only supposed to be for internal/backwards compatibility use
      flow.parser.parse(`flowchart TB
      A@{ shape: rect_left_inv_arrow }
      `);
    }).toThrow('No such shape: rect_left_inv_arrow. Shape names should be lowercase.');
  });
  it('Diamond shapes should work as usual', function () {
    const res = flow.parser.parse(`flowchart TB
      A{This is a label}
`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('diamond');
    expect(data4Layout.nodes[0].label).toEqual('This is a label');
  });
  it('Multi line strings should be supported', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: |
          This is a
          multiline string
        other: "clock"
     }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is a\nmultiline string\n');
  });
  it('Multi line strings should be supported', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: "This is a
          multiline string"
        other: "clock"
     }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is a<br/>multiline string');
  });
  it('should be possible to use } in strings', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: "This is a string with }"
        other: "clock"
     }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is a string with }');
  });
  it('should be possible to use @ in strings', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: "This is a string with @"
        other: "clock"
     }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is a string with @');
  });
  it('should be possible to use @ in strings', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: "This is a string with}"
        other: "clock"
     }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is a string with}');
  });

  it('should be possible to use @  syntax to add labels on multi nodes', function () {
    const res = flow.parser.parse(`flowchart TB
       n2["label for n2"] &   n4@{ label: "label for n4"}   & n5@{ label: "label for n5"}
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(3);
    expect(data4Layout.nodes[0].label).toEqual('label for n2');
    expect(data4Layout.nodes[1].label).toEqual('label for n4');
    expect(data4Layout.nodes[2].label).toEqual('label for n5');
  });

  it('should be possible to use @  syntax to add labels on multi nodes with edge/link', function () {
    const res = flow.parser.parse(`flowchart TD
    A["A"] --> B["for B"] &    C@{ label: "for c"} & E@{label : "for E"}
    D@{label: "for D"}
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(5);
    expect(data4Layout.nodes[0].label).toEqual('A');
    expect(data4Layout.nodes[1].label).toEqual('for B');
    expect(data4Layout.nodes[2].label).toEqual('for c');
    expect(data4Layout.nodes[3].label).toEqual('for E');
    expect(data4Layout.nodes[4].label).toEqual('for D');
  });

  it('should be possible to use @  syntax in labels', function () {
    const res = flow.parser.parse(`flowchart TD
    A["@A@"] --> B["@for@ B@"] & C@{ label: "@for@ c@"} & E{"\`@for@ E@\`"} & D(("@for@ D@"))
      H1{{"@for@ H@"}}
      H2{{"\`@for@ H@\`"}}
      Q1{"@for@ Q@"}
      Q2{"\`@for@ Q@\`"}
      AS1>"@for@ AS@"]
      AS2>"\`@for@ AS@\`"]
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(11);
    expect(data4Layout.nodes[0].label).toEqual('@A@');
    expect(data4Layout.nodes[1].label).toEqual('@for@ B@');
    expect(data4Layout.nodes[2].label).toEqual('@for@ c@');
    expect(data4Layout.nodes[3].label).toEqual('@for@ E@');
    expect(data4Layout.nodes[4].label).toEqual('@for@ D@');
    expect(data4Layout.nodes[5].label).toEqual('@for@ H@');
    expect(data4Layout.nodes[6].label).toEqual('@for@ H@');
    expect(data4Layout.nodes[7].label).toEqual('@for@ Q@');
    expect(data4Layout.nodes[8].label).toEqual('@for@ Q@');
    expect(data4Layout.nodes[9].label).toEqual('@for@ AS@');
    expect(data4Layout.nodes[10].label).toEqual('@for@ AS@');
  });

  it('should handle unique edge creation with using @ and &', function () {
    const res = flow.parser.parse(`flowchart TD
     A & B e1@--> C & D
        A1 e2@--> C1 & D1
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(7);
    expect(data4Layout.edges.length).toBe(6);
    expect(data4Layout.edges[0].id).toEqual('L_A_C_0');
    expect(data4Layout.edges[1].id).toEqual('L_A_D_0');
    expect(data4Layout.edges[2].id).toEqual('e1');
    expect(data4Layout.edges[3].id).toEqual('L_B_D_0');
    expect(data4Layout.edges[4].id).toEqual('e2');
    expect(data4Layout.edges[5].id).toEqual('L_A1_D1_0');
  });

  it('should handle redefine same edge ids again', function () {
    const res = flow.parser.parse(`flowchart TD
     A & B e1@--> C & D
        A1 e1@--> C1 & D1
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(7);
    expect(data4Layout.edges.length).toBe(6);
    expect(data4Layout.edges[0].id).toEqual('L_A_C_0');
    expect(data4Layout.edges[1].id).toEqual('L_A_D_0');
    expect(data4Layout.edges[2].id).toEqual('e1');
    expect(data4Layout.edges[3].id).toEqual('L_B_D_0');
    expect(data4Layout.edges[4].id).toEqual('L_A1_C1_0');
    expect(data4Layout.edges[5].id).toEqual('L_A1_D1_0');
  });

  it('should handle overriding edge animate again', function () {
    const res = flow.parser.parse(`flowchart TD
     A e1@--> B
     C e2@--> D
     E e3@--> F
    e1@{ animate: true }
    e2@{ animate: false }
    e3@{ animate: true }
    e3@{ animate: false }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(6);
    expect(data4Layout.edges.length).toBe(3);
    expect(data4Layout.edges[0].id).toEqual('e1');
    expect(data4Layout.edges[0].animate).toEqual(true);
    expect(data4Layout.edges[1].id).toEqual('e2');
    expect(data4Layout.edges[1].animate).toEqual(false);
    expect(data4Layout.edges[2].id).toEqual('e3');
    expect(data4Layout.edges[2].animate).toEqual(false);
  });

  it('should order edges for the step animation', function () {
    flow.parser.parse(`flowchart LR
     A e1@--> B
     B e2@--> C
     B e3@--> D
     C e4@--> E
    e1@{ step: 1 }
    e2@{ step: 2 }
    e3@{ step: 2 }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.edges.map((edge) => [edge.id, edge.step, edge.stepCount])).toEqual([
      ['e1', 1, 2],
      ['e2', 2, 2],
      ['e3', 2, 2],
      ['e4', undefined, undefined],
    ]);
  });

  it('should give step edges the default step duration', function () {
    flow.parser.parse(`flowchart LR
     A e1@--> B
     B e2@--> C
    e1@{ step: 1 }
      `);

    const [stepped, plain] = flow.parser.yy.getData().edges;
    expect(stepped.stepDuration).toBe(1);
    expect('stepDuration' in plain).toBe(false);
  });

  it('should take the step duration from the flowchart config', function () {
    const previous = getConfig().flowchart?.stepDuration;
    setConfig({ flowchart: { stepDuration: 0.5 } });
    try {
      flow.parser.parse(`flowchart LR
     A e1@--> B
    e1@{ step: 1 }
      `);

      const [edge] = flow.parser.yy.getData().edges;
      expect(edge.stepDuration).toBe(0.5);
    } finally {
      setConfig({ flowchart: { stepDuration: previous } });
    }
  });

  it('should mark step edges for a number badge only when stepNumbers is on', function () {
    const previous = getConfig().flowchart?.stepNumbers;
    setConfig({ flowchart: { stepNumbers: true } });
    try {
      flow.parser.parse(`flowchart LR
     A e1@--> B
     B e2@--> C
    e1@{ step: 1 }
      `);

      const [stepped, plain] = flow.parser.yy.getData().edges;
      expect(stepped.showStepNumber).toBe(true);
      expect('showStepNumber' in plain).toBe(false);
    } finally {
      setConfig({ flowchart: { stepNumbers: previous } });
    }
  });

  it('should leave step edges without a number badge by default', function () {
    flow.parser.parse(`flowchart LR
     A e1@--> B
    e1@{ step: 1 }
      `);

    const [edge] = flow.parser.yy.getData().edges;
    expect('showStepNumber' in edge).toBe(false);
  });

  it('should ignore a step that is not a positive integer', function () {
    flow.parser.parse(`flowchart LR
     A e1@--> B
     B e2@--> C
    e1@{ step: 0 }
    e2@{ step: 1.5 }
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.edges.every((edge) => !('step' in edge) && !('stepCount' in edge))).toBe(
      true
    );
  });

  it('should leave edges without a step free of step data', function () {
    flow.parser.parse(`flowchart LR
     A e1@--> B
    e1@{ animate: true }
      `);

    const [edge] = flow.parser.yy.getData().edges;
    expect('step' in edge).toBe(false);
    expect('stepCount' in edge).toBe(false);
  });

  it.skip('should be possible to use @  syntax to add labels with trail spaces', function () {
    const res = flow.parser.parse(
      `flowchart TB
       n2["label for n2"] &   n4@{ label: "label for n4"}   & n5@{ label: "label for n5"} `
    );

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(3);
    expect(data4Layout.nodes[0].label).toEqual('label for n2');
    expect(data4Layout.nodes[1].label).toEqual('label for n4');
    expect(data4Layout.nodes[2].label).toEqual('label for n5');
  });
});
