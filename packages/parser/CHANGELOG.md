# @mermaid-js/parser

## 1.2.0

### Minor Changes

- [#7535](https://github.com/mermaid-js/mermaid/pull/7535) [`ea1c48f`](https://github.com/mermaid-js/mermaid/commit/ea1c48f53fce5d025388d386c90da8743ee25b13) Thanks [@ragelink](https://github.com/ragelink)! - feat(cynefin): Adds the Cynefin framework as a new diagram type (beta) to Mermaid (available as `cynefin-beta`). The Cynefin framework, created by Dave Snowden, is a decision-making framework that categorizes problems into five complexity domains, widely used in agile, incident management, strategy, and organizational design.

- [#7527](https://github.com/mermaid-js/mermaid/pull/7527) [`b4d0442`](https://github.com/mermaid-js/mermaid/commit/b4d0442dd1628acb3f71681519e7f47fc8bacf55) Thanks [@notionparallax](https://github.com/notionparallax)! - feat(treeView): Extends the existing treeView-beta diagram with features useful for representing file/directory structures.

- [#7708](https://github.com/mermaid-js/mermaid/pull/7708) [`4e63e9d`](https://github.com/mermaid-js/mermaid/commit/4e63e9d338b6476df283afd4a002072945bc4563) Thanks [@txmxthy](https://github.com/txmxthy)! - feat(architecture): add `align row|column {ids…}` directive to architecture-beta diagrams so authors can declare horizontal or vertical alignment of services explicitly.

- [#7251](https://github.com/mermaid-js/mermaid/pull/7251) [`216e4e9`](https://github.com/mermaid-js/mermaid/commit/216e4e9a61afceae885b00854f79e17373ccad31) Thanks [@ydah](https://github.com/ydah)! - feat(railroad): Add support for Railroad Diagrams (Syntax Diagrams) with four input syntaxes: IR (railroad-beta), EBNF (railroad-ebnf-beta), ABNF (railroad-abnf-beta), and PEG (railroad-peg-beta).

## 1.1.1

### Patch Changes

- [#7642](https://github.com/mermaid-js/mermaid/pull/7642) [`7a8fb85`](https://github.com/mermaid-js/mermaid/commit/7a8fb8532c57ecc55b3711454ab0e505a4291445) Thanks [@tractorjuice](https://github.com/tractorjuice)! - fix(wardley): allow hyphens in unquoted component names

  Multi-word names containing hyphens — e.g. `real-time processing`, `end-user`, `on-call engineer` — now parse without quoting, bringing the grammar in line with the OnlineWardleyMaps (OWM) convention. `A->B` (no-space arrow) still tokenises correctly.

- [#7658](https://github.com/mermaid-js/mermaid/pull/7658) [`675a64c`](https://github.com/mermaid-js/mermaid/commit/675a64ca0e3cde8728ca715991623c3fc055ce88) Thanks [@aloisklink](https://github.com/aloisklink)! - fix(parser): bundle langium/chevrotain

  This should silence warnings about lodash-es 4.17.23, which chevrotain@11.1.1 is pinned to, but is not vulnerable to.

  And this avoids warnings when langium v4 is installed on Node.JS v20.0.

## 1.1.0

### Minor Changes

- [#7526](https://github.com/mermaid-js/mermaid/pull/7526) [`efe218a`](https://github.com/mermaid-js/mermaid/commit/efe218a47fb5a4c2bd5489b48ce69213b141e519) Thanks [@ashishjain0512](https://github.com/ashishjain0512)! - add new TreeView diagram

## 1.0.1

### Patch Changes

- [#7333](https://github.com/mermaid-js/mermaid/pull/7333) [`fd3fc50`](https://github.com/mermaid-js/mermaid/commit/fd3fc501461e72d11933203175d70f130c1df3c5) Thanks [@omkarht](https://github.com/omkarht)! - fix: enhanced parser error messages to include line and column numbers for better debugging experience

## 1.0.0

### Major Changes

- [#7377](https://github.com/mermaid-js/mermaid/pull/7377) [`7243340`](https://github.com/mermaid-js/mermaid/commit/72433401a8c9d90d6753b7592d556122ecb953ca) Thanks [@aloisklink](https://github.com/aloisklink)! - chore: upgrade to Langium v4

  Upgrade `@mermaid-js/parser` to use Langium v4,
  see https://github.com/eclipse-langium/langium/releases/tag/v4.0.0
  for more details.

  The major breaking changes that impact consumers of this package are:
  - Due to various type-related changes, `langium` now requires version `>= 5.8.0`
    of TypeScript.
  - The generated type names from `ast.ts` have been moved from `<typeName>` to
    `<typeName>.$type`
    ([langium#1942](https://github.com/eclipse-langium/langium/pull/1942)).

  This also removes a transitive dependency on lodash versions that are vulnerable
  to CVE-2025-13465, although
  [chevrotain doesn't use the affected functions](https://github.com/Chevrotain/chevrotain/blob/21f20cd9754f8d5e85243fd9286d1fff397363ab/packages/website/docs/changes/CHANGELOG.md?plain=1#L5-L8),
  so this is only to silence security scanners.

## 0.6.3

### Patch Changes

- [#7051](https://github.com/mermaid-js/mermaid/pull/7051) [`63df702`](https://github.com/mermaid-js/mermaid/commit/63df7021462e8dc1f2aaecb9c5febbbbde4c38e3) Thanks [@shubhamparikh2704](https://github.com/shubhamparikh2704)! - Add validation for negative values in pie charts:

  Prevents crashes during parsing by validating values post-parsing.

  Provides clearer, user-friendly error messages for invalid negative inputs.

## 0.6.2

### Patch Changes

- [#6510](https://github.com/mermaid-js/mermaid/pull/6510) [`7a38eb7`](https://github.com/mermaid-js/mermaid/commit/7a38eb715d795cd5c66cb59357d64ec197b432e6) Thanks [@sidharthv96](https://github.com/sidharthv96)! - chore: Move packet diagram out of beta

## 0.6.1

### Patch Changes

- [#6725](https://github.com/mermaid-js/mermaid/pull/6725) [`0da2922`](https://github.com/mermaid-js/mermaid/commit/0da2922ee7f47959e324ec10d3d21ee70594f557) Thanks [@shubham-mermaid](https://github.com/shubham-mermaid)! - chore: use Treemap instead of TreemapDoc in parser.

## 0.6.0

### Minor Changes

- [#6590](https://github.com/mermaid-js/mermaid/pull/6590) [`f338802`](https://github.com/mermaid-js/mermaid/commit/f338802642cdecf5b7ed6c19a20cf2a81effbbee) Thanks [@knsv](https://github.com/knsv)! - Adding support for the new diagram type nested treemap

## 0.5.0

### Minor Changes

- [#5980](https://github.com/mermaid-js/mermaid/pull/5980) [`df9df9d`](https://github.com/mermaid-js/mermaid/commit/df9df9dc32b80a8c320cc0efd5483b9485f15bde) Thanks [@BryanCrotazGivEnergy](https://github.com/BryanCrotazGivEnergy)! - feat: Add shorter `+<count>: Label` syntax in packet diagram

### Patch Changes

- [#6407](https://github.com/mermaid-js/mermaid/pull/6407) [`cdbd3e5`](https://github.com/mermaid-js/mermaid/commit/cdbd3e58a3a35d63a79258115dedca4a535c1038) Thanks [@thomascizeron](https://github.com/thomascizeron)! - Refactor grammar so that title don't break Architecture Diagrams

## 0.4.0

### Minor Changes

- [#6381](https://github.com/mermaid-js/mermaid/pull/6381) [`95d73bc`](https://github.com/mermaid-js/mermaid/commit/95d73bc3f064dbf261a06483f94a7ef4d0bb52eb) Thanks [@thomascizeron](https://github.com/thomascizeron)! - Add Radar Chart

## 0.3.0

### Minor Changes

- [#5452](https://github.com/mermaid-js/mermaid/pull/5452) [`256a148`](https://github.com/mermaid-js/mermaid/commit/256a148bbf484fc7db6c19f94dd69d5d268ee048) Thanks [@NicolasNewman](https://github.com/NicolasNewman)! - New Diagram: Architecture

  Adds architecture diagrams which allows users to show relations between services.

### Patch Changes

- [#5793](https://github.com/mermaid-js/mermaid/pull/5793) [`7d8143b`](https://github.com/mermaid-js/mermaid/commit/7d8143b917ee3562149a0e0a821ed2d6f29cc05d) Thanks [@sidharthv96](https://github.com/sidharthv96)! - feat: Support - in architecture icons

## 0.2.0

### Minor Changes

- [#5664](https://github.com/mermaid-js/mermaid/pull/5664) [`5deaef4`](https://github.com/mermaid-js/mermaid/commit/5deaef456e74d796866431c26f69360e4e74dbff) Thanks [@Austin-Fulbright](https://github.com/Austin-Fulbright)! - chore: Migrate git graph to langium, use typescript for internals

## 0.1.1

### Patch Changes

- [#5746](https://github.com/mermaid-js/mermaid/pull/5746) [`83926c9`](https://github.com/mermaid-js/mermaid/commit/83926c9707b09c34e300888186250191ee8ae30a) Thanks [@sidharthv96](https://github.com/sidharthv96)! - test changeset

## 0.1.0

### Minor Changes

- [#5744](https://github.com/mermaid-js/mermaid/pull/5744) [`5013484`](https://github.com/mermaid-js/mermaid/commit/50134849246141ec400e33e08c12c10539b84de9) Thanks [@sidharthv96](https://github.com/sidharthv96)! - Release parser, test changesets
