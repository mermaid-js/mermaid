# @mermaid-js/examples

The `@mermaid-js/examples` package contains a collection of examples used by tools like [mermaid.live](https://mermaid.live) to help users get started with new diagrams.

You can duplicate an existing diagram example file, e.g., `packages/examples/src/examples/flowchart.ts`, and modify it with details specific to your diagram.

Then, import the example in the `packages/examples/src/index.ts` file and add it to the `examples` array.

Each diagram should have at least one example, which should be marked as the default. It's a good idea to add more examples to showcase different features of the diagram.

## Usage

```bash
pnpm add @mermaid-js/examples
```

A sample usage of the package in mermaid.live, to get the default example for every diagram type:

```ts
import { diagramData } from '@mermaid-js/examples';

type DiagramDefinition = (typeof diagramData)[number];

const isValidDiagram = (diagram: DiagramDefinition): diagram is Required<DiagramDefinition> => {
  return Boolean(diagram.name && diagram.examples && diagram.examples.length > 0);
};

export const getSampleDiagrams = () => {
  const diagrams = diagramData
    .filter((d) => isValidDiagram(d))
    .map(({ examples, ...rest }) => ({
      ...rest,
      example: examples?.filter(({ isDefault }) => isDefault)[0],
    }));
  const examples: Record<string, string> = {};
  for (const diagram of diagrams) {
    examples[diagram.name.replace(/ (Diagram|Chart|Graph)/, '')] = diagram.example.code;
  }
  return examples;
};
```
