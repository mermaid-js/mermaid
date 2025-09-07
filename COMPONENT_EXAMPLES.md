# Mermaid Key Components: Code Examples

This document provides concrete code examples demonstrating how Mermaid's key components work together.

## Diagram Type Examples

### Flowchart Diagram Structure

```typescript
// packages/mermaid/src/diagrams/flowchart/flowDiagram.ts
export const diagram = {
  parser: flowParser, // JISON parser for flowchart syntax
  get db() {
    // Database for managing diagram state
    return new FlowDB();
  },
  renderer, // SVG renderer function
  styles: flowStyles, // CSS styles specific to flowcharts
  init: (cnf: MermaidConfig) => {
    if (!cnf.flowchart) {
      cnf.flowchart = {};
    }
    // Configuration initialization
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  },
};
```

### Sequence Diagram Structure

```typescript
// packages/mermaid/src/diagrams/sequence/sequenceDiagram.ts
export const diagram: DiagramDefinition = {
  parser, // JISON parser for sequence syntax
  get db() {
    return new SequenceDB(); // Manages participants, messages, loops
  },
  renderer, // Draws actors, lifelines, messages
  styles, // Sequence-specific styling
  init: (cnf: MermaidConfig) => {
    if (!cnf.sequence) {
      cnf.sequence = {};
    }
    if (cnf.wrap) {
      cnf.sequence.wrap = cnf.wrap;
    }
  },
};
```

## Core API Examples

### Main API Usage Pattern

```typescript
// packages/mermaid/src/mermaidAPI.ts

/**
 * Parse and validate diagram syntax
 */
async function parse(text: string, parseOptions?: ParseOptions): Promise<ParseResult> {
  addDiagrams(); // Load all diagram types
  const { code, config } = processAndSetConfigs(text);
  const diagram = await getDiagramFromText(code);
  return { diagramType: diagram.type, config };
}

/**
 * Render diagram to SVG
 */
async function render(
  id: string,
  text: string,
  svgContainingElement?: Element
): Promise<RenderResult> {
  const { diagramType, config } = await parse(text, { suppressErrors: true });

  // Create diagram instance
  const diagram = new Diagram(text, {}, diagramType);

  // Render to SVG
  const svgCode = await diagram.renderer.draw(text, id, diagram);

  return {
    diagramType,
    svg: svgCode,
    bindFunctions: diagram.db.bindFunctions,
  };
}
```

### Diagram Detection Example

```typescript
// packages/mermaid/src/diagram-api/detectType.ts

export const detectors: Record<string, DiagramDetector> = {
  flowchart: {
    detector: (text: string) => /^\s*graph|flowchart/.test(text),
    loader: async () => {
      const { diagram } = await import('../diagrams/flowchart/flowDiagram.js');
      return { id: 'flowchart', diagram };
    },
  },
  sequence: {
    detector: (text: string) => /^\s*sequenceDiagram/.test(text),
    loader: async () => {
      const { diagram } = await import('../diagrams/sequence/sequenceDiagram.js');
      return { id: 'sequence', diagram };
    },
  },
};

export const detectType = function (text: string, config?: MermaidConfig): string {
  for (const [diagramType, { detector }] of Object.entries(detectors)) {
    if (detector(text, config)) {
      return diagramType;
    }
  }
  throw new UnknownDiagramError(`No diagram type detected for text: ${text}`);
};
```

## Rendering System Examples

### Layout Algorithm Integration

```typescript
// packages/mermaid/src/rendering-util/render.ts

interface LayoutAlgorithm {
  render(
    layoutData: LayoutData,
    svg: SVG,
    helpers: InternalHelpers,
    options?: RenderOptions
  ): Promise<void>;
}

const layoutAlgorithms: Record<string, LayoutLoaderDefinition> = {};

export const registerLayoutLoaders = (loaders: LayoutLoaderDefinition[]) => {
  for (const loader of loaders) {
    layoutAlgorithms[loader.name] = loader;
  }
};

// Default layout loaders
const registerDefaultLayoutLoaders = () => {
  registerLayoutLoaders([
    {
      name: 'dagre',
      loader: async () => await import('./layout-algorithms/dagre/index.js'),
    },
    {
      name: 'elk',
      loader: async () => await import('./layout-algorithms/elk/index.js'),
    },
  ]);
};

export const render = async (data4Layout: LayoutData, svg: SVG) => {
  const layoutDefinition = layoutAlgorithms[data4Layout.layoutAlgorithm];
  const layoutRenderer = await layoutDefinition.loader();
  return layoutRenderer.render(data4Layout, svg, internalHelpers);
};
```

