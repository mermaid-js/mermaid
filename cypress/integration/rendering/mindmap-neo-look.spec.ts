import { imgSnapshotTest } from '../../helpers/util.ts';

const looks = ['neo'] as const;
const themes = ['neo', 'neo-dark', 'redux', 'redux-dark'] as const;

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
        console.log('mindmapCode', mindmapCode);
      });
    });
  });
});
