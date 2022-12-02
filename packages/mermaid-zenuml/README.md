# ZenUML Support

This package contains the support for [ZenUML](https://zenuml.com) in mermaid.
ZenUML is an opensource diagram-as-code tool for creating sequence diagrams.
The source code for the core renderer is https://github.com/ZenUml/core.

## Audience

This document is for developers who want to contribute to the mermaid-zenuml package.

## Development

Follow the instructions in the [mermaid CONTRIBUTING.md](../../CONTRIBUTING.md) file.

## Implementation

This section describes the high-level implementation logic of the mermaid-zenuml package:

1. What is the structure of the mermaid-zenuml package?
2. How the new diagram type is registered?
3. How the diagram is parsed?
4. How the diagram is rendered?

With the improvement of our understanding of mermaid architecture, this section will
be updated as we may have further goals such as API alignment.

### Structure

The mermaid-example-diagram package has the following structure:

1. A parser that defines the DSL
2. A diagram definition that defines the diagram type, no business logic
3. A detector that matches the name of the diagram type. It exports two functions:
   1. `detector(text: string)` that matches the name of the diagram type
   2. `loadDiagram()` that returns the diagram definition
4. A renderer that expose `draw(text, id, version, diagramObj)` function:
   1. `text` is the DSL
   2. `id` is to locate the DOM element where the diagram is rendered
   3. `version` is not used
   4. `diagramObj` is the diagram definition (see below)
5. It also has a few other files which is less important in this context, such as
   exampleDiagramDb.js, mermaidUtils.ts, styles.js.

```javascript
// diagram-definition.ts
export const diagram = {
  db: mindmapDb,
  renderer: mindmapRenderer,
  parser: mindmapParser,
  styles: mindmapStyles,
  injectUtils,
};
```

### How the new diagram type is registered?

The diagram types are registered at `src/packages/mermaid/src/diagram-api/diagram-orchestration.js`.

```javascript
registerDiagram(
  'zenuml', // diagram type name used to match the diagram type
  {
    // ZenUML manage parsing internally, so we stub the parser and db with dummy objects
    parser: { parser: { yy: {} }, parse: () => {} },
    db: { clear: () => {} },
    renderer: zenumlRenderer,
    styles: zenumlStyles,
    init: (cnf) => {},
  },
  zenumlDetector
);
```

### How the diagram is parsed?

ZenUML manage parsing internally. It uses antlr4 to parse the DSL. The parser is
defined in `https://github.com/ZenUml/core/blob/main/src/parser/index.js`.

### How the diagram is rendered?

The renderer uses `@zenuml/core` to render the diagram. Please find the source code at
`src/packages/mermaid-zenuml/zenumlRenderer.js`.

ZenUML has dependency on `vue` v2 and `vuex`.

```javascript
import ZenUml from '@zenuml/core';
import '@zenuml/core/dist/zenuml/core.css';

export const draw = async (text, id, version, diagObj) => {
  // ...
  const zenuml = new ZenUml(app); // app is a normal dom element
  await zenuml.render(text, 'default');
  // ...
};
```
