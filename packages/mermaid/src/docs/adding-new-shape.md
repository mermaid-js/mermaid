# Custom SVG Shapes Library

This library provides a collection of custom SVG shapes, utilities, and helpers for generating diagram components. The shapes are designed to be used within an SVG container and include a variety of common and complex shapes.

## Overview

## Shape Helpers and Utilities

Before starting with shape creation, it's essential to familiarize yourself with the utilities provided in the `utils.ts` file from `packages/mermaid/src/rendering-util/rendering-elements/shapes/util.js`. These utilities are designed to assist with various aspects of SVG shape manipulation and ensure consistent and accurate rendering.

## Available Utilities

### 1. `labelHelper`

- **Purpose**: This function creates and inserts labels inside SVG shapes.
- **Features**:
  - Handles both HTML labels and plain text.
  - Calculates the bounding box dimensions of the label.
  - Ensures proper positioning of labels within shapes.

### 2. `updateNodeBounds`

- **Purpose**: Updates the bounding box dimensions (width and height) of a node.
- **Usage**:
  - Adjusts the size of the node to fit the content or shape.
  - Useful for ensuring that shapes resize appropriately based on their content.

### 3. `insertPolygonShape`

- **Purpose**: Inserts a polygon shape into an SVG container.
- **Features**:
  - Handles the creation and insertion of complex polygonal shapes.
  - Configures the shape's appearance and positioning within the SVG container.

### 4. `getNodeClasses`

- **Purpose**: Returns the appropriate CSS classes for a node based on its configuration.
- **Usage**:
  - Dynamically applies CSS classes to nodes for styling purposes.
  - Ensures that nodes adhere to the desired design and theme.

### 5. `createPathFromPoints`

- **Purpose**: Generates an SVG path string from an array of points.
- **Usage**:
  - Converts a list of points into a smooth path.
  - Useful for creating custom shapes or paths within the SVG.

### 6. `generateFullSineWavePoints`

- **Purpose**: Generates points for a sine wave, useful for creating wavy-edged shapes.
- **Usage**:
  - Facilitates the creation of shapes with wavy or sine-wave edges.
  - Can be used to add decorative or dynamic edges to shapes.

## Getting Started

To utilize these utilities, simply import them from the `utils.ts` file into your shape creation script. These helpers will streamline the process of building and customizing SVG shapes, ensuring consistent results across your projects.

```typescript
import {
  labelHelper,
  updateNodeBounds,
  insertPolygonShape,
  getNodeClasses,
  createPathFromPoints,
  generateFullSineWavePoints,
} from './utils.ts';
```

## Example Usage

Here’s a basic example of how you might use some of these utilities:

```typescript
import { labelHelper, insertPolygonShape } from './utils.ts';

const svgContainer = document.getElementById('svgContainer');

// Insert a polygon shape
insertPolygonShape(svgContainer /* shape-specific parameters */);

// Create and insert a label inside the shape
labelHelper(svgContainer /* label-specific parameters */);
```

## Adding New Shapes

### 1. Create the Shape Function

To add a new shape:

- **Create the shape function**: Create a new file of name of the shape and export a function in the `shapes` directory that generates your shape. The file and function should follow the pattern used in existing shapes and return an SVG element.

- **Example**:

  ```typescript
  import { Node, RenderOptions } from '../../types.ts';

  export const myNewShape = async (
    parent: SVGAElement,
    node: Node,
    renderOptions: RenderOptions
  ) => {
    // Create your shape here
    const shape = parent.insert('g').attr('class', 'my-new-shape');
    // Add other elements or styles as needed
    return shape;
  };
  ```

### 2. Register the Shape

- **Register the shape**: Add your shape to the `shapes` object in the [main shapes module](../rendering-util/rendering-elements/shapes.ts). This allows your shape to be recognized and used within the system.

- **Example**:

  ```typescript
  import { myNewShape } from './shapes/myNewShape';

  const shapes = {
    ...,
    {
      semanticName: 'My Shape',
      name: 'Shape Name',
      shortName: '<short-name>',
      description: '<Description for the shape>',
      aliases: ['<alias-one>', '<al-on>', '<alias-two>', '<al-two>'],
      handler: myNewShape,
    },
  };
  ```

# Shape Intersection Algorithms

This contains algorithms and utilities for calculating intersection points for various shapes in SVG. Arrow intersection points are crucial for accurately determining where arrows connect with shapes. Ensuring precise intersection points enhances the clarity and accuracy of flowcharts and diagrams.

## Shape Intersection Functions

### 1. `Ellipse`

Calculates the intersection points for an ellipse.

**Usage**:

```javascript
import intersectEllipse from './intersect-ellipse.js';

const intersection = intersectEllipse(node, rx, ry, point);
```

- **Parameters**:
  - `node`: The SVG node element.
  - `rx`: The x-radius of the ellipse.
  - `ry`: The y-radius of the ellipse.
  - `point`: The point from which the intersection is calculated.

### 2. `intersectRect`

Calculates the intersection points for a rectangle.

**Usage**:

```javascript
import intersectRect from './intersect-rect.js';

const intersection = intersectRect(node, point);
```

- **Parameters**:
  - `node`: The SVG node element.
  - `point`: The point from which the intersection is calculated.

### 3. `intersectPolygon`

Calculates the intersection points for a polygon.

**Usage**:

```javascript
import intersectPolygon from './intersect-polygon.js';

const intersection = intersectPolygon(node, polyPoints, point);
```

- **Parameters**:
  - `node`: The SVG node element.
  - `polyPoints`: Array of points defining the polygon.
  - `point`: The point from which the intersection is calculated.

## Cypress Tests

To ensure the robustness of the flowchart shapes, there are implementation of comprehensive Cypress test cases in `newShapes.spec.ts` file. These tests cover various aspects such as:

- **Shapes**: Testing new shapes like `bowTieRect`, `waveRectangle`, `trapezoidalPentagon`, etc.
- **Looks**: Verifying shapes under different visual styles (`classic` and `handDrawn`).
- **Directions**: Ensuring correct rendering in all flow directions of arrows :
  - `TB` `(Top -> Bottom)`
  - `BT` `(Bottom -> Top)`
  - `LR` `(Left -> Right)`
  - `RL` `(Right -> Left)`
- **Labels**: Testing shapes with different labels, including:
  - No labels
  - Short labels
  - Very long labels
  - Markdown with `htmlLabels:true` and `htmlLabels:false`
- **Styles**: Applying custom styles to shapes and verifying correct rendering.
- **Class Definitions**: Using `classDef` to apply custom classes and testing their impact.

### Running the Tests

To run the Cypress tests, follow these steps:

1. Ensure you have all dependencies installed by running:
   ```bash
   pnpm install
   ```
2. Start the Cypress test runner:

   ```bash
   cypress open --env updateSnapshots=true

   ```

3. Select the test suite from the Cypress interface to run all the flowchart shape tests.
