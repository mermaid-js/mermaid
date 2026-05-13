# Ditaa Diagrams (v<MERMAID_RELEASE_VERSION>+)

Mermaid supports **ditaa** (DIagrams Through Ascii Art), allowing you to convert ASCII art into
polished box-and-arrow diagrams directly inside your Mermaid code blocks.

## Overview

The `ditaa` keyword initiates a ditaa diagram. Everything on subsequent lines is treated as
monospace ASCII art and rendered into an SVG diagram.

```
ditaa
+----------+         +------------+
|          |  https  |            |
|  Client  | <-----> |  Webserver |
|          |         |            |
+----------+         +------------+
```

## Syntax Reference

### Boxes

Boxes are rectangular regions bordered by `+`, `-`, and `|` characters.

| Character | Meaning               |
| --------- | --------------------- |
| `+`       | Corner of a box       |
| `-`       | Horizontal box border |
| `\|`      | Vertical box border   |

```
ditaa
+----------+
|          |
|  My Box  |
|          |
+----------+
```

Text placed inside the border area becomes the label for that box. Multi-line text is supported.

### Rounded Boxes

Use `/` and `\` as corner characters instead of `+` to create rounded-corner boxes:

```
ditaa
/----------\
|          |
| Rounded  |
|          |
\----------/
```

### Dashed / External Boxes

Use `=` for horizontal borders to indicate a dashed (external/storage) box:

```
ditaa
+==========+
|          |
| Database |
|          |
+==========+
```

### Connecting Lines

Lines connect boxes using `-` (horizontal) and `|` (vertical).

```
ditaa
+------+          +------+
|  A   | -------- |  B   |
+------+          +------+
```

**Dashed connectors** use `=` (horizontal) or `:` (vertical):

```
ditaa
+------+          +------+
|  A   | ======== |  B   |
+------+          +------+
```

### Arrows

Add arrow heads with `<`, `>`, `^`, or `v` at the end of a connector line.

| Syntax | Description           |
| ------ | --------------------- |
| `-->`  | Right-pointing arrow  |
| `<--`  | Left-pointing arrow   |
| `<->`  | Bidirectional arrow   |
| `^`    | Up arrow (vertical)   |
| `v`    | Down arrow (vertical) |

```
ditaa
+----------+         +------------+         +-----------+
|          |  https  |            |  http   |   ocis    |
|  Client  | <-----> |  Webserver | <-----> |   proxy   |
|          |         |            |         |  service  |
+----------+         +------------+         +-----------+
                     ^                      ^
                     |                      |
                     |                      |
                 Termination             Unsecured
```

### Free-Floating Text

Any printable text not enclosed in a box and not part of a connector is rendered as a free-floating
label:

```
ditaa
+------+         +------+
|  A   | ------> |  B   |
+------+         +------+
                    |
                   Gateway
```

## Configuration

You can customise the ditaa diagram layout via frontmatter or `%%{init: ...}%%` directives:

```
---
config:
  ditaa:
    cellWidth: 14
    cellHeight: 22
    padding: 12
    boxRounding: 6
---
ditaa
+-------+
|  Box  |
+-------+
```

| Option        | Default | Description                           |
| ------------- | ------- | ------------------------------------- |
| `cellWidth`   | `12`    | SVG pixels per ASCII character column |
| `cellHeight`  | `20`    | SVG pixels per ASCII character row    |
| `padding`     | `10`    | Outer padding around the diagram      |
| `boxRounding` | `4`     | Corner radius for rounded boxes       |
| `useMaxWidth` | `true`  | Scale diagram to available width      |

## Theme Support

Ditaa diagrams respect the active Mermaid theme:

```
---
config:
  theme: dark
---
ditaa
+----------+
|          |
|  Client  |
|          |
+----------+
```

Available themes: `default`, `dark`, `forest`, `neutral`, `base`.

## Grid Alignment

> [!IMPORTANT]
> Ditaa requires **monospace alignment**. Every character column must line up vertically across
> rows for boxes and connectors to be detected correctly. Use a monospace font in your editor and
> avoid mixing tab characters with spaces.

## Tips

- Keep all characters in a fixed-width grid (e.g., use spaces for padding).
- Box interiors can contain multiple lines of text — each is centred automatically.
- Connectors can start/end at box borders or at arbitrary grid positions.
- Use `%%` to add comments (Mermaid strips these before parsing).
