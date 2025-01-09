import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('Flowchart ELK', () => {
  it('1-elk: should render a simple flowchart', () => {
    imgSnapshotTest(
      `flowchart-elk TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      {}
    );
    imgSnapshotTest(
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

  it('2-elk: should render a simple flowchart with diagramPadding set to 0', () => {
    imgSnapshotTest(
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

  it('3-elk: a link with correct arrowhead to a subgraph', () => {
    imgSnapshotTest(
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

  it('4-elk: Length of edges', () => {
    imgSnapshotTest(
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
  it('5-elk: should render escaped without html labels', () => {
    imgSnapshotTest(
      `flowchart-elk TD
        a["<strong>Haiya</strong>"]---->b
      `,
      { htmlLabels: false, flowchart: { htmlLabels: false } }
    );
  });
  it('6-elk: should render non-escaped with html labels', () => {
    imgSnapshotTest(
      `flowchart-elk TD
        a["<strong>Haiya</strong>"]===>b
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('7-elk: should render a flowchart when useMaxWidth is true (default)', () => {
    renderGraph(
      `flowchart-elk TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      // expect(svg).to.have.attr('height');
      // use within because the absolute value can be slightly different depending on the environment ±5%
      // const height = parseFloat(svg.attr('height'));
      // expect(height).to.be.within(446 * 0.95, 446 * 1.05);
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).to.be.within(230 * 0.95, 230 * 1.05);
    });
  });
  it('8-elk: should render a flowchart when useMaxWidth is false', () => {
    renderGraph(
      `flowchart-elk TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { useMaxWidth: false } }
    );
    cy.get('svg').should((svg) => {
      // const height = parseFloat(svg.attr('height'));
      const width = parseFloat(svg.attr('width'));
      // use within because the absolute value can be slightly different depending on the environment ±5%
      // expect(height).to.be.within(446 * 0.95, 446 * 1.05);
      expect(width).to.be.within(230 * 0.95, 230 * 1.05);
      expect(svg).to.not.have.attr('style');
    });
  });

  it('V2 elk - 16: Render Stadium shape', () => {
    imgSnapshotTest(
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

  it('50-elk: handle nested subgraphs in reverse order', () => {
    imgSnapshotTest(
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

  it('51-elk: handle nested subgraphs in reverse order', () => {
    imgSnapshotTest(
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

  it('52-elk: handle nested subgraphs in several levels', () => {
    imgSnapshotTest(
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

  it('53-elk: handle nested subgraphs with edges in and out', () => {
    imgSnapshotTest(
      `flowchart-elk TB
  internet
  nat
  routeur
  lb1
  lb2
  compute1
  compute2
  subgraph project
  routeur
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
  internet --> routeur
  routeur --> subnet1 & subnet2
  subnet1 & subnet2 --> nat --> internet
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  it('54-elk: handle nested subgraphs with outgoing links', () => {
    imgSnapshotTest(
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

  it('55-elk: handle nested subgraphs with outgoing links 2', () => {
    imgSnapshotTest(
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

  it('56-elk: handle nested subgraphs with outgoing links 3', () => {
    imgSnapshotTest(
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
  it('57-elk: handle nested subgraphs with outgoing links 4', () => {
    imgSnapshotTest(
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

  it('57-elk: handle nested subgraphs with outgoing links 2', () => {
    imgSnapshotTest(
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
  it('57.x: handle nested subgraphs with outgoing links 5', () => {
    imgSnapshotTest(
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
  it('58-elk: handle styling with style expressions', () => {
    imgSnapshotTest(
      `
    flowchart-elk LR
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('59-elk: handle styling of subgraphs and links', () => {
    imgSnapshotTest(
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
  it('60-elk: handle styling for all node shapes - v2', () => {
    imgSnapshotTest(
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
  it('61-elk: fontawesome icons in edge labels', () => {
    imgSnapshotTest(
      `
      flowchart-elk TD
        C -->|fa:fa-car Car| F[fa:fa-car Car]
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('62-elk: should render styled subgraphs', () => {
    imgSnapshotTest(
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
  it('63-elk: title on subgraphs should be themable', () => {
    imgSnapshotTest(
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
  it('65-elk: text-color from classes', () => {
    imgSnapshotTest(
      `
      flowchart-elk LR
        classDef dark fill:#000,stroke:#000,stroke-width:4px,color:#fff
        Lorem --> Ipsum --> Dolor
        class Lorem,Dolor dark
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('66-elk: More nested subgraph cases (TB)', () => {
    imgSnapshotTest(
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
  it('67-elk: More nested subgraph cases (RL)', () => {
    imgSnapshotTest(
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
  it('68-elk: More nested subgraph cases (BT)', () => {
    imgSnapshotTest(
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
  it('69-elk: More nested subgraph cases (LR)', () => {
    imgSnapshotTest(
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
  it('70-elk: Handle nested subgraph cases (TB) link out and link between subgraphs', () => {
    imgSnapshotTest(
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
  it('71-elk: Handle nested subgraph cases (RL) link out and link between subgraphs', () => {
    imgSnapshotTest(
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
  it('72-elk: Handle nested subgraph cases (BT) link out and link between subgraphs', () => {
    imgSnapshotTest(
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
  it('74-elk: Handle nested subgraph cases (RL) link out and link between subgraphs', () => {
    imgSnapshotTest(
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
  it('74-elk: Handle labels for multiple edges from and to the same couple of nodes', () => {
    imgSnapshotTest(
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

  it('76-elk: handle unicode encoded character with HTML labels true', () => {
    imgSnapshotTest(
      `flowchart-elk TB
      a{{"Lorem 'ipsum' dolor 'sit' amet, 'consectetur' adipiscing 'elit'."}}
      --> b{{"Lorem #quot;ipsum#quot; dolor #quot;sit#quot; amet,#quot;consectetur#quot; adipiscing #quot;elit#quot;."}}
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  it('2050-elk: handling of different rendering direction in subgraphs', () => {
    imgSnapshotTest(
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

  it('2388-elk: handling default in the node name', () => {
    imgSnapshotTest(
      `
      flowchart-elk LR
      default-index.js --> dot.template.js
      index.js --> module-utl.js
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('2824-elk: Clipping of edges', () => {
    imgSnapshotTest(
      `
      flowchart-elk TD
          A --> B
          A --> C
          B --> C
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('1433-elk: should render a titled flowchart with titleTopMargin set to 0', () => {
    imgSnapshotTest(
      `---
title: Simple flowchart
---
flowchart-elk TD
A --> B
`,
      { flowchart: { titleTopMargin: 0 } }
    );
  });
  it('elk: should include classes on the edges', () => {
    renderGraph(
      `flowchart-elk TD
      A --> B --> C --> D
      `,
      {}
    );
    cy.get('svg').should((svg) => {
      const edges = svg.querySelectorAll('.edges > path');
      edges.forEach((edge) => {
        expect(edge).to.have.class('flowchart-link');
      });
    });
  });
  describe('Markdown strings flowchart-elk (#4220)', () => {
    describe('html labels', () => {
      it('With styling and classes', () => {
        imgSnapshotTest(
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
      it('With formatting in a node', () => {
        imgSnapshotTest(
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
      it('New line in node and formatted edge label', () => {
        imgSnapshotTest(
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart-elk LR
b("\`The dog in **the** hog.(1)
NL\`") --"\`1o **bold**\`"--> c
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      it('Wrapping long text with a new line', () => {
        imgSnapshotTest(
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart-elk LR
b(\`The dog in **the** hog.(1).. a a a a *very long text* about it
Word!

Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. \`) --> c

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      it('Sub graphs and markdown strings', () => {
        imgSnapshotTest(
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

    describe('svg text labels', () => {
      it('With styling and classes', () => {
        imgSnapshotTest(
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
      it('With formatting in a node', () => {
        imgSnapshotTest(
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
      it('New line in node and formatted edge label', () => {
        imgSnapshotTest(
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%
flowchart-elk LR
b("\`The dog in **the** hog.(1)
NL\`") --"\`1o **bold**\`"--> c
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      it('Wrapping long text with a new line', () => {
        imgSnapshotTest(
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%
flowchart-elk LR
b("\`The dog in **the** hog.(1).. a a a a *very long text* about it
Word!

Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. \`") --> c

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      it('Sub graphs and markdown strings', () => {
        imgSnapshotTest(
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
      it('Sub graphs and markdown strings', () => {
        imgSnapshotTest(
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
      it('6080: should handle diamond shape intersections', () => {
        imgSnapshotTest(
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

      it('6088-1: should handle diamond shape intersections', () => {
        imgSnapshotTest(
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

      it('6088-2: should handle diamond shape intersections', () => {
        imgSnapshotTest(
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

      it('6088-3: should handle diamond shape intersections', () => {
        imgSnapshotTest(
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

      it('6088-4: should handle diamond shape intersections', () => {
        imgSnapshotTest(
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

      it('6088-5: should handle diamond shape intersections', () => {
        imgSnapshotTest(
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
      it('6088-6: should handle diamond shape intersections', () => {
        imgSnapshotTest(
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
});

describe('Title and arrow styling #4813', () => {
  it('should render a flowchart with title', () => {
    const titleString = 'Test Title';
    renderGraph(
      `---
      title: ${titleString}
      ---
      flowchart LR
      A-->B
      A-->C`,
      { layout: 'elk' }
    );
    cy.get('svg').should((svg) => {
      const title = svg[0].querySelector('text');
      expect(title.textContent).to.contain(titleString);
    });
  });

  it('Render with stylized arrows', () => {
    renderGraph(
      `
      flowchart LR
      A-->B
      B-.-oC
      C==xD
      D ~~~ A`,
      { layout: 'elk' }
    );
    cy.get('svg').should((svg) => {
      const edges = svg[0].querySelectorAll('.edges path');
      expect(edges[0].getAttribute('class')).to.contain('edge-pattern-solid');
      expect(edges[1].getAttribute('class')).to.contain('edge-pattern-dotted');
      expect(edges[2].getAttribute('class')).to.contain('edge-thickness-thick');
      expect(edges[3].getAttribute('class')).to.contain('edge-thickness-invisible');
    });
  });
});
