import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

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

  it('should be forgiving with many spaces before teh end', function () {
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
  it('should error on non-existent shape', function () {
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
       n2["label for n2"] &   n4@{ label: "labe for n4"}   & n5@{ label: "labe for n5"}
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(3);
    expect(data4Layout.nodes[0].label).toEqual('label for n2');
    expect(data4Layout.nodes[1].label).toEqual('labe for n4');
    expect(data4Layout.nodes[2].label).toEqual('labe for n5');
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

  it.skip('should be possible to use @  syntax to add labels with trail spaces', function () {
    const res = flow.parser.parse(
      `flowchart TB
       n2["label for n2"] &   n4@{ label: "labe for n4"}   & n5@{ label: "labe for n5"} `
    );

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(3);
    expect(data4Layout.nodes[0].label).toEqual('label for n2');
    expect(data4Layout.nodes[1].label).toEqual('labe for n4');
    expect(data4Layout.nodes[2].label).toEqual('labe for n5');
  });
});
