import { imgSnapshotTest } from '../../helpers/util.ts';

const looks = ['neo'] as const;
const themes = [
  'neo',
  'neo-dark',
  'redux',
  'redux-dark',
  'redux-color',
  'redux-dark-color',
] as const;

// Mindmap shapes
const mindmapShapes = ['square', 'rounded', 'circle', 'cloud', 'bang'] as const;

// Helper function to get shape syntax
function getShapeSyntax(shape: (typeof mindmapShapes)[number], label: string): string {
  switch (shape) {
    case 'square':
      return `[${label}]`;
    case 'rounded':
      return `(${label})`;
    case 'circle':
      return `((${label}))`;
    case 'cloud':
      return `)${label}(`;
    case 'bang':
      return `))${label}((`;
    default:
      return label;
  }
}

looks.forEach((look) => {
  themes.forEach((theme) => {
    describe(`Test all mindmap shapes connected with each other in ${look} look and ${theme} theme`, () => {
      it(`connect all shapes with each other`, () => {
        let mindmapCode = `mindmap\n`;

        // Create root node with first shape
        mindmapCode += `  root${getShapeSyntax(mindmapShapes[0], 'Root')}\n`;

        // Add all shapes as children of root
        mindmapShapes.forEach((shape, index) => {
          const label = `${shape.charAt(0).toUpperCase() + shape.slice(1)} ${index}`;
          mindmapCode += `    n${index}${getShapeSyntax(shape, label)}\n`;
        });

        // Add grandchildren to each child with different shapes
        mindmapShapes.forEach((_parentShape, parentIndex) => {
          mindmapShapes.forEach((childShape, childIndex) => {
            const label = `GC ${parentIndex}-${childIndex}`;
            mindmapCode += `      gc${parentIndex}_${childIndex}${getShapeSyntax(childShape, label)}\n`;
          });
        });

        imgSnapshotTest(mindmapCode, { look, theme });
      });
    });

    describe(`Test mindmap branches in ${look} look and ${theme} theme`, () => {
      it('should render branches with children and grandchildren', () => {
        imgSnapshotTest(
          `mindmap
root
  child1
      grandchild 1
      grandchild 2
  child2
      grandchild 3
      grandchild 4
  child3
      grandchild 5
      grandchild 6
    `,
          { look, theme }
        );
      });
    });

    describe(`Test mindmap mixed shapes and icons in ${look} look and ${theme} theme`, () => {
      it('should render branches with mixed shapes and icons', () => {
        imgSnapshotTest(
          `mindmap
root
  child1((Circle))
      grandchild 1
      grandchild 2
  child2(Round rectangle)
      grandchild 3
      grandchild 4
  child3[Square]
      grandchild 5
      ::icon(mdi mdi-fire)
      gc6((grand<br/>child 6))
      ::icon(mdi mdi-fire)
    `,
          { look, theme }
        );
      });
    });

    describe(`Test mindmap bang and cloud shapes in ${look} look and ${theme} theme`, () => {
      it('should render bang and cloud shapes', () => {
        imgSnapshotTest(
          `mindmap
root))bang((
  ::icon(mdi mdi-fire)
  a))Another bang((
  ::icon(mdi mdi-fire)
  a)A cloud(
  ::icon(mdi mdi-fire)
    `,
          { look, theme }
        );
      });
    });

    describe(`Test mindmap markdown labels in ${look} look and ${theme} theme`, () => {
      it('should render formatted markdown labels with linebreak and emojis', () => {
        imgSnapshotTest(
          `mindmap
    id1[\`**Start** with
    a second line 😎\`]
      id2[\`The dog in **the** hog... a *very long text* about it Word!\`]`,
          { look, theme }
        );
      });
    });

    describe(`Test mindmap Level 2 nodes exceeding 11 in ${look} look and ${theme} theme`, () => {
      it('should render all Level 2 nodes correctly when there are more than 11', () => {
        imgSnapshotTest(
          `mindmap
root
  Node1
  Node2
  Node3
  Node4
  Node5
  Node6
  Node7
  Node8
  Node9
  Node10
  Node11
  Node12
  Node13
  Node14
  Node15`,
          { look, theme }
        );
      });
    });
  });
});
