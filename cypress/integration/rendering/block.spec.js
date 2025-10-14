import { imgSnapshotTest } from '../../helpers/util';
/* eslint-disable no-useless-escape */
describe('Block diagram', () => {
  it('BL1: should calculate the block widths', () => {
    imgSnapshotTest(
      `block-beta
  columns 2
  block
    id2["I am a wide one"]
    id1
  end
  id["Next row"]
      `
    );
  });

  it('BL2: should handle columns statement in sub-blocks', () => {
    imgSnapshotTest(
      `block
  id1["Hello"]
  block
    columns 3
    id2["to"]
    id3["the"]
    id4["World"]
    id5["World"]
  end
      `,
      {}
    );
  });

  it('BL3: should align block widths and handle columns statement in sub-blocks', () => {
    imgSnapshotTest(
      `block
  block
    columns 1
    id1
    id2
    id2.1
  end
  id3
  id4
      `,
      {}
    );
  });

  it('BL4: should align block widths and handle columns statements in deeper sub-blocks then 1 level', () => {
    imgSnapshotTest(
      `block
  columns 1
  block
    columns 1
    block
      columns 3
      id1
      id2
      id2.1(("XYZ"))
    end
    id48
  end
  id3
      `,
      {}
    );
  });

  it('BL5: should align block widths and handle columns statements in deeper sub-blocks then 1 level (alt)', () => {
    imgSnapshotTest(
      `block
  columns 1
  block
    id1
    id2
    block
      columns 1
      id3("Wider then")
      id5(("id5"))
    end
  end
  id4
      `,
      {}
    );
  });

  it('BL6: should handle block arrows and spece statements', () => {
    imgSnapshotTest(
      `block
    columns 3
    space:3
    ida idb idc
    id1  id2
      blockArrowId<["Label"]>(right)
      blockArrowId2<["Label"]>(left)
      blockArrowId3<["Label"]>(up)
      blockArrowId4<["Label"]>(down)
      blockArrowId5<["Label"]>(x)
      blockArrowId6<["Label"]>(y)
      blockArrowId6<["Label"]>(x, down)
      `,
      {}
    );
  });

  it('BL7: should handle different types of edges', () => {
    imgSnapshotTest(
      `block
      columns 3
      A space:5
      A --o B
      A --> C
      A --x D
      `,
      {}
    );
  });

  it('BL8: should handle sub-blocks without columns statements', () => {
    imgSnapshotTest(
      `block
      columns 2
      C A B
      block
        D
        E
      end
      `,
      {}
    );
  });

  it('BL9: should handle edges from blocks in sub blocks to other blocks', () => {
    imgSnapshotTest(
      `block
      columns 3
      B space
      block
        D
      end
      D --> B
      `,
      {}
    );
  });

  it('BL10: should handle edges from composite blocks', () => {
    imgSnapshotTest(
      `block
      columns 3
      B space
      block BL
        D
      end
      BL --> B
      `,
      {}
    );
  });

  it('BL11: should handle edges to composite blocks', () => {
    imgSnapshotTest(
      `block
      columns 3
      B space
      block BL
        D
      end
      B --> BL
      `,
      {}
    );
  });

  it('BL12: edges should handle labels', () => {
    imgSnapshotTest(
      `block
      A
      space
      A -- "apa" --> E
      `,
      {}
    );
  });

  it('BL13: should handle block arrows in different directions', () => {
    imgSnapshotTest(
      `block
      columns 3
      space blockArrowId1<["down"]>(down) space
      blockArrowId2<["right"]>(right) blockArrowId3<["Sync"]>(x, y) blockArrowId4<["left"]>(left)
      space blockArrowId5<["up"]>(up) space
      blockArrowId6<["x"]>(x) space blockArrowId7<["y"]>(y)
      `,
      {}
    );
  });

  it('BL14: should style statements and class statements', () => {
    imgSnapshotTest(
      `block
    A
    B
    classDef blue fill:#66f,stroke:#333,stroke-width:2px;
    class A blue
    style B fill:#f9F,stroke:#333,stroke-width:4px
      `,
      {}
    );
  });

  it('BL15: width alignment - D and E should share available space', () => {
    imgSnapshotTest(
      `block
  block
    D
    E
  end
  db("This is the text in the box")
      `,
      {}
    );
  });

  it('BL16: width alignment - C should be as wide as the composite block', () => {
    imgSnapshotTest(
      `block
  block
    A("This is the text")
    B
  end
  C
      `,
      {}
    );
  });

  it('BL17: width alignment - blocks should be equal in width', () => {
    imgSnapshotTest(
      `block
    A("This is the text")
    B
    C
      `,
      {}
    );
  });

  it('BL18: block types 1 - square, rounded and circle', () => {
    imgSnapshotTest(
      `block
    A["square"]
    B("rounded")
    C(("circle"))
      `,
      {}
    );
  });

  it('BL19: block types 2 - odd, diamond and hexagon', () => {
    imgSnapshotTest(
      `block
    A>"rect_left_inv_arrow"]
    B{"diamond"}
    C{{"hexagon"}}
      `,
      {}
    );
  });

  it('BL20: block types 3 - stadium', () => {
    imgSnapshotTest(
      `block
    A(["stadium"])
      `,
      {}
    );
  });

  it('BL21: block types 4 - lean right, lean left, trapezoid and inv trapezoid', () => {
    imgSnapshotTest(
      `block
    A[/"lean right"/]
    B[\"lean left"\]
    C[/"trapezoid"\]
    D[\"trapezoid alt"/]
      `,
      {}
    );
  });

  it('BL22: block types 1 - square, rounded and circle', () => {
    imgSnapshotTest(
      `block
    A["square"]
    B("rounded")
    C(("circle"))
      `,
      {}
    );
  });

  it('BL23: sizing - it should be possible to make a block wider', () => {
    imgSnapshotTest(
      `block
      A("rounded"):2
      B:2
      C
      `,
      {}
    );
  });

  it('BL24: sizing - it should be possible to make a composite block wider', () => {
    imgSnapshotTest(
      `block
      block:2
        A
      end
      B
      `,
      {}
    );
  });

  it('BL25: block in the middle with space on each side', () => {
    imgSnapshotTest(
      `block
        columns 3
        space
        middle["In the middle"]
        space
      `,
      {}
    );
  });
  it('BL26: space and an edge', () => {
    imgSnapshotTest(
      `block
  columns 5
    A space B
    A --x B
      `,
      {}
    );
  });
  it('BL27: block sizes for regular blocks', () => {
    imgSnapshotTest(
      `block
  columns 3
    a["A wide one"] b:2 c:2 d
      `,
      {}
    );
  });
  it('BL28: composite block with a set width - f should use the available space', () => {
    imgSnapshotTest(
      `block
  columns 3
  a:3
  block:e:3
      f
  end
  g
  `,
      {}
    );
  });

  it('BL29: composite block with a set width - f and g should split the available space', () => {
    imgSnapshotTest(
      `block
  columns 3
  a:3
  block:e:3
      f
      g
  end
  h
  i
  j
  `,
      {}
    );
  });

  it('BL30: block should overflow if too wide for columns', () => {
    imgSnapshotTest(
      `block-beta
  columns 2
  fit:2
  overflow:3
  short:1
  also_overflow:2
`,
      {}
    );
  });

  it('BL31: edge without arrow syntax should render with no arrowheads', () => {
    imgSnapshotTest(
      `block-beta
  a
  b
  a --- b
`,
      {}
    );
  });

  it('BL32: WSL node width should be 2', () => {
    imgSnapshotTest(
      `block-beta
  columns 3
  block:group1:2
    columns 2
    DB[("db")]:1
    dev{{"I am developing here"}}:1
    docker1["Docker"]:1
    docker2["Docker"]:1
    WSL:2
  end
  VSCode:1

  OS["Windows11"]:3
  
VSCode-->dev

`,
      {}
    );
  });
});
