import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Flowchart v2', () => {
  it('1: should render a simple flowchart', () => {
    imgSnapshotTest(
      `flowchart TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `
    );
  });

  it('2: should render a simple flowchart with diagramPadding set to 0', () => {
    imgSnapshotTest(
      `flowchart TD
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

  it('3: a link with correct arrowhead to a subgraph', () => {
    imgSnapshotTest(
      `flowchart TD
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
      `
    );
  });

  it('4: Length of edges', () => {
    imgSnapshotTest(
      `flowchart TD
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
      `
    );
  });
  it('5: should render escaped without html labels', () => {
    imgSnapshotTest(
      `flowchart TD
        a["<strong>Haiya</strong>"]---->b
      `,
      { htmlLabels: false, flowchart: { htmlLabels: false } }
    );
  });
  it('6: should render non-escaped with html labels', () => {
    imgSnapshotTest(
      `flowchart TD
        a["<strong>Haiya</strong>"]===>b
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('7: should render a flowchart when useMaxWidth is true (default)', () => {
    imgSnapshotTest(
      `flowchart TD
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
      expect(maxWidthValue).to.be.within(290 * 0.95 - 1, 290 * 1.05);
    });
  });
  it('8: should render a flowchart when useMaxWidth is false', () => {
    imgSnapshotTest(
      `flowchart TD
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
      expect(width).to.be.within(290 * 0.95 - 1, 290 * 1.05);
      expect(svg).to.not.have.attr('style');
    });
  });

  it('V2 - 16: Render Stadium shape', () => {
    imgSnapshotTest(
      ` flowchart TD
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

  it('50: handle nested subgraphs in reverse order', () => {
    imgSnapshotTest(
      `flowchart LR
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

  it('51: handle nested subgraphs in reverse order', () => {
    imgSnapshotTest(
      `flowchart LR
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

  it('52: handle nested subgraphs in several levels.', () => {
    imgSnapshotTest(
      `flowchart TB
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

  it('53: handle nested subgraphs with edges in and out', () => {
    imgSnapshotTest(
      `flowchart TB
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

  it('54: handle nested subgraphs with outgoing links', () => {
    imgSnapshotTest(
      `flowchart TD
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

  it('55: handle nested subgraphs with outgoing links 2', () => {
    imgSnapshotTest(
      `flowchart TD

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

  it('56: handle nested subgraphs with outgoing links 3', () => {
    imgSnapshotTest(
      `flowchart TB
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
  it('57: handle nested subgraphs with outgoing links 4', () => {
    imgSnapshotTest(
      `flowchart LR
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

  it('57: handle nested subgraphs with outgoing links 2', () => {
    imgSnapshotTest(
      `flowchart TB
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
flowchart TB
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
  it('58: handle styling with style expressions', () => {
    imgSnapshotTest(
      `
    flowchart LR
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('59: handle styling of subgraphs and links', () => {
    imgSnapshotTest(
      `
flowchart TD
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
  it('60: handle styling for all node shapes - v2', () => {
    imgSnapshotTest(
      `
      flowchart LR
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
  it('61: fontawesome icons in edge labels', () => {
    imgSnapshotTest(
      `
      flowchart TD
        C -->|fa:fa-car Car| F[fa:fa-car Car]
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('62: should render styled subgraphs', () => {
    imgSnapshotTest(
      `
      flowchart TB
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
  it('63: title on subgraphs should be themable', () => {
    imgSnapshotTest(
      `
      %%{init:{"theme":"base", "themeVariables": {"primaryColor":"#411d4e", "titleColor":"white", "darkMode":true}}}%%
      flowchart LR
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
  it('65: text-color from classes', () => {
    imgSnapshotTest(
      `
      flowchart LR
        classDef dark fill:#000,stroke:#000,stroke-width:4px,color:#fff
        Lorem --> Ipsum --> Dolor
        class Lorem,Dolor dark
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('66: More nested subgraph cases (TB)', () => {
    imgSnapshotTest(
      `
flowchart TB
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
  it('67: More nested subgraph cases (RL)', () => {
    imgSnapshotTest(
      `
flowchart RL
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
  it('68: More nested subgraph cases (BT)', () => {
    imgSnapshotTest(
      `
flowchart BT
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
  it('69: More nested subgraph cases (LR)', () => {
    imgSnapshotTest(
      `
flowchart LR
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
  it('70: Handle nested subgraph cases (TB) link out and link between subgraphs', () => {
    imgSnapshotTest(
      `
flowchart TB
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
  it('71: Handle nested subgraph cases (RL) link out and link between subgraphs', () => {
    imgSnapshotTest(
      `
flowchart RL
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
  it('72: Handle nested subgraph cases (BT) link out and link between subgraphs', () => {
    imgSnapshotTest(
      `
flowchart BT
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
  it('74: Handle nested subgraph cases (RL) link out and link between subgraphs', () => {
    imgSnapshotTest(
      `
flowchart RL
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
  it('74: Handle labels for multiple edges from and to the same couple of nodes', () => {
    imgSnapshotTest(
      `
flowchart RL
    subgraph one
      a1 -- l1 --> a2
      a1 -- l2 --> a2
    end
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  it('76: handle unicode encoded character with HTML labels true', () => {
    imgSnapshotTest(
      `flowchart TB
      a{{"Lorem 'ipsum' dolor 'sit' amet, 'consectetur' adipiscing 'elit'."}}
      --> b{{"Lorem #quot;ipsum#quot; dolor #quot;sit#quot; amet,#quot;consectetur#quot; adipiscing #quot;elit#quot;."}}
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });

  it('2050: handling of different rendering direction in subgraphs', () => {
    imgSnapshotTest(
      `
    flowchart LR

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

  it('2388: handling default in the node name', () => {
    imgSnapshotTest(
      `
      flowchart LR
      default-index.js --> dot.template.js
      index.js --> module-utl.js
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('2824: Clipping of edges', () => {
    imgSnapshotTest(
      `
      flowchart TD
          A --> B
          A --> C
          B --> C
      `,
      { htmlLabels: true, flowchart: { htmlLabels: true }, securityLevel: 'loose' }
    );
  });
  it('1433: should render a titled flowchart with titleTopMargin set to 0', () => {
    imgSnapshotTest(
      `---
title: Simple flowchart
---
flowchart TD
A --> B
`,
      { flowchart: { titleTopMargin: 0 } }
    );
  });
  it('3192: It should be possieble to render flowcharts with invisible edges', () => {
    imgSnapshotTest(
      `---
title: Simple flowchart with invisible edges
---
flowchart TD
A ~~~ B
`,
      { flowchart: { titleTopMargin: 0 } }
    );
  });
  it('4023: Should render html labels with images and-or text correctly', () => {
    imgSnapshotTest(
      `flowchart TD
    B[<img src='https://mermaid.js.org/mermaid-logo.svg'>]
    B-->C[<img src="https://mermaid.js.org/mermaid-logo.svg"> more text <img src='https://mermaid.js.org/mermaid-logo.svg'>]
    B-->D(<img src='https://mermaid.js.org/mermaid-logo.svg'> some text)
    B-->E(plain)`
    );
  });

  it('4439: Should render the graph even if some images are missing', () => {
    imgSnapshotTest(
      `flowchart TD
    B[<img>]
    B-->C[<img>]`
    );
  });
  describe('Markdown strings flowchart (#4220)', () => {
    describe('html labels', () => {
      it('With styling and classes', () => {
        imgSnapshotTest(
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart LR
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
flowchart LR
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
flowchart LR
b("\`The dog in **the** hog.(1)
NL\`") --"\`1o **bold**\`"--> c
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      it('Wrapping long text with a new line', () => {
        imgSnapshotTest(
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart LR
b("\`The dog in **the** hog.(1).. a a a a *very long text* about it
Word!

Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. Another line with many, many words. \`") --> c

`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      it('Sub graphs and markdown strings', () => {
        imgSnapshotTest(
          `%%{init: {"flowchart": {"htmlLabels": true}} }%%
flowchart LR
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
flowchart LR
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
flowchart LR
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
flowchart LR
b("\`The dog in **the** hog.(1)
NL\`") --"\`1o **bold**\`"--> c
`,
          { flowchart: { titleTopMargin: 0 } }
        );
      });
      it('Wrapping long text with a new line', () => {
        imgSnapshotTest(
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%
flowchart LR
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
flowchart LR
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
  });
});
