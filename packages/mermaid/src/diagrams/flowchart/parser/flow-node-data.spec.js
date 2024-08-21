import flowDb from '../flowDb.js';
import flow from './flow.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing directions', function () {
  beforeEach(function () {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
    flow.parser.yy.setGen('gen-2');
  });

  it('should handle basic shape data statements', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded }@`);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
  });

  it('should no matter of there are no leading spaces', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{shape: rounded }@`);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
  });

  it('should no matter of there are many leading spaces', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{       shape: rounded }@`);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
  });

  it('should be forgiving with many spaces before teh end', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded          }@`);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('D');
  });
  it('should be possible to add multiple properties on the same line', function () {
    const res = flow.parser.parse(`flowchart TB
      D@{ shape: rounded , label: "DD" }@`);

    const data4Layout = flow.parser.yy.getData();

    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('rounded');
    expect(data4Layout.nodes[0].label).toEqual('DD');
  });
  it('should be possible to link to a node with more data', function () {
    const res = flow.parser.parse(`flowchart TB
      A --> D@{
        shape: circle
        icon: "clock"
      }@

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
        icon: "clock"
      }@
      C[Hello]@{
        shape: circle
        icon: "clock"
      }@
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
        icon: "clock"
      }@
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is }');
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
        icon: "clock"
      }@
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
        icon: "clock"
      }@
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is a<br/>multiline string');
  });
  it(' should be possible to use } in strings', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: "This is a string with }"
        icon: "clock"
      }@
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is a string with }');
  });
  it(' should be possible to use @ in strings', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: "This is a string with @"
        icon: "clock"
      }@
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is a string with @');
  });
  it(' should be possible to use @ in strings', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: "This is a string with }@"
        icon: "clock"
      }@
      `);

    const data4Layout = flow.parser.yy.getData();
    expect(data4Layout.nodes.length).toBe(1);
    expect(data4Layout.nodes[0].shape).toEqual('squareRect');
    expect(data4Layout.nodes[0].label).toEqual('This is a string with }@');
  });
});
