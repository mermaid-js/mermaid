# C4 diagram feature matrix

An exhaustive map of the C4 grammar's feature surface, derived from
`parser/c4Diagram.jison`, with the characterization test that exercises each feature. This is the
coverage baseline for migrating the C4 renderer onto the unified rendering pipeline layer by
layer (shapes -> edges -> layout): every feature below has a focused diagram in
`cypress/integration/rendering/c4/c4-characterization.spec.js`, so each migration step's visual
impact is explicit in the visual-regression suite, and nothing silently regresses.

Legend: **Test** = the `CHAR.*` case in the characterization spec.

## Diagram types

| Type           | Syntax                                    | Test                                    |
| -------------- | ----------------------------------------- | --------------------------------------- |
| System Context | `C4Context`                               | CHAR.\* (most)                          |
| Container      | `C4Container`                             | CHAR.container, CHAR.boundary-system    |
| Component      | `C4Component`                             | CHAR.component, CHAR.boundary-container |
| Dynamic        | `C4Dynamic` (numbered steps)              | CHAR.dynamic                            |
| Deployment     | `C4Deployment` (nested `Deployment_Node`) | CHAR.deployment                         |

## Elements

| Element         | Variants                                                                                               | Test                                     |
| --------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Person          | `Person`, `Person_Ext`                                                                                 | CHAR.person                              |
| System          | `System`, `System_Ext`, `SystemDb`, `SystemDb_Ext`, `SystemQueue`, `SystemQueue_Ext`                   | CHAR.system                              |
| Container       | `Container`, `Container_Ext`, `ContainerDb`, `ContainerDb_Ext`, `ContainerQueue`, `ContainerQueue_Ext` | CHAR.container                           |
| Component       | `Component`, `Component_Ext`, `ComponentDb`, `ComponentDb_Ext`, `ComponentQueue`, `ComponentQueue_Ext` | CHAR.component                           |
| Deployment node | `Deployment_Node` (alias `Node`, `Node_L`, `Node_R`)                                                   | CHAR.deployment, CHAR.deployment-aliases |

Visual conventions in the current renderer: `*Db` renders as a (vertical) cylinder, `*Queue` as
a (horizontal) pipe, `*_Ext` as the same shape with the "external" palette colour, `Person` as a
figure with a silhouette. The unified migration must preserve these distinctions (with `external`
treated as a tag-style per RFC #7844, not a separate shape).

## Boundaries

| Boundary        | Syntax                       | Test                     |
| --------------- | ---------------------------- | ------------------------ |
| Enterprise      | `Enterprise_Boundary`        | CHAR.boundary-enterprise |
| System          | `System_Boundary`            | CHAR.boundary-system     |
| Container       | `Container_Boundary`         | CHAR.boundary-container  |
| Generic (typed) | `Boundary(id, label, type)`  | CHAR.boundary-generic    |
| Nested          | boundaries within boundaries | CHAR.boundary-nested     |

## Relationships

| Relationship             | Syntax                             | Test                                      |
| ------------------------ | ---------------------------------- | ----------------------------------------- |
| Default                  | `Rel`                              | CHAR.rel-directions, CHAR.rel-techn-descr |
| Directional              | `Rel_U`, `Rel_D`, `Rel_L`, `Rel_R` | CHAR.rel-directions                       |
| Bidirectional            | `BiRel`                            | CHAR.rel-bidirectional                    |
| Back                     | `Rel_Back`                         | CHAR.rel-back                             |
| Technology + description | `Rel(a, b, label, techn)`          | CHAR.rel-techn-descr                      |

## Styling and layout macros

| Macro              | Syntax                                                                    | Test                                                 |
| ------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| Element style      | `UpdateElementStyle($bgColor, $fontColor, $borderColor, $shape, $sprite)` | CHAR.update-element-style, CHAR.update-element-shape |
| Relationship style | `UpdateRelStyle($textColor, $lineColor, $offsetX, $offsetY)`              | CHAR.update-rel-style                                |
| Layout config      | `UpdateLayoutConfig($c4ShapeInRow, $c4BoundaryInRow)`                     | CHAR.update-layout-config                            |

## Element attributes

| Attribute                | Syntax                            | Test                                      |
| ------------------------ | --------------------------------- | ----------------------------------------- |
| Tags                     | `$tags="..."`                     | CHAR.tags                                 |
| Link                     | `$link="..."`                     | CHAR.link                                 |
| Sprite                   | `$sprite="..."`                   | CHAR.sprite                               |
| Technology / description | positional `techn` / `descr` args | CHAR.rel-techn-descr, CHAR.descr-wrapping |
| Description wrapping     | long `descr` strings wrap         | CHAR.descr-wrapping                       |

## Notes for the unified migration (RFC #7844 target)

- `external` becomes a conventional, overridable **tag** (default style), not a privileged
  keyword/shape; legacy `*_Ext` keywords stay accepted as input and map onto that tag style.
- Relationships are unidirectional, labelled and dashed; technology is shown only on
  container/component/deployment elements.
- An auto-generated legend is part of the target design (on by default, opt-out).
- The final legacy-syntax output must be visually consistent with the `c4-beta` output.
