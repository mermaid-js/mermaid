import { expect, test } from '@playwright/test';

import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';
/* eslint-disable no-useless-escape */
test.describe('Block diagram', () => {
  test('BL1: should calculate the block widths', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL2: should handle columns statement in sub-blocks', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL3: should align block widths and handle columns statement in sub-blocks', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL4: should align block widths and handle columns statements in deeper sub-blocks then 1 level', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL5: should align block widths and handle columns statements in deeper sub-blocks then 1 level (alt)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL6: should handle block arrows and spece statements', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL7: should handle different types of edges', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL8: should handle sub-blocks without columns statements', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL9: should handle edges from blocks in sub blocks to other blocks', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL10: should handle edges from composite blocks', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL11: should handle edges to composite blocks', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL12: edges should handle labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
      A
      space
      A -- "apa" --> E
      `,
      {}
    );
  });

  test('BL13: should handle block arrows in different directions', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL14: should style statements and class statements', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
    A["My text here"]
    B
    classDef blue fill:#66f,stroke:#333,stroke-width:2px,color:#ff6;
    class A blue
    style B fill:#f9F,stroke:#333,stroke-width:4px
      `,
      {}
    );
  });

  test('BL15: width alignment - D and E should share available space', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL16: width alignment - C should be as wide as the composite block', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL17: width alignment - blocks should be equal in width', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
    A("This is the text")
    B
    C
      `,
      {}
    );
  });

  test('BL18: block types 1 - square, rounded and circle', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
    A["square"]
    B("rounded")
    C(("circle"))
      `,
      {}
    );
  });

  test('BL19: block types 2 - odd, diamond and hexagon', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
    A>"rect_left_inv_arrow"]
    B{"diamond"}
    C{{"hexagon"}}
      `,
      {}
    );
  });

  test('BL20: block types 3 - stadium', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
    A(["stadium"])
      `,
      {}
    );
  });

  test('BL21: block types 4 - lean right, lean left, trapezoid and inv trapezoid', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
    A[/"lean right"/]
    B[\"lean left"\]
    C[/"trapezoid"\]
    D[\"trapezoid alt"/]
      `,
      {}
    );
  });

  test('BL22: block types 1 - square, rounded and circle', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
    A["square"]
    B("rounded")
    C(("circle"))
      `,
      {}
    );
  });

  test('BL23: sizing - it should be possible to make a block wider', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
      A("rounded"):2
      B:2
      C
      `,
      {}
    );
  });

  test('BL24: sizing - it should be possible to make a composite block wider', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
      block:2
        A
      end
      B
      `,
      {}
    );
  });

  test('BL25: block in the middle with space on each side', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
        columns 3
        space
        middle["In the middle"]
        space
      `,
      {}
    );
  });
  test('BL26: space and an edge', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
  columns 5
    A space B
    A --x B
      `,
      {}
    );
  });
  test('BL27: block sizes for regular blocks', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
  columns 3
    a["A wide one"] b:2 c:2 d
      `,
      {}
    );
  });
  test('BL28: composite block with a set width - f should use the available space', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL29: composite block with a set width - f and g should split the available space', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL30: block should overflow if too wide for columns', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test('BL31: edge without arrow syntax should render with no arrowheads', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block-beta
  a
  b
  a --- b
`,
      {}
    );
  });

  test('BL32: nested blocks spanning columns should not overlap (issue #5706)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block-beta
    columns 4

    block:0_0:4
        columns 6
            Example:2
        space:2
        ExampleOther:2
        ExampleOther:1
        block:0_0_0:6
            a b c d e f g h
        end
    end
`,
      {}
    );
  });

  test('BL33: rows with different heights should not overlap', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block
  columns 3
  a:3
  block:group1:2
    columns 2
    h i j k
  end
  g
  block:group2:3
    l m n o p q r
  end
`,
      {}
    );
  });

  test('BL34: hexagon shape block should span correctly', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block-beta
columns 3
  A1{{"Opening tag"}} space A3{{"Closing tag"}}
  B1["&lt;tagname&gt;"] B2["content"] B3["&lt;/tagname&gt;"]
  C{{"Element"}}:3
`,
      {}
    );
  });

  test('BL35: block arrow should span multiple columns when widthInColumns is set', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block-beta
columns 10

  arrow<["span 10"]>(x):10
  A
  B
  C
  D
  E
  F
  G
  H
  I
  J
  `,
      {}
    );
  });

  test('BL36: mixed column spans should not shrink column widths (issue #7503)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block-beta
    columns 5
    PA["Paid proceeds (actual) $613"]:1 DEF["Deficit $5,155"]:4
    CA["Cash back (actual) $128"]:1 SPO["Spoilage (35 unsold) $5,640"]:4
`,
      {}
    );
  });

  test('BL37: should render all arrow types in 9 columns grid', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `block-beta
      columns 9
      A space B
      C space D
      E space F
      G space H
      I space J
      K space L
      M space N
      O space P
      Q space R
      A --- B
      C --> D
      E <--> F
      G === H
      I ==> J
      K <==> L
      M -.- N
      O -.-> P
      Q <-.-> R
    `
    );
  });

  test('BL38: should not let a sibling with a much wider label overflow into its neighbors', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `block-beta
  block:ID
    A
    B["This label is intentionally very wide so that it clearly exceeds the two hundred pixel default wrap threshold"]
    C
  end`,
      { screenshot: false }
    );

    const ranges = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      return ['A', 'B', 'C'].map((id) => {
        const g = svg.querySelector(`[id$="-${id}"]`);
        const rect = g.querySelector('rect');
        const transform = g.getAttribute('transform');
        const tx = parseFloat(/translate\(([\d.-]+)/.exec(transform)[1]);
        const x = parseFloat(rect.getAttribute('x'));
        const width = parseFloat(rect.getAttribute('width'));
        return { id, left: tx + x, right: tx + x + width };
      });
    });

    const sorted = [...ranges].sort((a, b) => a.left - b.left);
    for (let i = 1; i < sorted.length; i++) {
      expect(
        sorted[i].left,
        `${sorted[i - 1].id} [${sorted[i - 1].left}, ${sorted[i - 1].right}] should not overlap ${sorted[i].id} [${sorted[i].left}, ${sorted[i].right}]`
      ).toBeGreaterThanOrEqual(sorted[i - 1].right);
    }
  });
});
