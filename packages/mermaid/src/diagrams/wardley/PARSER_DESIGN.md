# Wardley Map Parser Design Decision

## Executive Summary

The Wardley diagram implementation uses **@mermaid-js/parser** with a **Langium-based grammar** rather than a custom Jison parser. This decision provides significant advantages in maintainability, consistency, and alignment with the broader Mermaid ecosystem.

## Parser Architecture Overview

### Current Implementation

```
Input (Wardley DSL)
       ↓
Langium Grammar (wardley.langium)
       ↓
@mermaid-js/parser (Langium-based)
       ↓
AST (Abstract Syntax Tree)
       ↓
populateDb() - Database population
       ↓
WardleyDB (Data model)
       ↓
wardleyRenderer.draw() - Visualization
```

### Grammar Definition

The Wardley syntax is defined in Langium, a domain-specific language for creating parsers:

```langium
grammar Wardley
  "wardleyMap"
  (TitleAndAccessibilities | WardleyComponent | WardleyAnchor |
   WardleyEdge | WardleyFlowEdge | WardleyConstraintEdge |
   WardleyEvolve | WardleyPipeline | WardleyNote | WardleyAnnotation |
   WardleyArea | WardleySubmap | WardleyAccelerator |
   WardleyXAxis | WardleyYAxis)*

WardleyComponent:
  "component" id=ID label=STRING coords=Coordinates
    (componentType=("market"|"ecosystem"))?
    (inertia?="inertia")? (sourcing=("build"|"buy"|"outsource"))?
    ("label" labelOffset=LabelOffset)?

WardleyAnchor:
  "anchor" id=ID label=STRING coords=Coordinates

WardleyEdge:
  source=ID "->" target=ID (";" annotation=STRING)?

WardleyFlowEdge:
  source=ID "+>" target=ID (";" annotation=STRING)?

WardleyConstraintEdge:
  source=ID "=>" target=ID

WardleyEvolve:
  "evolve" id=ID ("->" targetLabel=ID)? value=NUMBER

WardleyPipeline:
  "pipeline" id=ID label=STRING coords=PipelineCoords "{" children+=PipelineChild* "}"

WardleyNote:
  "note" text=STRING coords=Coordinates

WardleyAnnotation:
  "annotation" number=NUMBER text=STRING target=ID

WardleyArea:
  areaType=("pioneers"|"settlers"|"townplanners"|"interest")
    label=STRING "[" x1=NUMBER "," y1=NUMBER "," x2=NUMBER "," y2=NUMBER "]"

WardleySubmap:
  "submap" id=ID label=STRING coords=Coordinates "ref" ref=STRING

WardleyAccelerator:
  accelType=("accelerator"|"deaccelerator") target=ID

WardleyXAxis:
  "xAxis" labels+=STRING ("," labels+=STRING)*

WardleyYAxis:
  "yAxis" labels+=STRING ("," labels+=STRING)*
```

## Justification: @mermaid-js/parser (Langium) vs Jison

### Advantages of @mermaid-js/parser (Langium)

#### 1. **Ecosystem Consistency**

- **Unified approach**: All modern Mermaid diagram types use Langium grammars in the new @mermaid-js/parser
- **Maintainability**: Single parser codebase for all diagrams, shared tooling and infrastructure
- **Future-proof**: Mermaid is actively migrating away from Jison towards Langium for all diagram types

#### 2. **Language Design Features**

- **Declarative syntax**: Grammar rules are more readable and maintainable than imperative Jison actions
- **Type safety**: Langium generates strongly-typed AST nodes, reducing runtime errors
- **IDE support**: Better tooling for grammar development and debugging
- **Language composition**: Langium supports grammar imports and inheritance (used for common rules)

#### 3. **Error Handling & Diagnostics**

- **Detailed error messages**: Built-in position tracking and meaningful error reports
- **Recovery**: Langium's error recovery mechanisms provide graceful degradation
- **Validation**: Can define validation rules separate from grammar rules
- **Line/column information**: Automatic preservation of source locations for debugging

#### 4. **Maintainability**

