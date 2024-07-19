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
    console.log(data4Layout.nodes);
    expect(data4Layout.nodes.length).toBe(1);
  });
  it('should be possible to link to a node with more data', function () {
    const res = flow.parser.parse(`flowchart TB
      A --> D@{
        shape: circle,
        icon: "clock"
      }@

      `);

    const data4Layout = flow.parser.yy.getData();
    console.log(data4Layout.nodes);
    expect(data4Layout.nodes.length).toBe(2);
  });
  it('should use default direction from top level', function () {
    const res = flow.parser.parse(`flowchart TB
      A[hello]
      B@{
        shape: circle,
        icon: "clock"
      }@
      C[Hello]@{
        shape: circle,
        icon: "clock"
      }@

      `);

    const data4Layout = flow.parser.yy.getData();
    console.log(data4Layout.nodes);
    expect(data4Layout.nodes.length).toBe(3);
  });
  it('should use handle } character inside the shape data', function () {
    const res = flow.parser.parse(`flowchart TB
      A@{
        label: "This is }",
        icon: "clock"
      }@
      `);

    const data4Layout = flow.parser.yy.getData();
    console.log(data4Layout.nodes);
    expect(data4Layout.nodes.length).toBe(1);
  });
});
