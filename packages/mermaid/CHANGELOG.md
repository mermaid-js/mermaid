# mermaid

## 11.5.0

### Minor Changes

- [#6187](https://github.com/mermaid-js/mermaid/pull/6187) [`7809b5a`](https://github.com/mermaid-js/mermaid/commit/7809b5a93fae127f45727071f5ff14325222c518) Thanks [@ashishjain0512](https://github.com/ashishjain0512)! - Flowchart new syntax for node metadata bugs

  - Incorrect label mapping for nodes when using `&`
  - Syntax error when `}` with trailing spaces before new line

- [#6136](https://github.com/mermaid-js/mermaid/pull/6136) [`ec0d9c3`](https://github.com/mermaid-js/mermaid/commit/ec0d9c389aa6018043187654044c1e0b5aa4f600) Thanks [@knsv](https://github.com/knsv)! - Adding support for animation of flowchart edges

- [#6373](https://github.com/mermaid-js/mermaid/pull/6373) [`05bdf0e`](https://github.com/mermaid-js/mermaid/commit/05bdf0e20e2629fe77513218fbd4e28e65f75882) Thanks [@ashishjain0512](https://github.com/ashishjain0512)! - Upgrade Requirement and ER diagram to use the common renderer flow

  - Added support for directions
  - Added support for hand drawn look

- [#6371](https://github.com/mermaid-js/mermaid/pull/6371) [`4d25cab`](https://github.com/mermaid-js/mermaid/commit/4d25caba8e65df078966a283e7e0ae1200bef595) Thanks [@knsv](https://github.com/knsv)! - The arrowhead color should match the color of the edge. Creates a unique clone of the arrow marker with the appropriate color.

### Patch Changes

- [#6064](https://github.com/mermaid-js/mermaid/pull/6064) [`2a91849`](https://github.com/mermaid-js/mermaid/commit/2a91849a38641e97ed6b20cb60aa4506d1b63177) Thanks [@NicolasNewman](https://github.com/NicolasNewman)! - fix: architecture diagrams no longer grow to extreme heights due to conflicting alignments

- [#6198](https://github.com/mermaid-js/mermaid/pull/6198) [`963efa6`](https://github.com/mermaid-js/mermaid/commit/963efa64c794466dcd0f06bad6de6ba554d05a54) Thanks [@ferozmht](https://github.com/ferozmht)! - Fixes for consistent edge id creation & handling edge cases for animate edge feature

- [#6196](https://github.com/mermaid-js/mermaid/pull/6196) [`127bac1`](https://github.com/mermaid-js/mermaid/commit/127bac1147034d8a8588cc8f7870abe92ebc945e) Thanks [@knsv](https://github.com/knsv)! - Fix for issue #6195 - allowing @ signs inside node labels

- [#6212](https://github.com/mermaid-js/mermaid/pull/6212) [`90bbf90`](https://github.com/mermaid-js/mermaid/commit/90bbf90a83bf5da53fc8030cf1370bc8238fa4aa) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - fix: `mermaidAPI.getDiagramFromText()` now returns a new different db for each class diagram

- [#6218](https://github.com/mermaid-js/mermaid/pull/6218) [`232e60c`](https://github.com/mermaid-js/mermaid/commit/232e60c8cbaea804e6d98aa90f90d1ce76730e17) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - fix: revert state db to resolve getData returning empty nodes and edges

- [#6250](https://github.com/mermaid-js/mermaid/pull/6250) [`9cad3c7`](https://github.com/mermaid-js/mermaid/commit/9cad3c7aea3bbbc61495b23225ccff76d312783f) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - `mermaidAPI.getDiagramFromText()` now returns a new db instance on each call for state diagrams

- [#6293](https://github.com/mermaid-js/mermaid/pull/6293) [`cfd84e5`](https://github.com/mermaid-js/mermaid/commit/cfd84e54d502f4d36a35b50478121558cfbef2c4) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - Added versioning to StateDB and updated tests and diagrams to use it.

- [#6161](https://github.com/mermaid-js/mermaid/pull/6161) [`6cc31b7`](https://github.com/mermaid-js/mermaid/commit/6cc31b74530baa6d0f527346ab1395b0896bb3c2) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - fix: `mermaidAPI.getDiagramFromText()` now returns a new different db for each flowchart

- [#6272](https://github.com/mermaid-js/mermaid/pull/6272) [`ffa7804`](https://github.com/mermaid-js/mermaid/commit/ffa7804af0701b3d044d6794e36bd9132d6c7e8d) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - fix: `mermaidAPI.getDiagramFromText()` now returns a new different db for each sequence diagram. Added unique IDs for messages.

- [#6205](https://github.com/mermaid-js/mermaid/pull/6205) [`32a68d4`](https://github.com/mermaid-js/mermaid/commit/32a68d489ed83a5b79f516d6b2fb3a7505c5eb24) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - fix: Gantt, Sankey and User Journey diagram are now able to pick font-family from mermaid config.

- [#6295](https://github.com/mermaid-js/mermaid/pull/6295) [`da6361f`](https://github.com/mermaid-js/mermaid/commit/da6361f6527918b4b6a9c07cc9558cf2e2c709d2) Thanks [@omkarht](https://github.com/omkarht)! - fix: `getDirection` and `setDirection` in `stateDb` refactored to return and set actual direction

- [#6185](https://github.com/mermaid-js/mermaid/pull/6185) [`3e32332`](https://github.com/mermaid-js/mermaid/commit/3e32332814c659e7ed1bb73d4a26ed4e61b77d59) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - `mermaidAPI.getDiagramFromText()` now returns a new different db for each state diagram

## 11.4.1

### Patch Changes

- [#6059](https://github.com/mermaid-js/mermaid/pull/6059) [`01b5079`](https://github.com/mermaid-js/mermaid/commit/01b5079562ec8d34ce9964910f168873843c68f8) Thanks [@knsv](https://github.com/knsv)! - fix: Kanban diagrams will not render when adding a number as ticket id or assigned for a task

- [#6038](https://github.com/mermaid-js/mermaid/pull/6038) [`1388662`](https://github.com/mermaid-js/mermaid/commit/1388662132cc829f9820c2e9970ae04e2dd90588) Thanks [@knsv](https://github.com/knsv)! - fix: Intersection calculations for tilted cylinder/DAS when using handdrawn look. Some random seeds could cause the calculations to break.

- [#6079](https://github.com/mermaid-js/mermaid/pull/6079) [`fe3cffb`](https://github.com/mermaid-js/mermaid/commit/fe3cffbb673a25b81989aacb06e5d0eda35326db) Thanks [@aloisklink](https://github.com/aloisklink)! - Bump dompurify to `^3.2.1`. This removes the need for `@types/dompurify`.

## 11.4.0

### Minor Changes

- [#5999](https://github.com/mermaid-js/mermaid/pull/5999) [`742ad7c`](https://github.com/mermaid-js/mermaid/commit/742ad7c130964df1fb5544e909d9556081285f68) Thanks [@knsv](https://github.com/knsv)! - Adding Kanban board, a new diagram type

- [#5880](https://github.com/mermaid-js/mermaid/pull/5880) [`bdf145f`](https://github.com/mermaid-js/mermaid/commit/bdf145ffe362462176d9c1e68d5f3ff5c9d962b0) Thanks [@yari-dewalt](https://github.com/yari-dewalt)! - Class diagram changes:

  - Updates the class diagram to the new unified way of rendering.
  - Includes a new "classBox" shape to be used in diagrams
  - Other updates such as:
    - the option to hide the empty members box in class diagrams,
    - support for handDrawn look,
    - the introduction of the classDef statement into class diagrams,
    - support for styling the default class,
    - support lollipop interfaces.
  - Includes fixes / additions for #5562 #3139 and #4037

### Patch Changes

- [#5937](https://github.com/mermaid-js/mermaid/pull/5937) [`17b7831`](https://github.com/mermaid-js/mermaid/commit/17b783135f9b2b7748b620dbf81d0f56ab4755f1) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - fix: Jagged edge fix for icon shape

- [#5933](https://github.com/mermaid-js/mermaid/pull/5933) [`72d60d2`](https://github.com/mermaid-js/mermaid/commit/72d60d2633584eb59bccdb6cf30b9522db645db2) Thanks [@remcohaszing](https://github.com/remcohaszing)! - Add missing TypeScript dependencies

- [#5937](https://github.com/mermaid-js/mermaid/pull/5937) [`17b7831`](https://github.com/mermaid-js/mermaid/commit/17b783135f9b2b7748b620dbf81d0f56ab4755f1) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - fix: Icon color fix for colored icons.

- [#6002](https://github.com/mermaid-js/mermaid/pull/6002) [`5fabd41`](https://github.com/mermaid-js/mermaid/commit/5fabd414fbee01e43bf6c900907ffc1511ca7440) Thanks [@aloisklink](https://github.com/aloisklink)! - fix: error `mermaid.parse` on an invalid shape, so that it matches the errors thrown by `mermaid.render`

## 11.3.0

### Minor Changes

- [#5825](https://github.com/mermaid-js/mermaid/pull/5825) [`9e3aa70`](https://github.com/mermaid-js/mermaid/commit/9e3aa705ae21fd4898504ab22d775a9e437b898e) Thanks [@ashishjain0512](https://github.com/ashishjain0512)! - New Flowchart Shapes (with new syntax)

### Patch Changes

- [#5849](https://github.com/mermaid-js/mermaid/pull/5849) [`6c5b7ce`](https://github.com/mermaid-js/mermaid/commit/6c5b7ce9f41c0fbd59fe03dbefc8418d97697f0a) Thanks [@ReneLombard](https://github.com/ReneLombard)! - Fixed an issue when the mermaid classdiagram crashes when adding a . to the namespace.
  Forexample

  ```mermaid

  classDiagram
    namespace Company.Project.Module {
      class GenericClass~T~ {
        +addItem(item: T)
        +getItem() T
      }
    }
  ```

- [#5914](https://github.com/mermaid-js/mermaid/pull/5914) [`de2c05c`](https://github.com/mermaid-js/mermaid/commit/de2c05cd5463af68d19dd7b6b3f1303d69ddb2dd) Thanks [@aloisklink](https://github.com/aloisklink)! - Ban DOMPurify v3.1.7 as a dependency

## 11.2.1

### Patch Changes

- [#5856](https://github.com/mermaid-js/mermaid/pull/5856) [`bfd8c63`](https://github.com/mermaid-js/mermaid/commit/bfd8c63daaa8420e57da9953922b9f0c94123064) Thanks [@knsv](https://github.com/knsv)! - Fix for issue with calculation of label width when using in firefox

## 11.2.0

### Minor Changes

- [#5831](https://github.com/mermaid-js/mermaid/pull/5831) [`64abf29`](https://github.com/mermaid-js/mermaid/commit/64abf29ea870eaa47148197f95ce714f85bd7eea) Thanks [@sidharthv96](https://github.com/sidharthv96)! - feat: Return parsed config from mermaid.parse

### Patch Changes

- [#5838](https://github.com/mermaid-js/mermaid/pull/5838) [`5e75320`](https://github.com/mermaid-js/mermaid/commit/5e75320d49eab65aca630dcc3c04c8d620a8bbf7) Thanks [@bollwyvl](https://github.com/bollwyvl)! - fix: Replace $root with relative paths

## 11.1.1

### Patch Changes

- [#5828](https://github.com/mermaid-js/mermaid/pull/5828) [`4c43d21`](https://github.com/mermaid-js/mermaid/commit/4c43d21196f784b6f483ae635fc462329f3d176f) Thanks [@knsv](https://github.com/knsv)! - fix: Fix for issue where self-loops in the root of diagrams break the rendering

## 11.1.0

### Minor Changes

- [#5793](https://github.com/mermaid-js/mermaid/pull/5793) [`6ecdf7b`](https://github.com/mermaid-js/mermaid/commit/6ecdf7be688efdc53c52fea3ba891327242bc890) Thanks [@sidharthv96](https://github.com/sidharthv96)! - feat: Add support for iconify icons

- [#5711](https://github.com/mermaid-js/mermaid/pull/5711) [`8e640da`](https://github.com/mermaid-js/mermaid/commit/8e640da5436e8ae013b11b1c1821a9afcc15d0d3) Thanks [@NicolasNewman](https://github.com/NicolasNewman)! - feat(er): allow multi-line relationship labels

- [#5452](https://github.com/mermaid-js/mermaid/pull/5452) [`256a148`](https://github.com/mermaid-js/mermaid/commit/256a148bbf484fc7db6c19f94dd69d5d268ee048) Thanks [@NicolasNewman](https://github.com/NicolasNewman)! - New Diagram: Architecture

  Adds architecture diagrams which allows users to show relations between services.

### Patch Changes

- [#5810](https://github.com/mermaid-js/mermaid/pull/5810) [`28bd07f`](https://github.com/mermaid-js/mermaid/commit/28bd07fdeb4fc981107d21317ec6160b31f80116) Thanks [@knsv](https://github.com/knsv)! - Fix for self loops in cluster
  Supporting legacy defaultRenderer directive

- [#5789](https://github.com/mermaid-js/mermaid/pull/5789) [`16faef4`](https://github.com/mermaid-js/mermaid/commit/16faef4613b91a7d3a98a1563c25b57f9238acc7) Thanks [@sidharthv96](https://github.com/sidharthv96)! - chore: Move icons to architecture, remove full icon sets to reduce bundle size

- Updated dependencies [[`256a148`](https://github.com/mermaid-js/mermaid/commit/256a148bbf484fc7db6c19f94dd69d5d268ee048), [`7d8143b`](https://github.com/mermaid-js/mermaid/commit/7d8143b917ee3562149a0e0a821ed2d6f29cc05d)]:
  - @mermaid-js/parser@0.3.0

## 11.0.2

### Patch Changes

- [#5664](https://github.com/mermaid-js/mermaid/pull/5664) [`5deaef4`](https://github.com/mermaid-js/mermaid/commit/5deaef456e74d796866431c26f69360e4e74dbff) Thanks [@Austin-Fulbright](https://github.com/Austin-Fulbright)! - chore: Migrate git graph to langium, use typescript for internals

- Updated dependencies [[`5deaef4`](https://github.com/mermaid-js/mermaid/commit/5deaef456e74d796866431c26f69360e4e74dbff)]:
  - @mermaid-js/parser@0.2.0

## 11.0.1

### Patch Changes

- [#2](https://github.com/calvinvette/mermaid/pull/2) [`bf05d87`](https://github.com/mermaid-js/mermaid/commit/bf05d8781edacb580fdb053da167e968b7570117) Thanks [@calvinvette](https://github.com/calvinvette)! - test changeset

## 11.0.2

### Patch Changes

- Updated dependencies [[`83926c9`](https://github.com/mermaid-js/mermaid/commit/83926c9707b09c34e300888186250191ee8ae30a)]:
  - @mermaid-js/parser@0.1.1

## 11.0.1

### Patch Changes

- [#5744](https://github.com/mermaid-js/mermaid/pull/5744) [`5013484`](https://github.com/mermaid-js/mermaid/commit/50134849246141ec400e33e08c12c10539b84de9) Thanks [@sidharthv96](https://github.com/sidharthv96)! - Release parser, test changesets

- Updated dependencies [[`5013484`](https://github.com/mermaid-js/mermaid/commit/50134849246141ec400e33e08c12c10539b84de9)]:
  - @mermaid-js/parser@0.1.0