- **Separation of concerns**: Grammar is separate from semantic actions (populateDb)
- **No action code in grammar**: Grammar stays focused on syntax, not business logic
- **Easier refactoring**: Changes to data structures don't require grammar modifications
- **Standard format**: Langium is becoming the Mermaid standard

#### 5. **Performance**

- **Optimized parsing**: Langium generates optimized parsers
- **No regex limitations**: Proper tokenization and state management
- **Streaming capable**: Can handle large inputs efficiently
- **Compiled parser**: Static analysis and code generation for better performance

#### 6. **Extensibility**

- **Grammar reuse**: Common elements (TitleAndAccessibilities, coordinates) are imported from common grammar
- **Minimal duplication**: Shared parsing rules reduce code duplication
- **Version compatibility**: Parser updates handled centrally by Mermaid team

### Why Not Jison?

#### 1. **Legacy Status**

- **Maintenance burden**: Jison parsers require manual action code, increasing complexity
- **Declining adoption**: Mermaid is systematically migrating away from Jison
- **Syntax overhead**: Jison mixes grammar with JavaScript actions, reducing readability

#### 2. **Integration Challenges**

- **Separate parsers**: Each Jison parser needs its own build process and maintenance
- **Duplication**: No grammar reuse across diagram types
- **Inconsistent errors**: Different error handling across parsers
- **Build complexity**: Jison preprocessing adds build steps

#### 3. **Development Experience**

- **Harder to debug**: Grammar and actions mixed together make tracing difficult
- **Limited tooling**: Fewer IDE extensions and development tools for Jison
- **Steeper learning curve**: New contributors need to learn Jison syntax

#### 4. **Type Safety**

- **Dynamic typing**: Jison uses JavaScript throughout, losing type information
- **Runtime errors**: Type mismatches discovered only during execution
- **No IDE support**: Can't use TypeScript for grammar validation

## Implementation Details

### Parser Entry Point (wardleyParser.ts)

```typescript
import { parse } from '@mermaid-js/parser';
import type { Wardley } from '@mermaid-js/parser';

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Wardley = await parse('wardley', input);
    populateDb(ast, db);
  },
};
```

### Data Flow

1. **Input Validation**: Check for non-empty string input
2. **Grammar Parsing**: @mermaid-js/parser handles Langium parsing
3. **AST Generation**: Returns structured `Wardley` object with:
   - `components`: Array of WardleyComponent objects (with type, inertia, sourcing, labelOffset)
   - `anchors`: Array of WardleyAnchor objects
   - `edges`: Array of WardleyEdge objects (dependency arrows)
   - `flowEdges`: Array of WardleyFlowEdge objects (`+>` arrows)
   - `constraintEdges`: Array of WardleyConstraintEdge objects (`=>` arrows)
   - `evolves`: Array of WardleyEvolve objects (with optional targetLabel for rename)
   - `pipelines`: Array of WardleyPipeline objects with children
   - `notes`: Array of WardleyNote objects
   - `annotations`: Array of WardleyAnnotation objects
   - `areas`: Array of WardleyArea objects (pioneers, settlers, townplanners, interest)
   - `submaps`: Array of WardleySubmap objects
   - `accelerators`: Array of WardleyAccelerator objects
   - `xAxis`, `yAxis`: Custom axis label definitions
   - `title`, `accTitle`, `accDescr`: Metadata
4. **Semantic Processing**: populateDb() validates and populates database
5. **Error Handling**: Comprehensive try-catch with logging

### AST Structure

The parser generates a strongly-typed AST. The full set of entity types is defined in `types.ts`:

