import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph, verifyNumber } from '../../helpers/util.ts';

test.describe('Flowchart ELK', () => {
  test('1-elk: should render a simple flowchart', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      {}
    );
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { defaultRenderer: 'elk' } }
    );
  });

  test('2-elk: should render a simple flowchart with diagramPadding set to 0', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      %% this is a comment
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { diagramPadding: 0 } }
    );
  });

  test('3-elk: a link with correct arrowhead to a subgraph', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TD
        P1
        P1 -->P1.5
        subgraph P1.5
          P2
          P2.5(( A ))
          P3
        end
        P2 --> P4
        P3 --> P6
        P1.5 --> P5
      `,
      {}
    );
  });

  test('4-elk: Length of edges', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TD
      L1 --- L2
      L2 --- C
      M1 ---> C
      R1 .-> R2
      R2 <.-> C
      C -->|Label 1| E1
      C <-- Label 2 ---> E2
      C ----> E3
      C <-...-> E4
      C ======> E5
      `,
      {}
    );
  });
  test('5-elk: should render escaped without html labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TD
        a["<strong>Haiya</strong>"]---->b
      `,
      { htmlLabels: false, flowchart: { htmlLabels: false } }
    );
  });
  test('6-elk: should render non-escaped with html labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TD
        a["<strong>Haiya</strong>"]===>b
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('7-elk: should render a flowchart when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart-elk TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    verifyNumber(maxWidthValue, 380, 15);
  });
  test('8-elk: should render a flowchart when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart-elk TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    verifyNumber(width, 380, 15);
    await expect(svg).not.toHaveAttribute('style');
  });

  test('V2 elk - 16: Render Stadium shape', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      ` flowchart-elk TD
      A([stadium shape test])
      A -->|Get money| B([Go shopping])
      B --> C([Let me think...<br />Do I want something for work,<br />something to spend every free second with,<br />or something to get around?])
      C -->|One| D([Laptop])
      C -->|Two| E([iPhone])
      C -->|Three| F([Car<br/>wroom wroom])
      click A "index.html#link-clicked" "link test"
      click B testClick "click test"
      classDef someclass fill:#f96;
      class A someclass;
      class C someclass;
      `,
      { flowchart: { htmlLabels: false }, fontFamily: 'courier' }
    );
  });

  test('50-elk: handle nested subgraphs in reverse order', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk LR
        a -->b
        subgraph A
        B
        end
        subgraph B
        b
        end
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('51-elk: handle nested subgraphs in reverse order', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk LR
        a -->b
        subgraph A
        B
        end
        subgraph B
        b
        end
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('52-elk: handle nested subgraphs in several levels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TB
    b-->B
    a-->c
    subgraph O
      A
    end
    subgraph B
      c
    end
    subgraph A
        a
        b
        B
    end
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('53-elk: handle nested subgraphs with edges in and out', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TB
  internet
  nat
  router
  lb1
  lb2
  compute1
  compute2
  subgraph project
  router
  nat
    subgraph subnet1
      compute1
      lb1
    end
    subgraph subnet2
      compute2
      lb2
    end
  end
  internet --> router
  router --> subnet1 & subnet2
  subnet1 & subnet2 --> nat --> internet
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('54-elk: handle nested subgraphs with outgoing links', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TD
  subgraph  main
    subgraph subcontainer
      subcontainer-child
    end
     subcontainer-child--> subcontainer-sibling
  end
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('55-elk: handle nested subgraphs with outgoing links 2', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TD

subgraph one[One]
    subgraph sub_one[Sub One]
        _sub_one
    end
    subgraph sub_two[Sub Two]
        _sub_two
    end
    _one
end

%% here, either the first or the second one
sub_one --> sub_two
_one --> b
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('56-elk: handle nested subgraphs with outgoing links 3', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TB
  subgraph container_Beta
    process_C-->Process_D
  end
  subgraph container_Alpha
    process_A-->process_B
    process_A-->|messages|process_C
    end
    process_B-->|via_AWSBatch|container_Beta
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('57-elk: handle nested subgraphs with outgoing links 4', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk LR
subgraph A
a -->b
end
subgraph B
b
end
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('57-elk: handle nested subgraphs with outgoing links 2', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TB
    c1-->a2
    subgraph one
    a1-->a2
    end
    subgraph two
    b1-->b2
    end
    subgraph three
    c1-->c2
    end
    one --> two
    three --> two
    two --> c2
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('57.x: handle nested subgraphs with outgoing links 5', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `%% this does not produce the desired result
flowchart-elk TB
  subgraph container_Beta
    process_C-->Process_D
  end
  subgraph container_Alpha
    process_A-->process_B
    process_B-->|via_AWSBatch|container_Beta
    process_A-->|messages|process_C
  end
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('58-elk: handle styling with style expressions', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    flowchart-elk LR
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('59-elk: handle styling of subgraphs and links', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk TD
  A[Christmas] ==> D
  A[Christmas] -->|Get money| B(Go shopping)
  A[Christmas] ==> C
  subgraph T ["Test"]
    A
    B
    C
  end

  classDef Test fill:#F84E68,stroke:#333,color:white;
  class A,T Test
  classDef TestSub fill:green;
  class T TestSub
  linkStyle 0,1 color:orange, stroke: orange;
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('60-elk: handle styling for all node shapes - v2', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      flowchart-elk LR
      A[red text] -->|default style| B(blue text)
      C([red text]) -->|default style| D[[blue text]]
      E[(red text)] -->|default style| F((blue text))
      G>red text] -->|default style| H{blue text}
      I{{red text}} -->|default style| J[/blue text/]
      K[\\ red text\\] -->|default style| L[/blue text\\]
      M[\\ red text/] -->|default style| N[blue text];
      O(((red text))) -->|default style| P(((blue text)));
      linkStyle default color:Sienna;
      style A stroke:#ff0000,fill:#ffcccc,color:#ff0000;
      style B stroke:#0000ff,fill:#ccccff,color:#0000ff;
      style C stroke:#ff0000,fill:#ffcccc,color:#ff0000;
      style D stroke:#0000ff,fill:#ccccff,color:#0000ff;
      style E stroke:#ff0000,fill:#ffcccc,color:#ff0000;
      style F stroke:#0000ff,fill:#ccccff,color:#0000ff;
      style G stroke:#ff0000,fill:#ffcccc,color:#ff0000;
      style H stroke:#0000ff,fill:#ccccff,color:#0000ff;
      style I stroke:#ff0000,fill:#ffcccc,color:#ff0000;
      style J stroke:#0000ff,fill:#ccccff,color:#0000ff;
      style K stroke:#ff0000,fill:#ffcccc,color:#ff0000;
      style L stroke:#0000ff,fill:#ccccff,color:#0000ff;
      style M stroke:#ff0000,fill:#ffcccc,color:#ff0000;
      style N stroke:#0000ff,fill:#ccccff,color:#0000ff;
      style O stroke:#ff0000,fill:#ffcccc,color:#ff0000;
      style P stroke:#0000ff,fill:#ccccff,color:#0000ff;
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose', logLevel: 2 }
    );
  });
  test('61-elk: fontawesome icons in edge labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      flowchart-elk TD
        C -->|fa:fa-car Car| F[fa:fa-car Car]
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('62-elk: should render styled subgraphs', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      flowchart-elk TB
      A
      B
      subgraph foo[Foo SubGraph]
        C
        D
      end
      subgraph bar[Bar SubGraph]
        E
        F
      end
      G

      A-->B
      B-->C
      C-->D
      B-->D
      D-->E
      E-->A
      E-->F
      F-->D
      F-->G
      B-->G
      G-->D

      style foo fill:#F99,stroke-width:2px,stroke:#F0F,color:darkred
      style bar fill:#999,stroke-width:10px,stroke:#0F0,color:blue
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('63-elk: title on subgraphs should be themeable', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      %%{init:{"theme":"base", "themeVariables": {"primaryColor":"#411d4e", "titleColor":"white", "darkMode":true}}}%%
      flowchart-elk LR
      subgraph A
          a --> b
      end
      subgraph B
          i -->f
      end
      A --> B
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('65-elk: text-color from classes', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      flowchart-elk LR
        classDef dark fill:#000,stroke:#000,stroke-width:4px,color:#fff
        Lorem --> Ipsum --> Dolor
        class Lorem,Dolor dark
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('66-elk: More nested subgraph cases (TB)', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk TB
    subgraph two
    b1
    end
    subgraph three
    c2
    end

    three --> two
    two --> c2

      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('67-elk: More nested subgraph cases (RL)', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk RL
    subgraph two
    b1
    end
    subgraph three
    c2
    end

    three --> two
    two --> c2

      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('68-elk: More nested subgraph cases (BT)', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk BT
    subgraph two
    b1
    end
    subgraph three
    c2
    end

    three --> two
    two --> c2

      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('69-elk: More nested subgraph cases (LR)', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk LR
    subgraph two
    b1
    end
    subgraph three
    c2
    end

    three --> two
    two --> c2

      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('70-elk: Handle nested subgraph cases (TB) link out and link between subgraphs', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk TB
   subgraph S1
    sub1 -->sub2
   end
  subgraph S2
    sub4
   end
   S1 --> S2
   sub1 --> sub4
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('71-elk: Handle nested subgraph cases (RL) link out and link between subgraphs', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk RL
   subgraph S1
    sub1 -->sub2
   end
  subgraph S2
    sub4
   end
   S1 --> S2
   sub1 --> sub4
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('72-elk: Handle nested subgraph cases (BT) link out and link between subgraphs', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk BT
   subgraph S1
    sub1 -->sub2
   end
  subgraph S2
    sub4
   end
   S1 --> S2
   sub1 --> sub4
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('74-elk: Handle nested subgraph cases (RL) link out and link between subgraphs', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk RL
   subgraph S1
    sub1 -->sub2
   end
  subgraph S2
    sub4
   end
   S1 --> S2
   sub1 --> sub4
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('74-elk: Handle labels for multiple edges from and to the same couple of nodes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
flowchart-elk RL
    subgraph one
      a1 -- l1 --> a2
      a1 -- l2 --> a2
    end
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('76-elk: handle unicode encoded character with HTML labels true', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TB
      a{{"Lorem 'ipsum' dolor 'sit' amet, 'consectetur' adipiscing 'elit'."}}
      --> b{{"Lorem #quot;ipsum#quot; dolor #quot;sit#quot; amet,#quot;consectetur#quot; adipiscing #quot;elit#quot;."}}
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('2050-elk: handling of different rendering direction in subgraphs', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    flowchart-elk LR

      subgraph TOP
        direction TB
        subgraph B1
            direction RL
            i1 -->f1
        end
        subgraph B2
            direction BT
            i2 -->f2
        end
      end
      A --> TOP --> B
      B1 --> B2
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  test('2388-elk: handling default in the node name', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      flowchart-elk LR
      default-index.js --> dot.template.js
      index.js --> module-utl.js
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('2824-elk: Clipping of edges', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      flowchart-elk TD
          A --> B
          A --> C
          B --> C
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  test('1433-elk: should render a titled flowchart with titleTopMargin set to 0', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: Simple flowchart
---
flowchart-elk TD
A --> B
`,
      { flowchart: { titleTopMargin: 0 } }
    );
  });
  test('elk: should include classes on the edges', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart-elk TD
      A --> B --> C --> D
      `,
      {}
    );
    await page.locator('svg').evaluate((svg) => {
      const edges = svg.querySelectorAll('.edges > path');
      for (const edge of edges) {
        if (!edge.classList.contains('flowchart-link')) {
          throw new Error('Expected flowchart-link class on edge');
        }
      }
    });
  });
  test.describe('Markdown strings flowchart-elk (#4220)', () => {
    test.describe('html labels', () => {
      test('With styling and classes', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart-elk LR
    A:::someclass --> B["\`The **cat** in the hat\`"]:::someclass
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
    classDef someclass fill:#f96
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('With formatting in a node', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart-elk LR
  a{"\`The **cat** in the hat\`"} -- 1o --> b
  a -- 2o --> c
  a -- 3o --> d
  g --2i--> a
  d --1i--> a
  h --3i -->a
  b --> d(The dog in the hog)
  c --> d
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('New line in node and formatted edge label', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart-elk LR
b("\`The dog in **the** hog.(1)
NL\`") --"\`1o **bold**\`"--> c
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test.skip('Wrapping long text with a new line', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart-elk LR
b(\`The dog in **the** hog.(1).. a a a a *very long text* about it
Word!

Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. \`) --> c

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('Sub graphs and markdown strings', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart-elk LR
subgraph "One"
  a("\`The **cat**
  in the hat\`") -- "1o" --> b{{"\`The **dog** in the hog\`"}}
end
subgraph "\`**Two**\`"
  c("\`The **cat**
  in the hat\`") -- "\`1o **ipa**\`" --> d("The dog in the hog")
end

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
    });

    test.describe('svg text labels', () => {
      test('With styling and classes', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%
flowchart-elk LR
    A:::someclass --> B["\`The **cat** in the hat\`"]:::someclass
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
    classDef someclass fill:#f96
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('With formatting in a node', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%
flowchart-elk LR
  a{"\`The **cat** in the hat\`"} -- 1o --> b
  a -- 2o --> c
  a -- 3o --> d
  g --2i--> a
  d --1i--> a
  h --3i -->a
  b --> d(The dog in the hog)
  c --> d
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('New line in node and formatted edge label', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%
flowchart-elk LR
b("\`The dog in **the** hog.(1)
NL\`") --"\`1o **bold**\`"--> c
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('Wrapping long text with a new line', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%
flowchart-elk LR
b("\`The dog in **the** hog.(1).. a a a a *very long text* about it
Word!

Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. \`") --> c

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('Sub graphs and markdown strings', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%
flowchart-elk LR
subgraph "One"
  a("\`The **cat**
  in the hat\`") -- "1o" --> b{{"\`The **dog** in the hog\`"}}
end
subgraph "\`**Two**\`"
  c("\`The **cat**
  in the hat\`") -- "\`1o **ipa**\`" --> d("The dog in the hog")
end

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('Sub graphs', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `---
config:
  layout: elk
---

flowchart LR
 subgraph subgraph_ko6czgs5u["Untitled subgraph"]
        D["Option 1"]
  end
    C{"Evaluate"} -- One --> D
    C -- Two --> E(("Option 2"))
    D --> E
      A["A"]

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('6080: should handle diamond shape intersections', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `---
config:
  layout: elk
---
flowchart LR
 subgraph s1["Untitled subgraph"]
        n1["Evaluate"]
        n2["Option 1"]
        n3["Option 2"]
        n4["fa:fa-car Option 3"]
  end
 subgraph s2["Untitled subgraph"]
        n5["Evaluate"]
        n6["Option 1"]
        n7["Option 2"]
        n8["fa:fa-car Option 3"]
  end
    A["Start"] -- Some text --> B("Continue")
    B --> C{"Evaluate"}
    C -- One --> D["Option 1"]
    C -- Two --> E["Option 2"]
    C -- Three --> F["fa:fa-car Option 3"]
    n1 -- One --> n2
    n1 -- Two --> n3
    n1 -- Three --> n4
    n5 -- One --> n6
    n5 -- Two --> n7
    n5 -- Three --> n8
    n1@{ shape: diam}
    n2@{ shape: rect}
    n3@{ shape: rect}
    n4@{ shape: rect}
    n5@{ shape: diam}
    n6@{ shape: rect}
    n7@{ shape: rect}
    n8@{ shape: rect}

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });

      test('6088-1: should handle diamond shape intersections', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `---
config:
  layout: elk
---
      flowchart LR
      subgraph S2
      subgraph s1["APA"]
      D{"Use the editor"}
      end

      D -- Mermaid js --> I{"fa:fa-code Text"}
            D --> I
            D --> I

      end
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });

      test('6088-2: should handle diamond shape intersections', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `---
config:
  layout: elk
---
      flowchart LR
      a
      subgraph s0["APA"]
      subgraph s8["APA"]
      subgraph s1["APA"]
        D{"X"}
        E[Q]
      end
      subgraph s3["BAPA"]
        F[Q]
        I
      end
            D --> I
            D --> I
            D --> I

      I{"X"}
      end
      end

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });

      test('6088-3: should handle diamond shape intersections', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `---
config:
  layout: elk
---
      flowchart LR
      a
        D{"Use the editor"}

      D -- Mermaid js --> I{"fa:fa-code Text"}
      D-->I
      D-->I

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });

      test('6088-4: should handle diamond shape intersections', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `---
config:
  layout: elk
---
flowchart LR
 subgraph s1["Untitled subgraph"]
        n1["Evaluate"]
        n2["Option 1"]
        n3["Option 2"]
        n4["fa:fa-car Option 3"]
  end
 subgraph s2["Untitled subgraph"]
        n5["Evaluate"]
        n6["Option 1"]
        n7["Option 2"]
        n8["fa:fa-car Option 3"]
  end
    A["Start"] -- Some text --> B("Continue")
    B --> C{"Evaluate"}
    C -- One --> D["Option 1"]
    C -- Two --> E["Option 2"]
    C -- Three --> F["fa:fa-car Option 3"]
    n1 -- One --> n2
    n1 -- Two --> n3
    n1 -- Three --> n4
    n5 -- One --> n6
    n5 -- Two --> n7
    n5 -- Three --> n8
    n1@{ shape: diam}
    n2@{ shape: rect}
    n3@{ shape: rect}
    n4@{ shape: rect}
    n5@{ shape: diam}
    n6@{ shape: rect}
    n7@{ shape: rect}
    n8@{ shape: rect}

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });

      test('6088-5: should handle diamond shape intersections', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `---
config:
  layout: elk
---
flowchart LR
    A{A} --> B & C

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      test('6088-6: should handle diamond shape intersections', async ({ page }, testInfo) => {
        await imgSnapshotTest(
          page,
          testInfo,
          `---
config:
  layout: elk
---
flowchart LR
    A{A} --> B & C
    subgraph "subbe"
      A
    end

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
    });
  });

  test('6647-elk: should keep node order when using elk layout unless it would add crossings', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
  layout: elk
---
      flowchart TB
        a --> a1 & a2 & a3 & a4
        b --> b1 & b2
        b2 --> b3
        b1 --> b4
      `
    );
  });
});

test.describe('Title and arrow styling #4813', () => {
  test('should render a flowchart with title', async ({ page }, testInfo) => {
    const titleString = 'Test Title';
    await renderGraph(
      page,
      testInfo,
      `---
      title: ${titleString}
      ---
      flowchart LR
      A-->B
      A-->C`,
      { layout: 'elk' }
    );
    const titleText = await page.locator('svg text').first().textContent();
    expect(titleText).toContain(titleString);
  });

  test('Render with stylized arrows', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
      flowchart LR
      A-->B
      B-.-oC
      C==xD
      D ~~~ A`,
      { layout: 'elk' }
    );
    await page.locator('svg').evaluate((svg) => {
      const edges = svg.querySelectorAll('.edges path');
      const classes = [
        'edge-pattern-solid',
        'edge-pattern-dotted',
        'edge-thickness-thick',
        'edge-thickness-invisible',
      ];
      classes.forEach((className, index) => {
        const classAttr = edges[index].getAttribute('class') ?? '';
        if (!classAttr.includes(className)) {
          throw new Error(`Expected class ${className} on edge ${index}`);
        }
      });
    });
  });

  test('7213: should render ELK edges with right angles not curves', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
  layout: elk
---
flowchart LR
    subgraph G1
        N00
        N11
        N12
        N13
    end
    subgraph G2
        N21
        N22
    end
    N00 --- N01 & N02 & N03 & N04 & N05
    N00 --- N11 & N12 & N13 & N22
    N11 --- N22
    N11 --- N22
    N11 --- N22
    N11 --- N22
    N11 --- N22
    `,
      {}
    );
  });

  test('elk: should merge edges within subgraphs when elk.mergeEdges is true (#7659)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
    layout: elk
    elk:
        mergeEdges: true
---
flowchart TD
    subgraph S1
        A & B --> C
    end
    subgraph S2
        D
        E
        F
    end
    D & E --> F
      `,
      {}
    );
  });

  test('elk: recursive flow with elk.keepEntryNodeOnTop=false keeps the default layout (#7827)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
    layout: elk
    elk:
        keepEntryNodeOnTop: false
---
flowchart TD
    brief --> web_sources --> academic_sources --> expert_voices --> synthesize --> decision
    decision -->|Needs completion| brief
    decision -->|If complete| format_output
      `,
      {}
    );
  });

  test('elk: should keep the entry node on top when a flow recurses with elk.keepEntryNodeOnTop=true (#7827)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
    layout: elk
    elk:
        keepEntryNodeOnTop: true
---
flowchart TD
    brief --> web_sources --> academic_sources --> expert_voices --> synthesize --> decision
    decision -->|Needs completion| brief
    decision -->|If complete| format_output
      `,
      {}
    );
  });

  test('elk: should keep the entry node on top of a recursive flow nested in a subgraph with elk.keepEntryNodeOnTop=true (#7827)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
    layout: elk
    elk:
        keepEntryNodeOnTop: true
---
flowchart TD
    start([Start]) --> research
    research --> done([Done])
    subgraph research["Research"]
      brief --> web_sources --> academic_sources --> expert_voices --> synthesize --> decision
      decision -->|Needs completion| brief
      decision -->|If complete| format_output
    end
      `,
      {}
    );
  });
});
