# Treemap Diagrams

> A treemap diagram displays hierarchical data as a set of nested rectangles.

Treemap diagrams are useful for visualizing hierarchical structures where the size of each rectangle can represent a quantitative value.

## Syntax

The syntax for creating a treemap is straightforward. It uses indentation to define the hierarchy and allows you to specify values for the leaf nodes.

```
treemap
    Root
        Branch 1
            Leaf 1.1: 10
            Leaf 1.2: 15
        Branch 2
            Leaf 2.1: 20
            Leaf 2.2: 25
```

In the example above:
- `Root` is the top-level node
- `Branch 1` and `Branch 2` are children of `Root`
- The leaf nodes (`Leaf 1.1`, etc.) have values specified after a colon

## Examples

### Basic Treemap

```mermaid
treemap
    Root
        Branch 1
            Leaf 1.1: 10
            Leaf 1.2: 15
        Branch 2
            Leaf 2.1: 20
            Leaf 2.2: 25
            Leaf 2.3: 30
```

### Technology Stack Treemap

```mermaid
treemap
    Technology Stack
        Frontend
            React: 35
            CSS: 15
            HTML: 10
        Backend
            Node.js: 25
            Express: 10
            MongoDB: 15
        DevOps
            Docker: 10
            Kubernetes: 15
            CI/CD: 5
```

### Project Resource Allocation

```mermaid
treemap
    Project Resources
        Development
            Frontend: 20
            Backend: 25
            Database: 15
        Testing
            Unit Tests: 10
            Integration Tests: 15
            E2E Tests: 10
        Deployment
            Staging: 5
            Production: 10
```

## Configuration

You can configure the appearance of treemap diagrams in your Mermaid configuration:

```javascript
mermaid.initialize({
  treemap: {
    useMaxWidth: true,
    padding: 10,
    showValues: true,
    nodeWidth: 100,
    nodeHeight: 40,
    borderWidth: 1,
    valueFontSize: 12,
    labelFontSize: 14,
    valueFormat: ','
  }
});
```

Key configuration options:

| Parameter    | Description                                | Default |
|--------------|--------------------------------------------|---------|
| useMaxWidth  | Use available width to scale the diagram   | true    |
| padding      | Padding between nodes                      | 10      |
| showValues   | Show values in leaf nodes                  | true    |
| nodeWidth    | Default width of nodes                     | 100     |
| nodeHeight   | Default height of nodes                    | 40      |
| borderWidth  | Width of node borders                      | 1       |
| valueFontSize| Font size for values                       | 12      |
| labelFontSize| Font size for node labels                  | 14      |
| valueFormat  | Format string for values (D3 format)       | ','     |

## Value Formatting

You can customize how values are displayed in the treemap using the `valueFormat` configuration option. This option primarily uses [D3's format specifiers](https://github.com/d3/d3-format#locale_format) to control how numbers are displayed, with some additional special cases for common formats.

Common format patterns:
- `,` - Thousands separator (default)
- `$` - Add dollar sign
- `.1f` - Show one decimal place
- `.1%` - Show as percentage with one decimal place
- `$0,0` - Dollar sign with thousands separator
- `$.2f` - Dollar sign with 2 decimal places
- `$,.2f` - Dollar sign with thousands separator and 2 decimal places

The treemap diagram supports both standard D3 format specifiers and some common currency formats that combine the dollar sign with other formatting options.

Example with currency formatting:

```mermaid
%%{init: {'treemap': {'valueFormat': '$0,0'}}}%%
treemap
    Budget
        Development
            Frontend: 250000
            Backend: 350000
        Marketing
            Digital: 150000
            Print: 50000
```

Example with percentage formatting:

```mermaid
%%{init: {'treemap': {'valueFormat': '.1%'}}}%%
treemap
    Market Share
        Company A: 0.35
        Company B: 0.25
        Company C: 0.15
        Others: 0.25
```

## Notes and Limitations

- The treemap diagram is designed for hierarchical visualization only
- Deep hierarchies may result in very small rectangles that are difficult to read
- For best results, limit your hierarchy to 3-4 levels
- Values should be provided only for leaf nodes

## Styling

You can style the different elements of the treemap using CSS. The key classes are:

- `.treemapNode` - All nodes
- `.treemapSection` - Non-leaf nodes
- `.treemapLeaf` - Leaf nodes
- `.treemapLabel` - Node labels
- `.treemapValue` - Node values
- `.treemapTitle` - Diagram title
