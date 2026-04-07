import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Venn Diagram', () => {
  it('1: should render a simple two-set venn diagram', () => {
    imgSnapshotTest(
      `venn-beta
        set A
        set B
        union A, B
      `
    );
  });

  it('2: should render a three-set venn diagram', () => {
    imgSnapshotTest(
      `venn-beta
        set A
        set B
        set C
        union A, B
        union B, C
        union A, C
        union A, B, C
      `
    );
  });

  it('3: should render a venn diagram with a title', () => {
    imgSnapshotTest(
      `venn-beta
        title Skills Overlap
        set Frontend
        set Backend
        set DevOps
        union Frontend, Backend
        union Backend, DevOps
        union Frontend, DevOps
        union Frontend, Backend, DevOps
      `
    );
  });

  it('4: should render a venn diagram with custom set sizes', () => {
    imgSnapshotTest(
      `venn-beta
        set A:20
        set B:15
        set C:10
        union A, B:5
        union B, C:3
        union A, C:2
        union A, B, C:1
      `
    );
  });

  it('5: should render a venn diagram with labels', () => {
    imgSnapshotTest(
      `venn-beta
        title Team Skills
        set Frontend["Frontend"]
        set Backend["Backend"]
        union Frontend, Backend["Fullstack"]
      `
    );
  });

  it('6: should render a venn diagram with text nodes', () => {
    imgSnapshotTest(
      `venn-beta
        set A
          text "Item 1"
          text "Item 2"
        set B
          text "Item 3"
        union A, B
          text "Shared"
      `
    );
  });

  it('7: should render a venn diagram with custom colors via style', () => {
    imgSnapshotTest(
      `venn-beta
        set A
        set B
        union A, B
        style A fill:#ff6b6b
        style B fill:#4ecdc4
        style A,B fill:#ffe66d
      `
    );
  });

  it('8: should render a venn diagram with string identifiers', () => {
    imgSnapshotTest(
      `venn-beta
        title Programming Languages
        set "JavaScript"
        set "Python"
        set "TypeScript"
        union "JavaScript", "TypeScript"
      `
    );
  });

  it('9: should render with dark theme', () => {
    imgSnapshotTest(
      `venn-beta
        title Dark Theme
        set A
        set B
        set C
        union A, B
        union B, C
        union A, C
      `,
      { theme: 'dark' }
    );
  });

  it('10: should render a venn diagram with many text nodes', () => {
    imgSnapshotTest(
      `venn-beta
        title Fruits and Vegetables
        set Fruits
          text "Apple"
          text "Banana"
          text "Orange"
        set Vegetables
          text "Carrot"
          text "Broccoli"
        union Fruits, Vegetables
          text "Tomato"
      `
    );
  });

  it('11: should render a venn diagram with custom text colors via style', () => {
    imgSnapshotTest(
      `venn-beta
        set A
          text A1["Red Text"]
        set B
          text B1["Blue Text"]
        union A, B
          text AB1["Green Text"]
        style A1 color:#ff0000
        style B1 color:#0000ff
        style AB1 color:#00ff00
      `
    );
  });

  it('12: should render a two-set venn with asymmetric sizes', () => {
    imgSnapshotTest(
      `venn-beta
        set A:30
        set B:10
        union A, B:5
      `
    );
  });

  it('13: should render a complex venn with labels, text nodes, and styles', () => {
    imgSnapshotTest(
      `venn-beta
        title Software Engineering Skills
        set Frontend["Frontend"]
          text "React"
          text "CSS"
          text "HTML"
        set Backend["Backend"]
          text "Node.js"
          text "SQL"
          text "APIs"
        set DevOps["DevOps"]
          text "Docker"
          text "CI/CD"
        union Frontend, Backend["Fullstack"]
          text "REST"
          text "GraphQL"
        union Backend, DevOps
          text "Monitoring"
        union Frontend, DevOps
          text "Performance"
        union Frontend, Backend, DevOps
          text "Architecture"
        style Frontend fill:#ff6b6b
        style Backend fill:#4ecdc4
        style DevOps fill:#45b7d1
      `
    );
  });

  it('14: should render a two-set venn diagram with handDrawn look', () => {
    imgSnapshotTest(
      `venn-beta
        set A
        set B
        union A, B
      `,
      { look: 'handDrawn', handDrawnSeed: 1, fontFamily: 'courier' }
    );
  });

  it('15: should render a three-set venn with handDrawn look and title', () => {
    imgSnapshotTest(
      `venn-beta
        title HandDrawn Skills
        set Frontend
        set Backend
        set DevOps
        union Frontend, Backend
        union Backend, DevOps
        union Frontend, DevOps
        union Frontend, Backend, DevOps
      `,
      { look: 'handDrawn', handDrawnSeed: 1, fontFamily: 'courier' }
    );
  });

  it('16: should render a handDrawn venn with custom styles and text nodes', () => {
    imgSnapshotTest(
      `venn-beta
        set A
          text "Item 1"
          text "Item 2"
        set B
          text "Item 3"
        union A, B
          text "Shared"
        style A fill:#ff6b6b
        style B fill:#4ecdc4
        style A,B fill:#ffe66d
      `,
      { look: 'handDrawn', handDrawnSeed: 1, fontFamily: 'courier' }
    );
  });
});