### Unified Renderer Example

```typescript
// packages/mermaid/src/diagrams/er/erRenderer-unified.ts

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  const { securityLevel, er: conf, layout } = getConfig();

  // Extract data from parsed structure into Layout data format
  const data4Layout = diag.db.getData() as LayoutData;

  // Create the root SVG element
  const svg = getDiagramElement(id, securityLevel);

  // Configure layout
  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  data4Layout.config.flowchart!.nodeSpacing = conf?.nodeSpacing || 140;
  data4Layout.config.flowchart!.rankSpacing = conf?.rankSpacing || 80;
  data4Layout.direction = diag.db.getDirection();
  data4Layout.markers = ['only_one', 'zero_or_one', 'one_or_more', 'zero_or_more'];
  data4Layout.diagramId = id;

  // Render using layout algorithm
  await render(data4Layout, svg);

  // Setup viewport
  setupViewPortForSVG(svg, conf.padding, conf.useMaxWidth);
};
```

## Class Diagram Renderer Examples

### Traditional Renderer (v2)

```javascript
// packages/mermaid/src/diagrams/class/classRenderer.js

export const draw = function (text, id, _version, diagObj) {
  const conf = getConfig().class;

  // Create directed graph using graphlib
  const g = new graphlib.Graph({
    multigraph: true,
  });

  g.setGraph({
    isMultiGraph: true,
  });

  // Add classes as nodes
  classes.forEach(function (classDef) {
    const node = svgDraw.drawClass(diagram, classDef, conf, diagObj);
    idCache[node.id] = node;
    g.setNode(node.id, node);
  });

  // Add relationships as edges
  relations.forEach(function (relation) {
    g.setEdge(
      getGraphId(relation.id1),
      getGraphId(relation.id2),
      { relation: relation },
      relation.title || 'DEFAULT'
    );
  });

  // Apply layout
  dagreLayout(g);

  // Position nodes
  g.nodes().forEach(function (v) {
    if (v !== undefined && g.node(v) !== undefined) {
      root
        .select('#' + (diagObj.db.lookUpDomId(v) || v))
        .attr(
          'transform',
          'translate(' +
            (g.node(v).x - g.node(v).width / 2) +
            ',' +
            (g.node(v).y - g.node(v).height / 2) +
            ' )'
        );
    }
  });

  // Draw edges
  g.edges().forEach(function (e) {
    if (e !== undefined && g.edge(e) !== undefined) {
      svgDraw.drawEdge(diagram, g.edge(e), g.edge(e).relation, conf, diagObj);
    }
  });
};
```

### Modern Unified Renderer (v3)

```typescript
// packages/mermaid/src/diagrams/class/classRenderer-v3-unified.ts

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  const { securityLevel, state: conf, layout } = getConfig();

  // Extract data from parsed structure into Layout data format
  const data4Layout = diag.db.getData() as LayoutData;

  // Create the root SVG element
  const svg = getDiagramElement(id, securityLevel);

  // Configure layout settings
  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  data4Layout.nodeSpacing = conf?.nodeSpacing || 50;
  data4Layout.rankSpacing = conf?.rankSpacing || 50;
  data4Layout.markers = ['aggregation', 'extension', 'composition', 'dependency', 'lollipop'];
  data4Layout.diagramId = id;

  // Use unified rendering system
  await render(data4Layout, svg);

  // Add title
  utils.insertTitle(
    svg,
    'classDiagramTitleText',
    conf?.titleTopMargin ?? 25,
    diag.db.getDiagramTitle()
  );

  setupViewPortForSVG(svg, padding, conf?.useMaxWidth);
};
```

