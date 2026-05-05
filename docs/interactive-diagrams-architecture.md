# Interactive, Parameterised Mermaid Diagrams: Requirements & Architecture

## Objective

Enable reusable, interactive Mermaid diagrams via a declarative template and interaction syntax, processed by a preprocessor and enhanced with post-render JS.

## Requirements

### Functional

- Author diagrams using extended syntax:
  - Template definitions and invocations
  - Interaction blocks for nodes/edges (collapsible, tooltip, etc.)
- Preprocessor expands templates and interactions to standard Mermaid + metadata
- Post-render JS adds interactivity (collapsing, tooltips)
- Static fallback: diagrams render as standard Mermaid if JS is unavailable
- No manual JS required by authors
- Markdown and documentation-first workflow support

### Non-Functional

- Backward compatible with Mermaid
- Clean degradation for static exports (SVG/PNG/PDF)
- Simple, declarative authoring
- No Mermaid core fork required

## Architecture

```
Extended Mermaid Syntax
        |
        v
Template & Interaction Preprocessor
        |
        v
Standard Mermaid + Metadata
        |
        v
Mermaid Renderer
        |
        v
Post-render JS Binder
        |
        v
Interactive SVG/HTML Output
```

### Components

- **Preprocessor**: Node.js CLI/lib, parses extended syntax, outputs standard Mermaid with metadata (e.g., comments or data attributes)
- **JS Binder**: Small JS file, scans rendered SVG/HTML, applies interactivity based on metadata
- **Authoring**: Markdown/HTML with extended syntax, processed before rendering

## Key Scenarios

- Collapsible groups/nodes
- Tooltips on nodes/edges
- Parameterised, reusable diagram templates

## Compatibility

- Markdown renderers: Yes (with preprocessor)
- GitHub/GitLab: Static only
- MkDocs/Docusaurus: Full (with JS)
- Static export: Standard Mermaid only

## Risks & Limitations

- No native support in Mermaid core
- Interactivity only where JS is allowed
- Static exports lose interactivity

## Next Steps

1. Design extended syntax and preprocessor spec
2. Implement minimal preprocessor
3. Implement JS binder
4. Create examples and documentation