```typescript
// Component types: 'standard' | 'anchor' | 'market' | 'ecosystem'
// Sourcing strategies: 'build' | 'buy' | 'outsource'
// Edge types: 'dependency' | 'flow' | 'constraint'
// Area types: 'pioneers' | 'settlers' | 'townplanners' | 'interest'
// Accelerator types: 'accelerator' | 'deaccelerator'

interface WardleyComponent {
  id: string;
  label: string;
  x: number;
  y: number;
  type: ComponentType;
  inertia: boolean;
  sourcing?: SourcingStrategy;
  labelOffset?: { dx: number; dy: number };
}

interface WardleyEdge {
  source: string;
  target: string;
  type: EdgeType;
  annotation?: string;
}

interface WardleyEvolution {
  sourceId: string;
  targetX: number;
  targetLabel?: string;
}

interface WardleyPipeline {
  id: string;
  label: string;
  x: number;
  y: number;
  startX: number;
  endX: number;
  children: WardleyPipelineChild[];
}

interface WardleyNote {
  text: string;
  x: number;
  y: number;
}
interface WardleyAnnotation {
  number: number;
  text: string;
  targetId: string;
}
interface WardleyArea {
  label: string;
  areaType: AreaType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface WardleySubmap {
  id: string;
  label: string;
  x: number;
  y: number;
  ref: string;
}
interface WardleyAccelerator {
  targetId: string;
  type: AcceleratorType;
}
```

## Validation Strategy

Rather than embedding validation in the parser, validation is handled in the semantic layer:

### Parser Level (Langium)

- Syntax validation: Grammar rules enforce structure
- Type checking: Coordinate values must be numbers
- Required fields: ID and label are mandatory

### Semantic Level (populateDb)

- Range validation: Coordinates clamped to [0, 1]
- Existence validation: Edges reference valid components
- Consistency validation: No duplicate edges or self-loops
- Evolution clamping: Values clamped to [0, 1]

This separation allows grammar to remain simple while data validation is flexible and maintainable.

## Migration Path from Jison (If Applicable)

If this diagram had previously used Jison, the migration process would be:

1. **Create Langium grammar**: Define syntax rules (already done)
2. **Generate parser**: Langium compilation handled by build system
3. **Update parser file**: Change imports from jison to @mermaid-js/parser
4. **Adapt populateDb**: Handle the structured AST instead of parser callbacks
5. **Update tests**: Adjust test utilities for new parser interface

## Testing Implications

### Unit Tests

- Test Langium grammar rules directly through AST validation
- Test populateDb() with mock AST objects
- Test semantic validation independently from parsing

### Integration Tests

- Parse complete diagrams and validate database state
- Test error cases with invalid syntax and invalid data
- Verify error messages and recovery

### Current Test Coverage

- **38 unit tests** (`wardley.spec.ts`): Database operations, config, themes, label layout, validation
- **31 integration tests** (`wardley.integration.spec.ts`): Full parse pipeline for all entity types (anchors, markets, ecosystems, inertia, sourcing, flow/constraint edges, evolve with rename, pipelines, notes, annotations, areas, submaps, accelerators, custom axis labels, accessibility, complex diagrams)
- **13 renderer tests** (`wardleyRenderer.spec.ts`): Component colors, theme integration, canvas sizing, label style, marker scoping
- **~82 total tests**

All tests use the @mermaid-js/parser, ensuring the entire system is validated.

## Future Considerations

### Potential Enhancements

1. **Custom validation rules**: Add Langium validation layer
2. **Diagnostic reports**: Leverage Langium's diagnostic system
3. **Grammar composition**: Reuse rules from other diagram types
4. **Performance optimization**: Langium code generation optimizations

### Long-term Alignment

- **Mermaid direction**: All diagrams moving to Langium
- **Ecosystem consistency**: Unified parser experience
- **Tool ecosystem**: Better IDE support and debugging tools

## Conclusion

The choice of **@mermaid-js/parser with Langium** is the correct strategic decision for several reasons:

1. **Strategic alignment**: Matches Mermaid's direction and ecosystem
2. **Technical superiority**: Better error handling, type safety, and extensibility
3. **Maintainability**: Simpler code, clearer separation of concerns
4. **Consistency**: Unified approach across all Mermaid diagram types
5. **Future-proof**: Langium is actively developed and adopted

The parser implementation successfully:

- ✅ Parses valid Wardley diagram syntax correctly
- ✅ Provides detailed error messages for invalid input
- ✅ Maintains a clean separation between parsing and semantic processing
- ✅ Integrates seamlessly with the broader Mermaid ecosystem
- ✅ Supports comprehensive testing and validation

This design ensures that the Wardley diagram implementation is maintainable, extensible, and aligned with the long-term direction of the Mermaid project.
