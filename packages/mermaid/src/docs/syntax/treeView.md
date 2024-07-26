# TreeView Diagram (v<MERMAID_RELEASE_VERSION>+)

## Introduction

A TreeView diagram is used to represent hierarchical data in the form of a directory-like structure.

## Syntax

The structure of the tree depends only on indentation.

```
treeView-beta
    <folder name>
        <file name>
        <folder name>
            <file name>
    <file-name>
```

## Examples

```mermaid-example
treeView-beta
    packages
        mermaid
            src
        parser
```

```mermaid-example
---
config:
    treeView:
        rowIndent: 5
    themeVariables:
        treeView:
            fontSize: '20px'
---
treeView-beta
    packages
        mermaid
            src
        parser
```

## Config Variables

| Property      | Description               | Default Value |
| ------------- | ------------------------- | ------------- |
| rowIndent     | Indentation for each row  | 10            |
| paddingX      | Horizontal padding of row | 5             |
| paddingY      | Vertical padding of row   | 5             |
| lineThickness | Thickness of the line     | 1             |

### Theme Variables

| Property  | Description            | Default Value |
| --------- | ---------------------- | ------------- |
| fontSize  | Font size of the label | '16px'        |
| lineColor | Color of the line      | 'black'       |