## Configuration System Example

### Type-Safe Configuration

```typescript
// packages/mermaid/src/config.type.ts

export interface MermaidConfig {
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  themeVariables?: any;
  startOnLoad?: boolean;
  securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
  deterministicIds?: boolean;
  fontSize?: number;

  // Diagram-specific configurations
  flowchart?: FlowchartDiagramConfig;
  sequence?: SequenceDiagramConfig;
  class?: ClassDiagramConfig;
  state?: StateDiagramConfig;
  er?: ErDiagramConfig;
  // ... other diagram configs
}

export interface FlowchartDiagramConfig extends BaseDiagramConfig {
  diagramPadding?: number;
  htmlLabels?: boolean;
  nodeSpacing?: number;
  rankSpacing?: number;
  curve?: CurveStyle;
  useMaxWidth?: boolean;
  defaultRenderer?: 'dagre-d3' | 'dagre-wrapper' | 'elk';
}
```

### Configuration API

```typescript
// packages/mermaid/src/config.ts

let config: MermaidConfig = assignWithDepth({}, defaultConfig);
let directives: MermaidConfig = {};
let currentConfig: MermaidConfig = assignWithDepth({}, defaultConfig);

export const getConfig = (): MermaidConfig => currentConfig;

export const setConfig = (conf: MermaidConfig): MermaidConfig => {
  updateCurrentConfig(conf);
  return getConfig();
};

export const reset = (): void => {
  config = assignWithDepth({}, defaultConfig);
  directives = {};
  updateCurrentConfig(config);
};

const updateCurrentConfig = (conf: MermaidConfig): void => {
  currentConfig = assignWithDepth({}, config, directives, conf);
};
```

## Web Integration Example

### Simple Usage

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  </head>
  <body>
    <div class="mermaid">
      graph TD A[Start] --> B{Decision} B -->|Yes| C[Action 1] B -->|No| D[Action 2]
    </div>

    <script>
      mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
      });
    </script>
  </body>
</html>
```

### Advanced Programmatic Usage

```javascript
// Advanced integration example
import mermaid from 'mermaid';

// Initialize with configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  sequence: {
    actorMargin: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
  },
});

// Render specific diagram
async function renderDiagram(definition, element) {
  try {
    const { svg } = await mermaid.render('graphDiv', definition);
    element.innerHTML = svg;
  } catch (error) {
    console.error('Error rendering diagram:', error);
  }
}

// Parse and validate before rendering
async function validateAndRender(definition, element) {
  try {
    const parseResult = await mermaid.parse(definition);
    console.log('Valid diagram type:', parseResult.diagramType);

    const { svg } = await mermaid.render('graphDiv', definition);
    element.innerHTML = svg;
  } catch (error) {
    console.error('Invalid diagram syntax:', error);
  }
}
```

## Extension Example: Custom Diagram Type

### Custom Diagram Definition

```typescript
// example-diagram/exampleDiagram.ts
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser: {
    parse: (text: string) => {
      // Custom parsing logic
    },
  },
  get db() {
    return {
      clear: () => {},
      // ... other required DB methods
    };
  },
  renderer: {
    draw: async (text: string, id: string, version: string) => {
      // Custom rendering logic
      const svg = d3.select(`#${id}`);
      // ... create SVG elements
    },
  },
  styles: () => `
    .example-class {
      fill: #ff6b6b;
      stroke: #333;
    }
  `,
};
```

### Registration and Usage

```typescript
// Register custom diagram
import { registerDiagram } from 'mermaid';
import { diagram } from './exampleDiagram.js';

registerDiagram('example', diagram, (text) => text.includes('example'));

// Now can use in text:
const diagramText = `
example
  nodeA --> nodeB
`;
```

This comprehensive set of examples demonstrates how Mermaid's modular architecture enables powerful diagram generation while maintaining extensibility and type safety.
