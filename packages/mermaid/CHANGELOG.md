# mermaid

## 11.12.2

### Patch Changes

- [#7200](https://github.com/mermaid-js/mermaid/pull/7200) [`de7ed10`](https://github.com/mermaid-js/mermaid/commit/de7ed1033996d702e3983dcf8114f33faea89577) Thanks [@shubhamparikh2704](https://github.com/shubhamparikh2704)! - fix: validate dates and tick interval to prevent UI freeze/crash in gantt diagramtype

## 11.12.1

### Patch Changes

- [#7107](https://github.com/mermaid-js/mermaid/pull/7107) [`cbf8946`](https://github.com/mermaid-js/mermaid/commit/cbf89462acecac7a06f19843e8d48cb137df0753) Thanks [@shubhamparikh2704](https://github.com/shubhamparikh2704)! - fix: Updated the dependency dagre-d3-es to 7.0.13 to fix GHSA-cc8p-78qf-8p7q

## 11.12.0

### Minor Changes

- [#6921](https://github.com/mermaid-js/mermaid/pull/6921) [`764b315`](https://github.com/mermaid-js/mermaid/commit/764b315dc16d0359add7c6b8e3ef7592e9bdc09c) Thanks [@quilicicf](https://github.com/quilicicf)! - feat: Add IDs in architecture diagrams

### Patch Changes

- [#6950](https://github.com/mermaid-js/mermaid/pull/6950) [`a957908`](https://github.com/mermaid-js/mermaid/commit/a9579083bfba367a4f4678547ec37ed7b61b9f5b) Thanks [@shubhamparikh2704](https://github.com/shubhamparikh2704)! - chore: Fix mindmap rendering in docs and apply tidytree layout

- [#6826](https://github.com/mermaid-js/mermaid/pull/6826) [`1d36810`](https://github.com/mermaid-js/mermaid/commit/1d3681053b9168354e48e5763023b6305cd1ca72) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: Ensure edge label color is applied when using classDef with edge IDs

- [#6945](https://github.com/mermaid-js/mermaid/pull/6945) [`d318f1a`](https://github.com/mermaid-js/mermaid/commit/d318f1a13cd7429334a29c70e449074ec1cb9f68) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: Resolve gantt chart crash due to invalid array length

- [#6918](https://github.com/mermaid-js/mermaid/pull/6918) [`cfe9238`](https://github.com/mermaid-js/mermaid/commit/cfe9238882cbe95416db1feea3112456a71b6aaf) Thanks [@shubhamparikh2704](https://github.com/shubhamparikh2704)! - chore: revert marked dependency from ^15.0.7 to ^16.0.0
  - Reverted marked package version to ^16.0.0 for better compatibility
  - This is a dependency update that maintains API compatibility
  - All tests pass with the updated version

## 11.11.0

### Minor Changes

- [#6704](https://github.com/mermaid-js/mermaid/pull/6704) [`012530e`](https://github.com/mermaid-js/mermaid/commit/012530e98e9b8b80962ab270b6bb3b6d9f6ada05) Thanks [@omkarht](https://github.com/omkarht)! - feat: Added support for new participant types (`actor`, `boundary`, `control`, `entity`, `database`, `collections`, `queue`) in `sequenceDiagram`.

- [#6802](https://github.com/mermaid-js/mermaid/pull/6802) [`c8e5027`](https://github.com/mermaid-js/mermaid/commit/c8e50276e877c4de7593a09ec458c99353e65af8) Thanks [@darshanr0107](https://github.com/darshanr0107)! - feat: Update mindmap rendering to support multiple layouts, improved edge intersections, and new shapes

### Patch Changes

- [#6905](https://github.com/mermaid-js/mermaid/pull/6905) [`33bc4a0`](https://github.com/mermaid-js/mermaid/commit/33bc4a0b4e2ca6d937bb0a8c4e2081b1362b2800) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: Render newlines as spaces in class diagrams

- [#6886](https://github.com/mermaid-js/mermaid/pull/6886) [`e0b45c2`](https://github.com/mermaid-js/mermaid/commit/e0b45c2d2b41c2a9038bf87646fa3ccd7560eb20) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: Handle arrows correctly when auto number is enabled

## 11.10.0

### Minor Changes

- [#6744](https://github.com/mermaid-js/mermaid/pull/6744) [`daf8d8d`](https://github.com/mermaid-js/mermaid/commit/daf8d8d3befcd600618a629977b76463b38d0ad9) Thanks [@SpecularAura](https://github.com/SpecularAura)! - feat: Added support for per link curve styling in flowchart diagram using edge ids

### Patch Changes

- [#6857](https://github.com/mermaid-js/mermaid/pull/6857) [`b9ef683`](https://github.com/mermaid-js/mermaid/commit/b9ef683fb67b8959abc455d6cc5266c37ba435f6) Thanks [@knsv](https://github.com/knsv)! - feat: Exposing elk configuration forceNodeModelOrder and considerModelOrder to the mermaid configuration

- [#6653](https://github.com/mermaid-js/mermaid/pull/6653) [`2c0931d`](https://github.com/mermaid-js/mermaid/commit/2c0931da46794b49d2523211e25f782900c34e94) Thanks [@darshanr0107](https://github.com/darshanr0107)! - chore: Remove the "-beta" suffix from the XYChart, Block, Sankey diagrams to reflect their stable status

- [#6683](https://github.com/mermaid-js/mermaid/pull/6683) [`33e08da`](https://github.com/mermaid-js/mermaid/commit/33e08daf175125295a06b1b80279437004a4e865) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: Position the edge label in state diagram correctly relative to the edge

- [#6693](https://github.com/mermaid-js/mermaid/pull/6693) [`814b68b`](https://github.com/mermaid-js/mermaid/commit/814b68b4a94813f7c6b3d7fb4559532a7bab2652) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: Apply correct dateFormat in Gantt chart to show only day when specified

- [#6734](https://github.com/mermaid-js/mermaid/pull/6734) [`fce7cab`](https://github.com/mermaid-js/mermaid/commit/fce7cabb71d68a20a66246fe23d066512126a412) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: handle exclude dates properly in Gantt charts when using dateFormat: 'YYYY-MM-DD HH:mm:ss'

- [#6733](https://github.com/mermaid-js/mermaid/pull/6733) [`fc07f0d`](https://github.com/mermaid-js/mermaid/commit/fc07f0d8abca49e4f887d7457b7b94fb07d1e3da) Thanks [@omkarht](https://github.com/omkarht)! - fix: fixed connection gaps in flowchart for roundedRect, stadium and diamond shape

- [#6876](https://github.com/mermaid-js/mermaid/pull/6876) [`12e01bd`](https://github.com/mermaid-js/mermaid/commit/12e01bdb5cacf3569133979a5a4f1d8973e9aec1) Thanks [@sidharthv96](https://github.com/sidharthv96)! - fix: sanitize icon labels and icon SVGs

  Resolves CVE-2025-54880 reported by @fourcube

- [#6801](https://github.com/mermaid-js/mermaid/pull/6801) [`01aaef3`](https://github.com/mermaid-js/mermaid/commit/01aaef39b4a1ec8bc5a0c6bfa3a20b712d67f4dc) Thanks [@sidharthv96](https://github.com/sidharthv96)! - fix: Update casing of ID in requirement diagram

- [#6796](https://github.com/mermaid-js/mermaid/pull/6796) [`c36cd05`](https://github.com/mermaid-js/mermaid/commit/c36cd05c45ac3090181152b4dae41f8d7b569bd6) Thanks [@HashanCP](https://github.com/HashanCP)! - fix: Make flowchart elk detector regex match less greedy

- [#6702](https://github.com/mermaid-js/mermaid/pull/6702) [`8bb29fc`](https://github.com/mermaid-js/mermaid/commit/8bb29fc879329ad109898e4025b4f4eba2ab0649) Thanks [@qraqras](https://github.com/qraqras)! - fix(block): overflowing blocks no longer affect later lines

  This may change the layout of block diagrams that have overflowing lines
  (i.e. block diagrams that use up more columns that the `columns` specifier).

- [#6717](https://github.com/mermaid-js/mermaid/pull/6717) [`71b04f9`](https://github.com/mermaid-js/mermaid/commit/71b04f93b07f876df2b30656ef36036c1d0e4e4f) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: log warning for blocks exceeding column width

  This update adds a validation check that logs a warning message when a block's width exceeds the defined column layout.

- [#6820](https://github.com/mermaid-js/mermaid/pull/6820) [`c99bce6`](https://github.com/mermaid-js/mermaid/commit/c99bce6bab4c7ce0b81b66d44f44853ce4aeb1c3) Thanks [@kriss-u](https://github.com/kriss-u)! - fix: Add escaped class literal name on namespace

- [#6332](https://github.com/mermaid-js/mermaid/pull/6332) [`6cc1926`](https://github.com/mermaid-js/mermaid/commit/6cc192680a2531cab28f87a8061a53b786e010f3) Thanks [@ajuckel](https://github.com/ajuckel)! - fix: Allow equals sign in sequenceDiagram labels

- [#6651](https://github.com/mermaid-js/mermaid/pull/6651) [`9da6fb3`](https://github.com/mermaid-js/mermaid/commit/9da6fb39ae278401771943ac85d6d1b875f78cf1) Thanks [@darshanr0107](https://github.com/darshanr0107)! - Add validation for negative values in pie charts:

  Prevents crashes during parsing by validating values post-parsing.

  Provides clearer, user-friendly error messages for invalid negative inputs.

- [#6803](https://github.com/mermaid-js/mermaid/pull/6803) [`e48b0ba`](https://github.com/mermaid-js/mermaid/commit/e48b0ba61dab7f95aa02da603b5b7d383b894932) Thanks [@omkarht](https://github.com/omkarht)! - chore: migrate to class-based ArchitectureDB implementation

- [#6838](https://github.com/mermaid-js/mermaid/pull/6838) [`4d62d59`](https://github.com/mermaid-js/mermaid/commit/4d62d5963238400270e9314c6e4d506f48147074) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - fix: node border style for handdrawn shapes

- [#6739](https://github.com/mermaid-js/mermaid/pull/6739) [`e9ce8cf`](https://github.com/mermaid-js/mermaid/commit/e9ce8cf4da9062d85098042044822100889bb0dd) Thanks [@kriss-u](https://github.com/kriss-u)! - fix: Update flowchart direction TD's behavior to be the same as TB

- [#6833](https://github.com/mermaid-js/mermaid/pull/6833) [`9258b29`](https://github.com/mermaid-js/mermaid/commit/9258b2933bbe1ef41087345ffea3731673671c49) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: correctly render non-directional lines for '---' in block diagrams

- [#6855](https://github.com/mermaid-js/mermaid/pull/6855) [`da90f67`](https://github.com/mermaid-js/mermaid/commit/da90f6760b6efb0da998bcb63b75eecc29e06c08) Thanks [@sidharthv96](https://github.com/sidharthv96)! - fix: fallback to raw text instead of rendering _Unsupported markdown_ or empty blocks

  Instead of printing **Unsupported markdown: XXX**, or empty blocks when using a markdown feature
  that Mermaid does not yet support when `htmlLabels: true`(default) or `htmlLabels: false`,
  fallback to the raw markdown text.

- [#6876](https://github.com/mermaid-js/mermaid/pull/6876) [`0133f1c`](https://github.com/mermaid-js/mermaid/commit/0133f1c0c5cff4fc4c8e0b99e9cf0b3d49dcbe71) Thanks [@sidharthv96](https://github.com/sidharthv96)! - fix: sanitize KATEX blocks

  Resolves CVE-2025-54881 reported by @fourcube

- [#6804](https://github.com/mermaid-js/mermaid/pull/6804) [`895f9d4`](https://github.com/mermaid-js/mermaid/commit/895f9d43ff98ca05ebfba530789f677f31a011ff) Thanks [@omkarht](https://github.com/omkarht)! - chore: Update packet diagram to use new class-based database structure

## 11.9.0

### Minor Changes

- [#6453](https://github.com/mermaid-js/mermaid/pull/6453) [`5acbd7e`](https://github.com/mermaid-js/mermaid/commit/5acbd7e762469d9d89a9c77faf6617ee13367f3a) Thanks [@sidharthv96](https://github.com/sidharthv96)! - feat: Add `getRegisteredDiagramsMetadata` to `mermaid`, which returns all the registered diagram IDs in mermaid

### Patch Changes

- [#6738](https://github.com/mermaid-js/mermaid/pull/6738) [`d90634b`](https://github.com/mermaid-js/mermaid/commit/d90634bf2b09e586b055729e07e9a1a31b21827c) Thanks [@shubham-mermaid](https://github.com/shubham-mermaid)! - chore: Updated TreeMapDB to use class based approach

- [#6510](https://github.com/mermaid-js/mermaid/pull/6510) [`7a38eb7`](https://github.com/mermaid-js/mermaid/commit/7a38eb715d795cd5c66cb59357d64ec197b432e6) Thanks [@sidharthv96](https://github.com/sidharthv96)! - chore: Move packet diagram out of beta

- [#6747](https://github.com/mermaid-js/mermaid/pull/6747) [`3e3ae08`](https://github.com/mermaid-js/mermaid/commit/3e3ae089305e1c7b9948b9e149eba6854fe7f2d6) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: adjust sequence diagram title positioning to prevent overlap with top border in Safari

- [#6751](https://github.com/mermaid-js/mermaid/pull/6751) [`d3e2be3`](https://github.com/mermaid-js/mermaid/commit/d3e2be35be066adeb7fd502b4a24c223c3b53947) Thanks [@darshanr0107](https://github.com/darshanr0107)! - chore: Update MindmapDB to use class based approach

- [#6715](https://github.com/mermaid-js/mermaid/pull/6715) [`637680d`](https://github.com/mermaid-js/mermaid/commit/637680d4d9e39b4f8cb6f05b4cb261e8f5693ac3) Thanks [@Syn3ugar](https://github.com/Syn3ugar)! - fix(timeline): fix loading `leftMargin` from config

  The `timeline.leftMargin` config value should now correctly control the size of the left margin, instead of being ignored.

- Updated dependencies [[`7a38eb7`](https://github.com/mermaid-js/mermaid/commit/7a38eb715d795cd5c66cb59357d64ec197b432e6)]:
  - @mermaid-js/parser@0.6.2

## 11.8.1

### Patch Changes

- Updated dependencies [[`0da2922`](https://github.com/mermaid-js/mermaid/commit/0da2922ee7f47959e324ec10d3d21ee70594f557)]:
  - @mermaid-js/parser@0.6.1

## 11.8.0

### Minor Changes

- [#6590](https://github.com/mermaid-js/mermaid/pull/6590) [`f338802`](https://github.com/mermaid-js/mermaid/commit/f338802642cdecf5b7ed6c19a20cf2a81effbbee) Thanks [@knsv](https://github.com/knsv)! - Adding support for the new diagram type nested treemap

### Patch Changes

- [#6707](https://github.com/mermaid-js/mermaid/pull/6707) [`592c5bb`](https://github.com/mermaid-js/mermaid/commit/592c5bb880c3b942710a2878d386bcb3eb35c137) Thanks [@darshanr0107](https://github.com/darshanr0107)! - fix: Log a warning when duplicate commit IDs are encountered in gitGraph to help identify and debug rendering issues caused by non-unique IDs.

- Updated dependencies [[`f338802`](https://github.com/mermaid-js/mermaid/commit/f338802642cdecf5b7ed6c19a20cf2a81effbbee)]:
  - @mermaid-js/parser@0.6.0

## 11.7.0

### Minor Changes

- [#6479](https://github.com/mermaid-js/mermaid/pull/6479) [`97b79c3`](https://github.com/mermaid-js/mermaid/commit/97b79c3578a2004c63fa32f6d5e17bd8a536e13a) Thanks [@monicanguyen25](https://github.com/monicanguyen25)! - feat: Add Vertical Line To Gantt Plot At Specified Time

- [#6225](https://github.com/mermaid-js/mermaid/pull/6225) [`41e84b7`](https://github.com/mermaid-js/mermaid/commit/41e84b726a1f2df002b77c4b0071e2c15e47838e) Thanks [@Shahir-47](https://github.com/Shahir-47)! - feat: Add support for styling Journey Diagram title (color, font-family, and font-size)

- [#6423](https://github.com/mermaid-js/mermaid/pull/6423) [`aa6cb86`](https://github.com/mermaid-js/mermaid/commit/aa6cb86899968c65561eebfc1d54dd086b1518a2) Thanks [@BambioGaming](https://github.com/BambioGaming)! - Added support for the click directive in stateDiagram syntax

- [#5980](https://github.com/mermaid-js/mermaid/pull/5980) [`df9df9d`](https://github.com/mermaid-js/mermaid/commit/df9df9dc32b80a8c320cc0efd5483b9485f15bde) Thanks [@BryanCrotazGivEnergy](https://github.com/BryanCrotazGivEnergy)! - feat: Add shorter `+<count>: Label` syntax in packet diagram

- [#6523](https://github.com/mermaid-js/mermaid/pull/6523) [`c17277e`](https://github.com/mermaid-js/mermaid/commit/c17277e743b1c12e4134fba44c62a7d5885f2574) Thanks [@NourBenz](https://github.com/NourBenz)! - fix: allow sequence diagram arrows with a trailing colon but no message

- [#6475](https://github.com/mermaid-js/mermaid/pull/6475) [`a1ba65c`](https://github.com/mermaid-js/mermaid/commit/a1ba65c0c08432ec36e772570c3a5899cb57c102) Thanks [@Shahir-47](https://github.com/Shahir-47)! - feat: Dynamically Render Data Labels Within Bar Charts

### Patch Changes

- [#6588](https://github.com/mermaid-js/mermaid/pull/6588) [`b1cf291`](https://github.com/mermaid-js/mermaid/commit/b1cf29127348602137552405e3300dee1697f0de) Thanks [@omkarht](https://github.com/omkarht)! - Fix stroke styles for ER diagram to correctly apply path and row-specific styles

- [#6296](https://github.com/mermaid-js/mermaid/pull/6296) [`a4754ad`](https://github.com/mermaid-js/mermaid/commit/a4754ad195e70d52fbd46ef44f40797d2d215e41) Thanks [@sidharthv96](https://github.com/sidharthv96)! - chore: Convert StateDB into TypeScript

- [#6463](https://github.com/mermaid-js/mermaid/pull/6463) [`2b05d7e`](https://github.com/mermaid-js/mermaid/commit/2b05d7e1edef635e6c80cb383b10ea0a89279f41) Thanks [@AaronMoat](https://github.com/AaronMoat)! - fix: Remove incorrect `style="undefined;"` attributes in some Mermaid diagrams

- [#6282](https://github.com/mermaid-js/mermaid/pull/6282) [`d63d3bf`](https://github.com/mermaid-js/mermaid/commit/d63d3bf1e7596ac7eeb24ba06cbc7a70f9c8b070) Thanks [@saurabhg772244](https://github.com/saurabhg772244)! - FontAwesome icons can now be embedded as SVGs in flowcharts if they are registered via `mermaid.registerIconPacks`.

- [#6407](https://github.com/mermaid-js/mermaid/pull/6407) [`cdbd3e5`](https://github.com/mermaid-js/mermaid/commit/cdbd3e58a3a35d63a79258115dedca4a535c1038) Thanks [@thomascizeron](https://github.com/thomascizeron)! - Refactor grammar so that title don't break Architecture Diagrams

- [#6343](https://github.com/mermaid-js/mermaid/pull/6343) [`1ddaf10`](https://github.com/mermaid-js/mermaid/commit/1ddaf10b89d8c7311c5e10d466b42fa36b61210b) Thanks [@jeswr](https://github.com/jeswr)! - fix: allow colons in events

- [#6616](https://github.com/mermaid-js/mermaid/pull/6616) [`ca80f71`](https://github.com/mermaid-js/mermaid/commit/ca80f719eac86cf4c31392105d5d896f39b84bbc) Thanks [@ashishjain0512](https://github.com/ashishjain0512)! - fix(timeline): ensure consistent vertical line lengths with visible arrowheads

  Fixed timeline diagrams where vertical dashed lines from tasks had inconsistent lengths. All vertical lines now extend to the same depth regardless of the number of events in each column, with sufficient padding to clearly display both the dashed line pattern and complete arrowheads.

- [#6566](https://github.com/mermaid-js/mermaid/pull/6566) [`bca6ed6`](https://github.com/mermaid-js/mermaid/commit/bca6ed67c3e0db910bf498fdd0fc0346c02d392b) Thanks [@arpitjain099](https://github.com/arpitjain099)! - fix: Fix incomplete string escaping in URL manipulation logic when `arrowMarkerAbsolute: true` by ensuring all unsafe characters are escaped.

- Updated dependencies [[`df9df9d`](https://github.com/mermaid-js/mermaid/commit/df9df9dc32b80a8c320cc0efd5483b9485f15bde), [`cdbd3e5`](https://github.com/mermaid-js/mermaid/commit/cdbd3e58a3a35d63a79258115dedca4a535c1038)]:
  - @mermaid-js/parser@0.5.0

## 11.6.0

### Minor Changes

- [#6408](https://github.com/mermaid-js/mermaid/pull/6408) [`ad65313`](https://github.com/mermaid-js/mermaid/commit/ad653138e16765d095613a6e5de86dc5e52ac8f0) Thanks [@ashishjain0512](https://github.com/ashishjain0512)! - fix: restore curve type configuration functionality for flowcharts. This fixes the issue where curve type settings were not being applied when configured through any of the following methods:
  - Config
  - Init directive (%%{ init: { 'flowchart': { 'curve': '...' } } }%%)
  - LinkStyle command (linkStyle default interpolate ...)

- [#6381](https://github.com/mermaid-js/mermaid/pull/6381) [`95d73bc`](https://github.com/mermaid-js/mermaid/commit/95d73bc3f064dbf261a06483f94a7ef4d0bb52eb) Thanks [@thomascizeron](https://github.com/thomascizeron)! - Add Radar Chart

### Patch Changes

- [#2](https://github.com/calvinvette/mermaid/pull/2) [`16d9b63`](https://github.com/mermaid-js/mermaid/commit/16d9b6345749ab5f24d5b8433efc3635d4913863) Thanks [@calvinvette](https://github.com/calvinvette)! - - [#6388](https://github.com/mermaid-js/mermaid/pull/6386)
  Thanks [@bollwyvl](https://github.com/bollwyvl) - Fix requirement diagram containment arrow
- Updated dependencies [[`95d73bc`](https://github.com/mermaid-js/mermaid/commit/95d73bc3f064dbf261a06483f94a7ef4d0bb52eb)]:
  - @mermaid-js/parser@0.4.0

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
  For example

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

## [10.0.0](https://github.com/mermaid-js/mermaid/releases/tag/v10.0.0)

### Mermaid is ESM only!

We've dropped CJS support. So, you will have to update your import scripts as follows.

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true });
</script>
```

You can keep using v9 by adding the `@9` in the CDN URL.

```diff
- <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.js"></script>
+ <script src="https://cdn.jsdelivr.net/npm/mermaid@9/dist/mermaid.js"></script>
```

### mermaid.render is async and doesn't accept callbacks

```js
// < v10
mermaid.render('id', 'graph TD;\nA-->B', (svg, bindFunctions) => {
  element.innerHTML = svg;
  if (bindFunctions) {
    bindFunctions(element);
  }
});

// Shorter syntax
if (bindFunctions) {
  bindFunctions(element);
}
// can be replaced with the `?.` shorthand
bindFunctions?.(element);

// >= v10 with async/await
const { svg, bindFunctions } = await mermaid.render('id', 'graph TD;\nA-->B');
element.innerHTML = svg;
bindFunctions?.(element);

// >= v10 with promise.then
mermaid.render('id', 'graph TD;A-->B').then(({ svg, bindFunctions }) => {
  element.innerHTML = svg;
  bindFunctions?.(element);
});
```

### mermaid.parse is async and ParseError is removed

```js
// < v10
mermaid.parse(text, parseError);

//>= v10
await mermaid.parse(text).catch(parseError);
// or
try {
  await mermaid.parse(text);
} catch (err) {
  parseError(err);
}
```

### Init deprecated and InitThrowsErrors removed

The config passed to `init` was not being used earlier.
It will now be used.
The `init` function is deprecated and will be removed in the next major release.
init currently works as a wrapper to `initialize` and `run`.

```js
// < v10
mermaid.init(config, selector, cb);

//>= v10
mermaid.initialize(config);
mermaid.run({
  querySelector: selector,
  postRenderCallback: cb,
  suppressErrors: true,
});
```

```js
// < v10
mermaid.initThrowsErrors(config, selector, cb);

//>= v10
mermaid.initialize(config);
mermaid.run({
  querySelector: selector,
  postRenderCallback: cb,
  suppressErrors: false,
});
```

// TODO: Populate changelog pre v10

- Config has a lot of changes
- globalReset resets to `defaultConfig` instead of current config. Use `reset` instead.

## [Unreleased](https://github.com/knsv/mermaid/tree/HEAD)

[Full Changelog](https://github.com/knsv/mermaid/compare/8.2.0...HEAD)

**Closed issues:**

- Cross-Site Scripting:DOM - Issue [\#847](https://github.com/knsv/mermaid/issues/847)

## [8.2.0](https://github.com/knsv/mermaid/tree/8.2.0) (2019-07-17)

[Full Changelog](https://github.com/knsv/mermaid/compare/8.1.0...8.2.0)

**Closed issues:**

- Create issue templates [\#871](https://github.com/knsv/mermaid/issues/871)
- cross site scripting in mermaid [\#869](https://github.com/knsv/mermaid/issues/869)
- Make Gantt chart date inclusive [\#868](https://github.com/knsv/mermaid/issues/868)
- CHANGELOG missing updates for all versions since 0.4.0 [\#865](https://github.com/knsv/mermaid/issues/865)
- please add tag for 8.0.0 release [\#863](https://github.com/knsv/mermaid/issues/863)
- classDiagram breaks on any edit [\#858](https://github.com/knsv/mermaid/issues/858)
- found 1 high severity vulnerability [\#839](https://github.com/knsv/mermaid/issues/839)
- Missing fontawesome icon support [\#830](https://github.com/knsv/mermaid/issues/830)
- Docs for integration with wiki.js? [\#829](https://github.com/knsv/mermaid/issues/829)
- Is this project still maintained? [\#826](https://github.com/knsv/mermaid/issues/826)
- typora [\#823](https://github.com/knsv/mermaid/issues/823)
- Maintain the order of the nodes in Flowchart [\#815](https://github.com/knsv/mermaid/issues/815)
- Overlap, Overflow and cut titles in flowchart [\#814](https://github.com/knsv/mermaid/issues/814)
- How load mermaidApi notejs electron [\#813](https://github.com/knsv/mermaid/issues/813)
- How to set the spacing between the text of the flowchart node and the border? [\#812](https://github.com/knsv/mermaid/issues/812)
- no triming participant name and the name following spaces is as another actor in sequence [\#809](https://github.com/knsv/mermaid/issues/809)
- uml Class as shape type [\#807](https://github.com/knsv/mermaid/issues/807)
- Force-directed graph Layout Style [\#806](https://github.com/knsv/mermaid/issues/806)
- how can I start a newLine in FlowChart [\#805](https://github.com/knsv/mermaid/issues/805)
- UOEProcessShow [\#801](https://github.com/knsv/mermaid/issues/801)
- Why the use of code blocks? [\#799](https://github.com/knsv/mermaid/issues/799)
- fixing class diagram [\#794](https://github.com/knsv/mermaid/issues/794)
- Autonumber support in sequence diagrams [\#782](https://github.com/knsv/mermaid/issues/782)
- MomentJS dependency [\#781](https://github.com/knsv/mermaid/issues/781)
- Feature : Can we color code the flow/arrows [\#766](https://github.com/knsv/mermaid/issues/766)
- Is there any way to convert flowchart.js code to mermaid code [\#726](https://github.com/knsv/mermaid/issues/726)
- Fixed width of nodes [\#653](https://github.com/knsv/mermaid/issues/653)
- Inline comment [\#650](https://github.com/knsv/mermaid/issues/650)
- alt attribute of img tag in HTML [\#619](https://github.com/knsv/mermaid/issues/619)
- Just wanted to say : THANKS ! [\#618](https://github.com/knsv/mermaid/issues/618)
- "animation" [\#446](https://github.com/knsv/mermaid/issues/446)

**Merged pull requests:**

- Trimming whitespace after participant id [\#882](https://github.com/knsv/mermaid/pull/882) ([IOrlandoni](https://github.com/IOrlandoni))
- chore\(deps\): bump atob from 2.0.3 to 2.1.2 [\#881](https://github.com/knsv/mermaid/pull/881) ([dependabot[bot]](https://github.com/apps/dependabot))
- chore\(deps\): bump fstream from 1.0.11 to 1.0.12 [\#880](https://github.com/knsv/mermaid/pull/880) ([dependabot[bot]](https://github.com/apps/dependabot))
- chore\(deps\): bump js-yaml from 3.12.0 to 3.13.1 [\#879](https://github.com/knsv/mermaid/pull/879) ([dependabot[bot]](https://github.com/apps/dependabot))
- I847 cross site scripting [\#878](https://github.com/knsv/mermaid/pull/878) ([knsv](https://github.com/knsv))
- Bump lodash.mergewith from 4.6.1 to 4.6.2 [\#877](https://github.com/knsv/mermaid/pull/877) ([dependabot[bot]](https://github.com/apps/dependabot))
- Adding docs into core repo again [\#876](https://github.com/knsv/mermaid/pull/876) ([knsv](https://github.com/knsv))
- Bump lodash from 4.17.11 to 4.17.13 [\#875](https://github.com/knsv/mermaid/pull/875) ([dependabot[bot]](https://github.com/apps/dependabot))
- feat\(stale.yml\): update issue label and bot comment [\#874](https://github.com/knsv/mermaid/pull/874) ([ThePenguin1140](https://github.com/ThePenguin1140))
- Feature/allow inclusive enddates [\#872](https://github.com/knsv/mermaid/pull/872) ([ThePenguin1140](https://github.com/ThePenguin1140))
- Adding trapezoid and inverse trapezoid vertex options. [\#741](https://github.com/knsv/mermaid/pull/741) ([adamwulf](https://github.com/adamwulf))

## [8.1.0](https://github.com/knsv/mermaid/tree/8.1.0) (2019-06-25)

[Full Changelog](https://github.com/knsv/mermaid/compare/7.0.5...8.1.0)

**Closed issues:**

- Gantt and sequence diagram do not render [\#853](https://github.com/knsv/mermaid/issues/853)
- margins around flowchart are not balanced [\#852](https://github.com/knsv/mermaid/issues/852)
- Smaller bundles [\#843](https://github.com/knsv/mermaid/issues/843)
- unicode in labels [\#776](https://github.com/knsv/mermaid/issues/776)
- Hard-changing drawing of arrows per edge type [\#775](https://github.com/knsv/mermaid/issues/775)
- SequenceDiagram wrong [\#773](https://github.com/knsv/mermaid/issues/773)
- Render mermaid on github pages with simple code [\#772](https://github.com/knsv/mermaid/issues/772)
- FlowChart - large space between text and the image [\#754](https://github.com/knsv/mermaid/issues/754)
- Class Diagram Issues when using Mermaid in Stackedit [\#748](https://github.com/knsv/mermaid/issues/748)
- Multi-platform CI [\#744](https://github.com/knsv/mermaid/issues/744)
- gantt: sections can't have a colon [\#742](https://github.com/knsv/mermaid/issues/742)
- Yarn build does not add mermaid.min.css to dist [\#732](https://github.com/knsv/mermaid/issues/732)
- Is there a grammar / keyword / more than just the basic examples? [\#718](https://github.com/knsv/mermaid/issues/718)
- Click event and react component [\#717](https://github.com/knsv/mermaid/issues/717)
- Long text going outside the box [\#706](https://github.com/knsv/mermaid/issues/706)
- How to migrate from yUML to mermaid? [\#704](https://github.com/knsv/mermaid/issues/704)
- Issue on Dynamic Creation in PHP [\#690](https://github.com/knsv/mermaid/issues/690)
- `click "\#target"` and `click "http://url"` should create regular links [\#689](https://github.com/knsv/mermaid/issues/689)
- Support Chinese punctuation [\#687](https://github.com/knsv/mermaid/issues/687)
- \[Question\] Proper way to install on Mac? [\#681](https://github.com/knsv/mermaid/issues/681)
- Has Mermaid a graphical interface to make diagrams? [\#668](https://github.com/knsv/mermaid/issues/668)
- mermaid installation on debian [\#649](https://github.com/knsv/mermaid/issues/649)
- "Cannot activate" in sequenceDiagram [\#647](https://github.com/knsv/mermaid/issues/647)
- Link \("click" statement\) in flowchart does not work in exported SVG [\#646](https://github.com/knsv/mermaid/issues/646)
- How to pass styling [\#639](https://github.com/knsv/mermaid/issues/639)
- The live editor can't show seq diagram with notes for 8.0.0-alpha.3 [\#638](https://github.com/knsv/mermaid/issues/638)
- import mermaid.css with ES6 + NPM [\#634](https://github.com/knsv/mermaid/issues/634)
- Actor line cuts through other elements [\#633](https://github.com/knsv/mermaid/issues/633)
- Graph TD line out of the picture \(left side\) [\#630](https://github.com/knsv/mermaid/issues/630)
- Flowchart labels appear "cutoff" [\#628](https://github.com/knsv/mermaid/issues/628)
- Uncaught TypeError: \_.constant is not a function \(mermaid.js\) [\#626](https://github.com/knsv/mermaid/issues/626)
- Missing tags and releases for newer versions [\#623](https://github.com/knsv/mermaid/issues/623)
- Mermaid and Leo / Leo Vue [\#622](https://github.com/knsv/mermaid/issues/622)
- mermaidAPI gantt Vue.js [\#621](https://github.com/knsv/mermaid/issues/621)
- Gantt sections are not separated by colors - Fix: set numberSectionStyles to 4 instead of 3 [\#620](https://github.com/knsv/mermaid/issues/620)
- how to get mermaidAPI? [\#617](https://github.com/knsv/mermaid/issues/617)
- Error in startOnLoad documentation? [\#616](https://github.com/knsv/mermaid/issues/616)
- Example export to SVG generates error [\#614](https://github.com/knsv/mermaid/issues/614)
- The new online editor does not support previously generated links [\#613](https://github.com/knsv/mermaid/issues/613)
- Grammar / Syntax documentation for flowcharts [\#607](https://github.com/knsv/mermaid/issues/607)
- Mermaid does not work with d3.js [\#606](https://github.com/knsv/mermaid/issues/606)
- Why does this code's flowchart lines get cut-off on screen? [\#604](https://github.com/knsv/mermaid/issues/604)
- click keyword does not fire my callback \(on the demo Website too\) [\#603](https://github.com/knsv/mermaid/issues/603)
- Online Editor fails to show exported SVG [\#601](https://github.com/knsv/mermaid/issues/601)
- Just saying thanks! [\#597](https://github.com/knsv/mermaid/issues/597)
- stylesheet crashed with other library like abcjs [\#596](https://github.com/knsv/mermaid/issues/596)
- Missing connection [\#594](https://github.com/knsv/mermaid/issues/594)
- How to use mermaid on node.js restful api? [\#593](https://github.com/knsv/mermaid/issues/593)
- Remove status code [\#589](https://github.com/knsv/mermaid/issues/589)
- Golang based editor [\#588](https://github.com/knsv/mermaid/issues/588)
- sequenceDiagram -\> notetext css font is hardcoded [\#587](https://github.com/knsv/mermaid/issues/587)
- Multiple graph in the live editor [\#586](https://github.com/knsv/mermaid/issues/586)
- All \<svg\> elements in page are colored black [\#584](https://github.com/knsv/mermaid/issues/584)
- Styling: classes aren't applied to elements. [\#582](https://github.com/knsv/mermaid/issues/582)
- Rounded connections [\#580](https://github.com/knsv/mermaid/issues/580)
- Arrows are not being shown correctly in the dark theme [\#578](https://github.com/knsv/mermaid/issues/578)
- The documentation for CLI seems outdated. [\#572](https://github.com/knsv/mermaid/issues/572)
- No effect of click event:can not open link [\#571](https://github.com/knsv/mermaid/issues/571)
- Text colors are not correct in VSCODE [\#570](https://github.com/knsv/mermaid/issues/570)
- Nodes aren't aligned properly \(just need an explanation\) [\#568](https://github.com/knsv/mermaid/issues/568)
- setting margin around figure in R [\#567](https://github.com/knsv/mermaid/issues/567)
- Arrows should Come out in upward and Downward direction from decision Node [\#566](https://github.com/knsv/mermaid/issues/566)
- TypeError: Cannot read property 'select' of undefined [\#563](https://github.com/knsv/mermaid/issues/563)
- A little bug [\#557](https://github.com/knsv/mermaid/issues/557)
- Japanese text appears garbled [\#554](https://github.com/knsv/mermaid/issues/554)
- classdiagram not works in mermaid live_editor [\#553](https://github.com/knsv/mermaid/issues/553)
- font awesome in link text? [\#546](https://github.com/knsv/mermaid/issues/546)
- q: heard of the cosmogol standard? [\#545](https://github.com/knsv/mermaid/issues/545)
- Arrow heads missing \(cli, 7.0.3\) [\#544](https://github.com/knsv/mermaid/issues/544)
- No Edge Boxes if useHtmlLabels=false [\#541](https://github.com/knsv/mermaid/issues/541)
- how to change mermaid text color or line text block color？ [\#534](https://github.com/knsv/mermaid/issues/534)
- FlowChart visualization broken when downloading from live editor [\#533](https://github.com/knsv/mermaid/issues/533)
- Can't get flowchart to render paths at the top of the diagram; I even tried the online editor and that shows the same issue. Thoughts? [\#532](https://github.com/knsv/mermaid/issues/532)
- live editor make browser\(safari on macOS&iOS\) not longer respond [\#531](https://github.com/knsv/mermaid/issues/531)
- css classes need a prefix/namespace [\#527](https://github.com/knsv/mermaid/issues/527)
- input activate/deactivate cause safari unresponding [\#521](https://github.com/knsv/mermaid/issues/521)
- Cannot Render the Mermaid Graph to PDF ? [\#520](https://github.com/knsv/mermaid/issues/520)
- clicking links works from inset in subgraph but not from nodes [\#516](https://github.com/knsv/mermaid/issues/516)
- Strange syntax error - when importing mermaid.js [\#515](https://github.com/knsv/mermaid/issues/515)
- gantt x-axis display [\#510](https://github.com/knsv/mermaid/issues/510)
- phantomjs renamed to phantomjs-prebuilt [\#508](https://github.com/knsv/mermaid/issues/508)
- issue when using sphinxcontrib-mermaid extension for sphinx [\#507](https://github.com/knsv/mermaid/issues/507)
- layout of docs page looks broken [\#504](https://github.com/knsv/mermaid/issues/504)
- Problem showing graph with php on localhost [\#502](https://github.com/knsv/mermaid/issues/502)
- logLevel's option doesnt work at 7.0.0 [\#501](https://github.com/knsv/mermaid/issues/501)
- How do I get the log for a render or parse attempt? [\#500](https://github.com/knsv/mermaid/issues/500)
- Mermaid neutral style to built in latest release [\#499](https://github.com/knsv/mermaid/issues/499)
- Any plans for adding a typescript definition file? [\#495](https://github.com/knsv/mermaid/issues/495)
- Gantt diagrams too narrow [\#493](https://github.com/knsv/mermaid/issues/493)
- Flowchart edge labels placement [\#490](https://github.com/knsv/mermaid/issues/490)
- Very different styles when rendering as png vs. svg [\#489](https://github.com/knsv/mermaid/issues/489)
- New editor that supports mermaid: Caret [\#488](https://github.com/knsv/mermaid/issues/488)
- Gant PNG margin [\#486](https://github.com/knsv/mermaid/issues/486)
- ReferenceError: window is not defined [\#485](https://github.com/knsv/mermaid/issues/485)
- Menu and layout bugs in docs [\#484](https://github.com/knsv/mermaid/issues/484)
- Mermaid resets some of the page CSS styles [\#482](https://github.com/knsv/mermaid/issues/482)
- Arrows rendering incorrectly in online editor [\#480](https://github.com/knsv/mermaid/issues/480)
- CSS stroke-dasharray ignored by browsers but not other viewers [\#474](https://github.com/knsv/mermaid/issues/474)
- mermaid - Browser Support issue [\#472](https://github.com/knsv/mermaid/issues/472)
- Totally love mermaid I might pop! [\#471](https://github.com/knsv/mermaid/issues/471)
- Sequence Diagram: Missing x on async arrows \(png\) [\#469](https://github.com/knsv/mermaid/issues/469)
- live editor: the svg file rendered from graph is not supported by browsers [\#468](https://github.com/knsv/mermaid/issues/468)
- Not found css [\#462](https://github.com/knsv/mermaid/issues/462)
- Phantomjs Dependency [\#461](https://github.com/knsv/mermaid/issues/461)
- Mermaid cli not working for subgraphs [\#459](https://github.com/knsv/mermaid/issues/459)
- Support for notes across multiple participants? [\#458](https://github.com/knsv/mermaid/issues/458)
- Related to Issue \#329: Phantomjs issues. [\#455](https://github.com/knsv/mermaid/issues/455)
- Add a click style [\#426](https://github.com/knsv/mermaid/issues/426)
- Add Parallel block \(par\) to sequence diagrams [\#425](https://github.com/knsv/mermaid/issues/425)
- updating shapes after the flow chart rendering complete [\#424](https://github.com/knsv/mermaid/issues/424)
- can't catch parse error Maximum call stack size exceeded on safari [\#421](https://github.com/knsv/mermaid/issues/421)
- Arrows endings are missing [\#419](https://github.com/knsv/mermaid/issues/419)
- shouldn't mermaid become more like Markdown ? [\#417](https://github.com/knsv/mermaid/issues/417)
- Live editor show rendered diagram if syntax invalid [\#415](https://github.com/knsv/mermaid/issues/415)
- Live editor sticky sidebar [\#414](https://github.com/knsv/mermaid/issues/414)
- Linkstyle stroke does not work [\#410](https://github.com/knsv/mermaid/issues/410)
- flowchart id's with dots in them .. break links [\#408](https://github.com/knsv/mermaid/issues/408)
- Flowchart: Link text beginning with lowercase 'o' causes flowchart to break [\#407](https://github.com/knsv/mermaid/issues/407)
- Some chinese character will case Safari no responding. [\#405](https://github.com/knsv/mermaid/issues/405)
- Cannot center-justify text in nodes? [\#397](https://github.com/knsv/mermaid/issues/397)
- Edge labels should have white background in live editor [\#396](https://github.com/knsv/mermaid/issues/396)
- Live editor does not support activate/deactivate [\#394](https://github.com/knsv/mermaid/issues/394)
- Styling subgraph? [\#391](https://github.com/knsv/mermaid/issues/391)
- Update live editor to version 6.0.0 [\#387](https://github.com/knsv/mermaid/issues/387)
- sequence diagram config issue [\#385](https://github.com/knsv/mermaid/issues/385)
- How to add newline in the text [\#384](https://github.com/knsv/mermaid/issues/384)
- PhantomJS crashes on a large graph [\#380](https://github.com/knsv/mermaid/issues/380)
- Finnish support for class diagrams using plantuml syntax [\#377](https://github.com/knsv/mermaid/issues/377)
- mermaidAPI.render generated different svg code from mermaid.int\(\) [\#374](https://github.com/knsv/mermaid/issues/374)
- Put your own action on the chart [\#372](https://github.com/knsv/mermaid/issues/372)
- when declaring participants the elements are generated twice [\#370](https://github.com/knsv/mermaid/issues/370)
- Example Flowchart is cut in display \(Chrome\). [\#368](https://github.com/knsv/mermaid/issues/368)
- Add shebang support to diagrams [\#365](https://github.com/knsv/mermaid/issues/365)
- Silencing CLI output [\#352](https://github.com/knsv/mermaid/issues/352)
- SequenceDiagram: 3+ Alternative Paths [\#348](https://github.com/knsv/mermaid/issues/348)
- Smaller height of actor boxes [\#342](https://github.com/knsv/mermaid/issues/342)
- Question: lib/phantomscript.js - foreignObjects in SVG - related to \#58 [\#340](https://github.com/knsv/mermaid/issues/340)
- npm test fails on osx being blocked at Can not load "PhantomJS", it is not registered! [\#337](https://github.com/knsv/mermaid/issues/337)
- Tabs & subgraphs cause rendering error [\#336](https://github.com/knsv/mermaid/issues/336)
- Display question: right angles [\#335](https://github.com/knsv/mermaid/issues/335)
- No Arrows rendered v0.5.8 [\#330](https://github.com/knsv/mermaid/issues/330)
- mermaid -v filename.mmd gives You must specify at least one source file. [\#328](https://github.com/knsv/mermaid/issues/328)
- You had errors in your syntax. Use --help for further information. [\#327](https://github.com/knsv/mermaid/issues/327)
- Allow alternate arrow syntax that doesn't close html comments [\#322](https://github.com/knsv/mermaid/issues/322)
- Comment in subgraph [\#319](https://github.com/knsv/mermaid/issues/319)
- Update graph [\#311](https://github.com/knsv/mermaid/issues/311)
- css conflicts with boostrap's css [\#308](https://github.com/knsv/mermaid/issues/308)
- Can not get click event to fire. [\#306](https://github.com/knsv/mermaid/issues/306)
- Fix phantomjs2 compatibility [\#304](https://github.com/knsv/mermaid/issues/304)
- Flowcharts do not work in native IE11 [\#303](https://github.com/knsv/mermaid/issues/303)
- Integration with remark.js - tutorial added [\#302](https://github.com/knsv/mermaid/issues/302)
- Theme for dark background [\#301](https://github.com/knsv/mermaid/issues/301)
- Sequence diagram Loops: changing boxMargin spoils the "loop" notation [\#299](https://github.com/knsv/mermaid/issues/299)
- src/mermaid.js generates bad code [\#297](https://github.com/knsv/mermaid/issues/297)
- Fresh fork: jasmine tests fail [\#294](https://github.com/knsv/mermaid/issues/294)
- CSS clash [\#292](https://github.com/knsv/mermaid/issues/292)
- Mermaid does not work in Chrome 48 [\#281](https://github.com/knsv/mermaid/issues/281)
- node click is not effective [\#272](https://github.com/knsv/mermaid/issues/272)
- circle and ellipse cannot change color by classDef [\#271](https://github.com/knsv/mermaid/issues/271)
- \[Feature request\] gantt diagram axis format [\#269](https://github.com/knsv/mermaid/issues/269)
- Not Able to See Labels even htmlLabels:false added [\#268](https://github.com/knsv/mermaid/issues/268)
- npm run watch doesn’t work due missing dependencies [\#266](https://github.com/knsv/mermaid/issues/266)
- label out of node [\#262](https://github.com/knsv/mermaid/issues/262)
- IE11 Support issue [\#261](https://github.com/knsv/mermaid/issues/261)
- mermaid without browser [\#260](https://github.com/knsv/mermaid/issues/260)
- Insufficient capacity of gantt diagrams [\#226](https://github.com/knsv/mermaid/issues/226)
- some WARN about installion [\#222](https://github.com/knsv/mermaid/issues/222)
- Live editor offline access [\#217](https://github.com/knsv/mermaid/issues/217)
- suggest: code highlight mode config for editors [\#212](https://github.com/knsv/mermaid/issues/212)
- Uncaught RangeError: Maximum call stack size exceeded [\#189](https://github.com/knsv/mermaid/issues/189)
- Implement render function for server side rendering using phantomjs [\#169](https://github.com/knsv/mermaid/issues/169)
- Styling label texts [\#50](https://github.com/knsv/mermaid/issues/50)
- Graphviz DOT syntax [\#5](https://github.com/knsv/mermaid/issues/5)

**Merged pull requests:**

- Remove console.log in classDB. [\#861](https://github.com/knsv/mermaid/pull/861) ([Arthaey](https://github.com/Arthaey))
- Bump sshpk from 1.13.1 to 1.16.1 [\#851](https://github.com/knsv/mermaid/pull/851) ([dependabot[bot]](https://github.com/apps/dependabot))
- Significantly smaller bundles [\#850](https://github.com/knsv/mermaid/pull/850) ([fabiospampinato](https://github.com/fabiospampinato))
- Support styling of subgraphs [\#845](https://github.com/knsv/mermaid/pull/845) ([Qix-](https://github.com/Qix-))
- fix dark theme loop labels not visible [\#837](https://github.com/knsv/mermaid/pull/837) ([jnnnnn](https://github.com/jnnnnn))
- fix draw function can only call once [\#832](https://github.com/knsv/mermaid/pull/832) ([vaniship](https://github.com/vaniship))
- Fix dotted lines not appearing in flowcharts when HTML labels disabled [\#828](https://github.com/knsv/mermaid/pull/828) ([stanhu](https://github.com/stanhu))
- Fix issue with XML line breaks inside vertex labels [\#824](https://github.com/knsv/mermaid/pull/824) ([jsyang](https://github.com/jsyang))
- fixed diagrams [\#810](https://github.com/knsv/mermaid/pull/810) ([0xflotus](https://github.com/0xflotus))
- Clickable gantt tasks [\#804](https://github.com/knsv/mermaid/pull/804) ([abzicht](https://github.com/abzicht))
- linkStyle now supports list of indexes with a few tests [\#798](https://github.com/knsv/mermaid/pull/798) ([ivan-danilov](https://github.com/ivan-danilov))
- fix class diagram mermaid [\#795](https://github.com/knsv/mermaid/pull/795) ([DanShai](https://github.com/DanShai))
- Added exclude weekdays to definition [\#792](https://github.com/knsv/mermaid/pull/792) ([jopapo](https://github.com/jopapo))
- SVG link rendering [\#791](https://github.com/knsv/mermaid/pull/791) ([flying-sheep](https://github.com/flying-sheep))
- Gantt milestones [\#788](https://github.com/knsv/mermaid/pull/788) ([gijswijs](https://github.com/gijswijs))
- Remove duplicate code [\#768](https://github.com/knsv/mermaid/pull/768) ([znxkznxk1030](https://github.com/znxkznxk1030))
- Render nodes as real links [\#765](https://github.com/knsv/mermaid/pull/765) ([flying-sheep](https://github.com/flying-sheep))
- Support Multi-line Actor Descriptions [\#764](https://github.com/knsv/mermaid/pull/764) ([watsoncj](https://github.com/watsoncj))
- Fix issue with marker-end. [\#757](https://github.com/knsv/mermaid/pull/757) ([gjlubbertsen](https://github.com/gjlubbertsen))
- Make Class Diagrams usable in Stackedit and Live Editor [\#749](https://github.com/knsv/mermaid/pull/749) ([monsterkrampe](https://github.com/monsterkrampe))
- Sequence numbers [\#722](https://github.com/knsv/mermaid/pull/722) ([paulbland](https://github.com/paulbland))
- Add option for right angles [\#721](https://github.com/knsv/mermaid/pull/721) ([paulbland](https://github.com/paulbland))
- Add nested activation classes [\#720](https://github.com/knsv/mermaid/pull/720) ([paulbland](https://github.com/paulbland))
- wip: class diagram cardinality display [\#705](https://github.com/knsv/mermaid/pull/705) ([Vrixyz](https://github.com/Vrixyz))
- add comments about CSS in config [\#688](https://github.com/knsv/mermaid/pull/688) ([imma90](https://github.com/imma90))
- SequenceDiagram: Add support for multiple alt else statements [\#641](https://github.com/knsv/mermaid/pull/641) ([sechel](https://github.com/sechel))
- fix \#426 - add class .clickable on nodes with click function or link [\#598](https://github.com/knsv/mermaid/pull/598) ([thomasleveil](https://github.com/thomasleveil))
- Spec fix 1 [\#595](https://github.com/knsv/mermaid/pull/595) ([frankschmitt](https://github.com/frankschmitt))

## [7.0.5](https://github.com/knsv/mermaid/tree/7.0.5) (2017-09-01)

[Full Changelog](https://github.com/knsv/mermaid/compare/7.0.3...7.0.5)

**Closed issues:**

- live editor latin error after update [\#560](https://github.com/knsv/mermaid/issues/560)
- Simple full example in online documentation is broken [\#558](https://github.com/knsv/mermaid/issues/558)
- Graph No Arrow Head v7.0.3 [\#543](https://github.com/knsv/mermaid/issues/543)
- Conflict while using mermaid along with core-js [\#512](https://github.com/knsv/mermaid/issues/512)
- Export to pdf on website [\#496](https://github.com/knsv/mermaid/issues/496)
- New downstream project: Mermaid Preview for VSCode [\#442](https://github.com/knsv/mermaid/issues/442)
- Can't Zoom the flowchart ? [\#399](https://github.com/knsv/mermaid/issues/399)
- line labels are not rendered correctly in live editor [\#366](https://github.com/knsv/mermaid/issues/366)
- mermaid-loader [\#361](https://github.com/knsv/mermaid/issues/361)
- Are there any documentation or examples for classDiagram and gitGraph? [\#359](https://github.com/knsv/mermaid/issues/359)
- \# character broken in 0.5.8 [\#347](https://github.com/knsv/mermaid/issues/347)
- Documentation issue: CSS example is not visible [\#345](https://github.com/knsv/mermaid/issues/345)
- Include documentation for command line usage [\#326](https://github.com/knsv/mermaid/issues/326)
- Fresh fork: can't build dist [\#296](https://github.com/knsv/mermaid/issues/296)
- Invalid value for \<svg\> attribute viewBox="0 0 -Infinity -Infinity" [\#291](https://github.com/knsv/mermaid/issues/291)
- Webpack require fails [\#277](https://github.com/knsv/mermaid/issues/277)
- New documentation - need improved logo [\#216](https://github.com/knsv/mermaid/issues/216)

## [7.0.3](https://github.com/knsv/mermaid/tree/7.0.3) (2017-06-04)

[Full Changelog](https://github.com/knsv/mermaid/compare/7.0.2...7.0.3)

**Closed issues:**

- the documentation website is down [\#539](https://github.com/knsv/mermaid/issues/539)
- Good example of interactivity with mermaidAPI [\#514](https://github.com/knsv/mermaid/issues/514)

## [7.0.2](https://github.com/knsv/mermaid/tree/7.0.2) (2017-06-01)

[Full Changelog](https://github.com/knsv/mermaid/compare/7.0.0...7.0.2)

**Closed issues:**

- CDN is not working [\#511](https://github.com/knsv/mermaid/issues/511)
- A sampe sequenceDiagram crashes mermaid-cli [\#492](https://github.com/knsv/mermaid/issues/492)
- Mermaid doesn't delete nodes when called multiple times [\#491](https://github.com/knsv/mermaid/issues/491)
- API crashes on 2nd render\(\) call [\#478](https://github.com/knsv/mermaid/issues/478)
- sequenceDiagram: dotted line for alt and empty bracket should be hidden [\#456](https://github.com/knsv/mermaid/issues/456)
- SVG output \(almost\) not correct [\#434](https://github.com/knsv/mermaid/issues/434)
- How to set axisFormatter of gantt in mermaid CLI? [\#428](https://github.com/knsv/mermaid/issues/428)
- customizing link style with any color sets `fill` property to `black` instead of `none` [\#416](https://github.com/knsv/mermaid/issues/416)
- New line at the end of SVG file [\#400](https://github.com/knsv/mermaid/issues/400)
- CLI doesn't work [\#389](https://github.com/knsv/mermaid/issues/389)
- Can't render subgraphs with htmlLabels: false [\#367](https://github.com/knsv/mermaid/issues/367)
- Color arrowhead [\#362](https://github.com/knsv/mermaid/issues/362)
- CLI: Invisible text, lines in SVG output [\#341](https://github.com/knsv/mermaid/issues/341)

**Merged pull requests:**

- Update Travis config [\#538](https://github.com/knsv/mermaid/pull/538) ([tylerlong](https://github.com/tylerlong))
- Fix spelling of 'you' in sequenceDiagram docs [\#537](https://github.com/knsv/mermaid/pull/537) ([ctruelson](https://github.com/ctruelson))
- Improve CLI output [\#536](https://github.com/knsv/mermaid/pull/536) ([gibson042](https://github.com/gibson042))
- Modernize mermaid [\#524](https://github.com/knsv/mermaid/pull/524) ([tylerlong](https://github.com/tylerlong))
- Modernize mermaid [\#519](https://github.com/knsv/mermaid/pull/519) ([tylerlong](https://github.com/tylerlong))
- Update CLI instructions [\#509](https://github.com/knsv/mermaid/pull/509) ([filipedeschamps](https://github.com/filipedeschamps))
- Add style for classDiagram to dark/default theme [\#503](https://github.com/knsv/mermaid/pull/503) ([yudenzel](https://github.com/yudenzel))
- Fix documentation for git graph. [\#498](https://github.com/knsv/mermaid/pull/498) ([gomlgs](https://github.com/gomlgs))
- Fix links in documentations [\#497](https://github.com/knsv/mermaid/pull/497) ([saveman71](https://github.com/saveman71))
- Update README.md with git graph sample [\#481](https://github.com/knsv/mermaid/pull/481) ([raghur](https://github.com/raghur))
- Fix misspelling of “another” [\#479](https://github.com/knsv/mermaid/pull/479) ([stevenschobert](https://github.com/stevenschobert))
- Fixed \#456 sequenceDiagram: dotted line for alt and empty bracket sho… [\#477](https://github.com/knsv/mermaid/pull/477) ([brookhong](https://github.com/brookhong))
- Add viewbox attr to class diagram [\#473](https://github.com/knsv/mermaid/pull/473) ([gnkm](https://github.com/gnkm))
- add par statement to sequenceDiagram [\#470](https://github.com/knsv/mermaid/pull/470) ([u-minor](https://github.com/u-minor))

## [7.0.0](https://github.com/knsv/mermaid/tree/7.0.0) (2017-01-29)

[Full Changelog](https://github.com/knsv/mermaid/compare/6.0.0...7.0.0)

**Closed issues:**

- demos on io site not working [\#466](https://github.com/knsv/mermaid/issues/466)
- Can not be generated PNG pictures through CLI with Chinese [\#451](https://github.com/knsv/mermaid/issues/451)
- Round nodes cannot be styled with CSS classes [\#443](https://github.com/knsv/mermaid/issues/443)
- webpack gulp UglifyJsPlugin error. [\#440](https://github.com/knsv/mermaid/issues/440)
- String concatenation isn't working [\#432](https://github.com/knsv/mermaid/issues/432)
- text flow/wrap in actor box of sequence diagram [\#422](https://github.com/knsv/mermaid/issues/422)
- Online live editor still use old version [\#402](https://github.com/knsv/mermaid/issues/402)
- uncaught TypeError: t.getTransformToElement is not a function [\#401](https://github.com/knsv/mermaid/issues/401)
- Only works when using browserify'd code [\#373](https://github.com/knsv/mermaid/issues/373)
- document the use of shebang line in mmd files [\#364](https://github.com/knsv/mermaid/issues/364)
- Diagrams are small and unreadable in IE 11 - since 0.5.1 [\#356](https://github.com/knsv/mermaid/issues/356)
- \[Feature Request\] ER-Diagram Support [\#354](https://github.com/knsv/mermaid/issues/354)
- npm install -g mermaid does not install phantomjs [\#329](https://github.com/knsv/mermaid/issues/329)
- activation boxes [\#313](https://github.com/knsv/mermaid/issues/313)
- The need for mermaid.css should be mentioned explicitly in the intro docs... [\#273](https://github.com/knsv/mermaid/issues/273)

**Merged pull requests:**

- Update index.html [\#465](https://github.com/knsv/mermaid/pull/465) ([bmsleight](https://github.com/bmsleight))
- Fix for \#416, customizing link style with any color sets `fill` property to `black` instead of `none` [\#452](https://github.com/knsv/mermaid/pull/452) ([joshuacolvin](https://github.com/joshuacolvin))
- Allow .node\>circle to receive css styles [\#449](https://github.com/knsv/mermaid/pull/449) ([bfriedz](https://github.com/bfriedz))
- Fix spelling [\#447](https://github.com/knsv/mermaid/pull/447) ([jawn](https://github.com/jawn))
- added tests and fix cli css style selector lowercase problem [\#445](https://github.com/knsv/mermaid/pull/445) ([whyzdev](https://github.com/whyzdev))
- Update d3.js [\#441](https://github.com/knsv/mermaid/pull/441) ([hetz](https://github.com/hetz))
- adde tests to reproduce \#434 in flowchart [\#439](https://github.com/knsv/mermaid/pull/439) ([whyzdev](https://github.com/whyzdev))
- Code Climate config [\#437](https://github.com/knsv/mermaid/pull/437) ([larkinscott](https://github.com/larkinscott))
- fix gantt and sequence digram cli cfg [\#435](https://github.com/knsv/mermaid/pull/435) ([whyzdev](https://github.com/whyzdev))
- fix gantt chart cli configuration broken [\#433](https://github.com/knsv/mermaid/pull/433) ([whyzdev](https://github.com/whyzdev))
- fix gantt chart cli configuration parsing including functions [\#430](https://github.com/knsv/mermaid/pull/430) ([whyzdev](https://github.com/whyzdev))
- Uses an empty text node instead of a string for svg group labels [\#429](https://github.com/knsv/mermaid/pull/429) ([daveaglick](https://github.com/daveaglick))
- use tspan via d3.textwrap to place actor text in sequence diagram [\#427](https://github.com/knsv/mermaid/pull/427) ([whyzdev](https://github.com/whyzdev))
- \#422 use foreignObject/div to place actor label in sequence diagram [\#423](https://github.com/knsv/mermaid/pull/423) ([whyzdev](https://github.com/whyzdev))
- Clarify the need for a CSS stylesheet [\#413](https://github.com/knsv/mermaid/pull/413) ([sifb](https://github.com/sifb))
- Added hads downstream project [\#412](https://github.com/knsv/mermaid/pull/412) ([sinedied](https://github.com/sinedied))
- update usage and fix \#273 [\#406](https://github.com/knsv/mermaid/pull/406) ([jinntrance](https://github.com/jinntrance))
- Add https://github.com/raghur/mermaid-filter to downstream projects docs page [\#404](https://github.com/knsv/mermaid/pull/404) ([raghur](https://github.com/raghur))
- New neutral theme [\#395](https://github.com/knsv/mermaid/pull/395) ([sinedied](https://github.com/sinedied))
- fix cli issues [\#390](https://github.com/knsv/mermaid/pull/390) ([ben-page](https://github.com/ben-page))
- Add missing space for 'Labels out of bounds' section [\#386](https://github.com/knsv/mermaid/pull/386) ([The-Alchemist](https://github.com/The-Alchemist))
- Fix typo: `pats` -\> `paths` [\#382](https://github.com/knsv/mermaid/pull/382) ([swhgoon](https://github.com/swhgoon))
- Added class diagram example to README.md [\#379](https://github.com/knsv/mermaid/pull/379) ([HustLion](https://github.com/HustLion))
- override normal flowchart arrowhead to allow css styling [\#376](https://github.com/knsv/mermaid/pull/376) ([dodoinblue](https://github.com/dodoinblue))
- added sphinx extension [\#371](https://github.com/knsv/mermaid/pull/371) ([mgaitan](https://github.com/mgaitan))
- Fix typo in the sequence diagram documentation [\#369](https://github.com/knsv/mermaid/pull/369) ([ggpasqualino](https://github.com/ggpasqualino))

## [6.0.0](https://github.com/knsv/mermaid/tree/6.0.0) (2016-05-29)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.5.8...6.0.0)

**Closed issues:**

- Docs css: code hard to read [\#324](https://github.com/knsv/mermaid/issues/324)
- About Markpad integration [\#323](https://github.com/knsv/mermaid/issues/323)
- How to link backwards in flowchat? [\#321](https://github.com/knsv/mermaid/issues/321)
- Help with editor [\#310](https://github.com/knsv/mermaid/issues/310)
- +1 [\#293](https://github.com/knsv/mermaid/issues/293)
- Basic chart does not render on Chome, but does in Firefox [\#290](https://github.com/knsv/mermaid/issues/290)
- Live editor is broken [\#285](https://github.com/knsv/mermaid/issues/285)
- "No such file or directory" trying to run mermaid 0.5.7 on OS X [\#284](https://github.com/knsv/mermaid/issues/284)
- participant name as "Long Long Name" [\#283](https://github.com/knsv/mermaid/issues/283)
- Windows - cli - could not find phantomjs at the specified path [\#236](https://github.com/knsv/mermaid/issues/236)

**Merged pull requests:**

- The option of gantt for the spaces for the section names. [\#353](https://github.com/knsv/mermaid/pull/353) ([zeroyonichihachi](https://github.com/zeroyonichihachi))
- Gitgraph: Make reset work with parent ref carets [\#350](https://github.com/knsv/mermaid/pull/350) ([raghur](https://github.com/raghur))
- Remove the text-shadows that make the text look blurry [\#349](https://github.com/knsv/mermaid/pull/349) ([AsaAyers](https://github.com/AsaAyers))
- add line interpolation to linkStyle in flowchart [\#346](https://github.com/knsv/mermaid/pull/346) ([AlanHohn](https://github.com/AlanHohn))
- Support git graph diagrams in mermaid [\#344](https://github.com/knsv/mermaid/pull/344) ([raghur](https://github.com/raghur))
- Build and test execution changes [\#338](https://github.com/knsv/mermaid/pull/338) ([ssbarnea](https://github.com/ssbarnea))
- Reformatting of css files [\#331](https://github.com/knsv/mermaid/pull/331) ([Jmuccigr](https://github.com/Jmuccigr))
- \(WIP\) Sequence Diagram Title Support [\#320](https://github.com/knsv/mermaid/pull/320) ([bronsoja](https://github.com/bronsoja))
- activations doc + few fixes [\#318](https://github.com/knsv/mermaid/pull/318) ([ciekawy](https://github.com/ciekawy))
- Dark theme for better contrast on darker backgrounds [\#317](https://github.com/knsv/mermaid/pull/317) ([crodriguez1a](https://github.com/crodriguez1a))
- Activations [\#316](https://github.com/knsv/mermaid/pull/316) ([ciekawy](https://github.com/ciekawy))
- Support leading comments for sequenceDiagrams [\#312](https://github.com/knsv/mermaid/pull/312) ([ashsearle](https://github.com/ashsearle))
- Show a little lenience for white-space around names [\#309](https://github.com/knsv/mermaid/pull/309) ([ashsearle](https://github.com/ashsearle))
- Update list of downstream projects [\#307](https://github.com/knsv/mermaid/pull/307) ([maxArturo](https://github.com/maxArturo))
- Issue 299: Sequence diagram Loops: changing boxMargin spoils the "loop" notation [\#300](https://github.com/knsv/mermaid/pull/300) ([LarryKlugerDS](https://github.com/LarryKlugerDS))
- Issue 297 - src/mermaid.js generates bad code [\#298](https://github.com/knsv/mermaid/pull/298) ([LarryKlugerDS](https://github.com/LarryKlugerDS))
- Updated instructions for running tests [\#295](https://github.com/knsv/mermaid/pull/295) ([LarryKlugerDS](https://github.com/LarryKlugerDS))
- Add Markdown Plus to Downstream projects [\#288](https://github.com/knsv/mermaid/pull/288) ([tylerlong](https://github.com/tylerlong))
- Quote phantomPath so that it doesn't fail on window [\#286](https://github.com/knsv/mermaid/pull/286) ([raghur](https://github.com/raghur))

## [0.5.8](https://github.com/knsv/mermaid/tree/0.5.8) (2016-01-27)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.5.7...0.5.8)

## [0.5.7](https://github.com/knsv/mermaid/tree/0.5.7) (2016-01-25)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.5.6...0.5.7)

**Closed issues:**

- Mermaid + LightPaper = ❤️ [\#280](https://github.com/knsv/mermaid/issues/280)
- Bower Integration [\#278](https://github.com/knsv/mermaid/issues/278)
- Mermaid breaks when variables end in 'v' [\#276](https://github.com/knsv/mermaid/issues/276)
- sequence diagrams don't support participant aliasing [\#263](https://github.com/knsv/mermaid/issues/263)
- One diagram that fails to render stops further execution on the page [\#259](https://github.com/knsv/mermaid/issues/259)
- Where to find line layout algorithm? [\#258](https://github.com/knsv/mermaid/issues/258)
- Compatibility with node.js [\#257](https://github.com/knsv/mermaid/issues/257)
- Label resizing with dynamically loaded fonts [\#255](https://github.com/knsv/mermaid/issues/255)
- SVG arrowheads are broken in the CLI [\#249](https://github.com/knsv/mermaid/issues/249)
- Cannot read property 'replace' of undefined [\#239](https://github.com/knsv/mermaid/issues/239)

**Merged pull requests:**

- gh-50 Allow styling of edge labels in css [\#267](https://github.com/knsv/mermaid/pull/267) ([Anoia](https://github.com/Anoia))
- Allow sequenceDiagram participant aliasing [\#265](https://github.com/knsv/mermaid/pull/265) ([gibson042](https://github.com/gibson042))

## [0.5.6](https://github.com/knsv/mermaid/tree/0.5.6) (2015-11-22)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.5.5...0.5.6)

**Closed issues:**

- title doesn't work in sequenceDiagram [\#248](https://github.com/knsv/mermaid/issues/248)
- hypen-minus should be valid in sequence diagram alt/else/etc. descriptions [\#247](https://github.com/knsv/mermaid/issues/247)
- Broken in firefox? [\#245](https://github.com/knsv/mermaid/issues/245)
- When there is a Chinese symbol in the flowchart, it will crash。 [\#238](https://github.com/knsv/mermaid/issues/238)
- Non-alpha characters included in ALPHA token \(flow graph jison\) [\#232](https://github.com/knsv/mermaid/issues/232)
- subgraph not rendering with change to sample [\#231](https://github.com/knsv/mermaid/issues/231)
- sequence diagram requires a new line at the end? [\#229](https://github.com/knsv/mermaid/issues/229)
- Live Editor: Permalink address not being parsed [\#202](https://github.com/knsv/mermaid/issues/202)
- Add download SVG link to the live editor [\#144](https://github.com/knsv/mermaid/issues/144)

**Merged pull requests:**

- Make sequenceDiagram terminal newline optional [\#253](https://github.com/knsv/mermaid/pull/253) ([gibson042](https://github.com/gibson042))
- Support sequenceDiagram "over" notes [\#252](https://github.com/knsv/mermaid/pull/252) ([gibson042](https://github.com/gibson042))
- Properly handle "rest of line" statements [\#251](https://github.com/knsv/mermaid/pull/251) ([gibson042](https://github.com/gibson042))
- CLI: Propagate exit code from lib \(i.e., phantomjs\) [\#250](https://github.com/knsv/mermaid/pull/250) ([gibson042](https://github.com/gibson042))
- flowRender.js - Fix FontAwesome icon insert [\#244](https://github.com/knsv/mermaid/pull/244) ([ma-zal](https://github.com/ma-zal))
- updated sequence diagram link in live editor [\#242](https://github.com/knsv/mermaid/pull/242) ([r-a-v-a-s](https://github.com/r-a-v-a-s))
- updated links in README.md [\#240](https://github.com/knsv/mermaid/pull/240) ([r-a-v-a-s](https://github.com/r-a-v-a-s))
- Ellipse syntax [\#237](https://github.com/knsv/mermaid/pull/237) ([spect88](https://github.com/spect88))
- Allow keywords as suffixes of node ids [\#235](https://github.com/knsv/mermaid/pull/235) ([spect88](https://github.com/spect88))
- Highlighted the editor in the nav [\#234](https://github.com/knsv/mermaid/pull/234) ([knsv](https://github.com/knsv))
- Live editor tweaks [\#233](https://github.com/knsv/mermaid/pull/233) ([spect88](https://github.com/spect88))
- Add a Gitter chat badge to README.md [\#230](https://github.com/knsv/mermaid/pull/230) ([gitter-badger](https://github.com/gitter-badger))

## [0.5.5](https://github.com/knsv/mermaid/tree/0.5.5) (2015-10-21)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.5.4...0.5.5)

**Closed issues:**

- sequence diagram, arrowhead instead of crosshead [\#227](https://github.com/knsv/mermaid/issues/227)

**Merged pull requests:**

- Fix a typo: crosshead --\> arrowhead [\#228](https://github.com/knsv/mermaid/pull/228) ([tylerlong](https://github.com/tylerlong))

## [0.5.4](https://github.com/knsv/mermaid/tree/0.5.4) (2015-10-19)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.5.3...0.5.4)

**Closed issues:**

- Weird bug in live editor when using words with substring `end` [\#184](https://github.com/knsv/mermaid/issues/184)
- Custom icons [\#15](https://github.com/knsv/mermaid/issues/15)
- Marker-end arrow cannot be shown for URL with query parameter [\#225](https://github.com/knsv/mermaid/issues/225)
- Please update bower's D3 version [\#221](https://github.com/knsv/mermaid/issues/221)
- Set log level from mermaid configuration [\#220](https://github.com/knsv/mermaid/issues/220)
- Width fixed to 400px [\#204](https://github.com/knsv/mermaid/issues/204)
- render to png from the cli does not display the marker-end arrow heads [\#181](https://github.com/knsv/mermaid/issues/181)
- Links in sequence diagrams [\#159](https://github.com/knsv/mermaid/issues/159)
- comment characters `%%` cause parse error [\#141](https://github.com/knsv/mermaid/issues/141)
- Add a reversed asymmetric shape [\#124](https://github.com/knsv/mermaid/issues/124)
- Add syntax for double headed arrows [\#123](https://github.com/knsv/mermaid/issues/123)
- Support for font-awesome [\#49](https://github.com/knsv/mermaid/issues/49)

**Merged pull requests:**

- Allow `end` as a substring of vertex id [\#224](https://github.com/knsv/mermaid/pull/224) ([spect88](https://github.com/spect88))
- Remove duplicate npm dependencies: d3 and he [\#223](https://github.com/knsv/mermaid/pull/223) ([spect88](https://github.com/spect88))

## [0.5.3](https://github.com/knsv/mermaid/tree/0.5.3) (2015-10-04)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.5.2...0.5.3)

## [0.5.2](https://github.com/knsv/mermaid/tree/0.5.2) (2015-10-04)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.5.1...0.5.2)

**Closed issues:**

- Installing “atom-mermaid@0.1.3” failed [\#218](https://github.com/knsv/mermaid/issues/218)
- Render mermaid code on websites? [\#215](https://github.com/knsv/mermaid/issues/215)
- Brackets in a node with text? [\#213](https://github.com/knsv/mermaid/issues/213)
- node feature request [\#211](https://github.com/knsv/mermaid/issues/211)
- Please add prefix for styles [\#208](https://github.com/knsv/mermaid/issues/208)
- Bad handling of block arguments [\#207](https://github.com/knsv/mermaid/issues/207)
- please consider port to mac osx [\#203](https://github.com/knsv/mermaid/issues/203)
- allow phantomjs \>=1.9.x [\#201](https://github.com/knsv/mermaid/issues/201)
- syntax for venn diagrams? [\#200](https://github.com/knsv/mermaid/issues/200)
- Broken CLI Graphs? \(v0.5.1\) [\#196](https://github.com/knsv/mermaid/issues/196)
- Static site does not render under HTTPS [\#194](https://github.com/knsv/mermaid/issues/194)
- Error on simple graph [\#192](https://github.com/knsv/mermaid/issues/192)
- Escape "~" [\#191](https://github.com/knsv/mermaid/issues/191)
- Trying to add link using 'click' to flowchart [\#188](https://github.com/knsv/mermaid/issues/188)
- cli: no lines and arrowheads rendered / only dotted lines [\#187](https://github.com/knsv/mermaid/issues/187)
- text of mermaid div displayed on page [\#186](https://github.com/knsv/mermaid/issues/186)
- using mermaid with laravel [\#185](https://github.com/knsv/mermaid/issues/185)
- Atom editor package [\#183](https://github.com/knsv/mermaid/issues/183)
- Auto linewrap for notes in sequence diagrams [\#178](https://github.com/knsv/mermaid/issues/178)
- Execute code after initialize [\#176](https://github.com/knsv/mermaid/issues/176)
- Autoscaling for all diagram types [\#175](https://github.com/knsv/mermaid/issues/175)
- Problem with click event callback [\#174](https://github.com/knsv/mermaid/issues/174)
- How to escape characters? [\#170](https://github.com/knsv/mermaid/issues/170)
- it can not work [\#167](https://github.com/knsv/mermaid/issues/167)
- UML Class diagram [\#154](https://github.com/knsv/mermaid/issues/154)
- Broken subgraph using the CLI [\#153](https://github.com/knsv/mermaid/issues/153)
- Support PlantUML syntax [\#149](https://github.com/knsv/mermaid/issues/149)
- IE Support issue [\#142](https://github.com/knsv/mermaid/issues/142)
- Flowchart truncated [\#140](https://github.com/knsv/mermaid/issues/140)
- Double Quote as text is not working [\#219](https://github.com/knsv/mermaid/issues/219)
- classDef / class not working with htmlLabels? [\#210](https://github.com/knsv/mermaid/issues/210)
- Links in graph missing [\#209](https://github.com/knsv/mermaid/issues/209)
- Last word in comment boxes getting cut off by word wrap library : \( [\#195](https://github.com/knsv/mermaid/issues/195)
- Escaping characters in sequence diagram [\#193](https://github.com/knsv/mermaid/issues/193)
- SVG foreignObject rendering [\#180](https://github.com/knsv/mermaid/issues/180)
- IE9 issue [\#179](https://github.com/knsv/mermaid/issues/179)
- inoperable in an AMD/requirejs environment: IPython Notebook [\#127](https://github.com/knsv/mermaid/issues/127)
- \[Parser\] Hyphen in participant name bring TypeError [\#74](https://github.com/knsv/mermaid/issues/74)
- Support for hyperlink and tooltip [\#34](https://github.com/knsv/mermaid/issues/34)

**Merged pull requests:**

- Update flowchart.md [\#214](https://github.com/knsv/mermaid/pull/214) ([orschiro](https://github.com/orschiro))
- Default style when using the CLI [\#205](https://github.com/knsv/mermaid/pull/205) ([gillesdemey](https://github.com/gillesdemey))
- Gantt chart - add minutes and seconds durations [\#198](https://github.com/knsv/mermaid/pull/198) ([dbrans](https://github.com/dbrans))
- Using QUnit for AMD testing [\#190](https://github.com/knsv/mermaid/pull/190) ([bollwyvl](https://github.com/bollwyvl))
- Update phantomscript.js [\#182](https://github.com/knsv/mermaid/pull/182) ([phairow](https://github.com/phairow))

## [0.5.1](https://github.com/knsv/mermaid/tree/0.5.1) (2015-06-21)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.5.0...0.5.1)

**Closed issues:**

- Live editor is broken [\#173](https://github.com/knsv/mermaid/issues/173)
- 0.5.0 no longer respects custom date definitions in Gantt diagrams [\#171](https://github.com/knsv/mermaid/issues/171)
- Drop label character restrictions [\#162](https://github.com/knsv/mermaid/issues/162)
- can't nest subgraphs in flowchart [\#161](https://github.com/knsv/mermaid/issues/161)
- Unable to generate gantt diagram with mermaid CLI [\#158](https://github.com/knsv/mermaid/issues/158)
- Inline css by "mermaid" [\#157](https://github.com/knsv/mermaid/issues/157)
- Finite State Machine Diagram [\#152](https://github.com/knsv/mermaid/issues/152)
- How to center align gantt diagram [\#150](https://github.com/knsv/mermaid/issues/150)
- Security concern regarding class definition [\#148](https://github.com/knsv/mermaid/issues/148)
- File Extension [\#147](https://github.com/knsv/mermaid/issues/147)
- To SVG Export [\#146](https://github.com/knsv/mermaid/issues/146)
- `setTimeout` with clusters problematic with programmatic edits and no callback [\#133](https://github.com/knsv/mermaid/issues/133)
- Possibility to set the width of the generated flowchart [\#129](https://github.com/knsv/mermaid/issues/129)
- flowchart - styling of edges via css overrides specific styles set in the graph definition [\#128](https://github.com/knsv/mermaid/issues/128)
- module.exports.cloneCssStyles\(\) in combination with Angularjs breaks display in Chrome and IE [\#126](https://github.com/knsv/mermaid/issues/126)
- Gantt - suitable xAxis for longer project [\#125](https://github.com/knsv/mermaid/issues/125)
- Mix horizontal and vertical graph [\#68](https://github.com/knsv/mermaid/issues/68)
- How to get started with this project ? [\#64](https://github.com/knsv/mermaid/issues/64)
- Special characters break parsing [\#54](https://github.com/knsv/mermaid/issues/54)
- Responsive graph layout for mobile viewers [\#51](https://github.com/knsv/mermaid/issues/51)
- Styling connector lines [\#31](https://github.com/knsv/mermaid/issues/31)

**Merged pull requests:**

- Remove moot `version` property from bower.json [\#172](https://github.com/knsv/mermaid/pull/172) ([kkirsche](https://github.com/kkirsche))

## [0.5.0](https://github.com/knsv/mermaid/tree/0.5.0) (2015-06-07)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.4.0...0.5.0)

**Closed issues:**

- it can not work where graph TD contains chinese character [\#166](https://github.com/knsv/mermaid/issues/166)
- Broken Examples [\#163](https://github.com/knsv/mermaid/issues/163)
- uglifyjs wanrings which means we can improve the code [\#156](https://github.com/knsv/mermaid/issues/156)
- New\(er\) features unavailable in downloadable js files? [\#151](https://github.com/knsv/mermaid/issues/151)
- Add gh-gapes link to description [\#143](https://github.com/knsv/mermaid/issues/143)
- Some examples not displayed on Firefox 36.0.1 [\#138](https://github.com/knsv/mermaid/issues/138)
- tags ending in a "v" don't render [\#132](https://github.com/knsv/mermaid/issues/132)
- Links in flowchart [\#131](https://github.com/knsv/mermaid/issues/131)
- Using the library for iOS development [\#130](https://github.com/knsv/mermaid/issues/130)
- Add a css file, mermaid.css, with default styling [\#122](https://github.com/knsv/mermaid/issues/122)
- Add capability for gantt diagrams [\#118](https://github.com/knsv/mermaid/issues/118)
- lower case v causes error in the parser [\#108](https://github.com/knsv/mermaid/issues/108)
- Label's css conflict with boostrap's .label [\#67](https://github.com/knsv/mermaid/issues/67)
- TypeError: Cannot read property 'layout' of undefined [\#37](https://github.com/knsv/mermaid/issues/37)
- software architecture diagram [\#36](https://github.com/knsv/mermaid/issues/36)
- Support for bar charts and pie diagrams [\#22](https://github.com/knsv/mermaid/issues/22)

**Merged pull requests:**

- Dev 0.5.0 [\#168](https://github.com/knsv/mermaid/pull/168) ([knsv](https://github.com/knsv))
- Fix spacing [\#164](https://github.com/knsv/mermaid/pull/164) ([rhcarvalho](https://github.com/rhcarvalho))
- Fixing typo: "Think" -\> "Thick" [\#160](https://github.com/knsv/mermaid/pull/160) ([it0a](https://github.com/it0a))
- IE, local html, cssRules access is denied [\#155](https://github.com/knsv/mermaid/pull/155) ([tylerlong](https://github.com/tylerlong))
- Add automatically generated change log file. [\#139](https://github.com/knsv/mermaid/pull/139) ([skywinder](https://github.com/skywinder))
- Adding init argument to the global API [\#137](https://github.com/knsv/mermaid/pull/137) ([bollwyvl](https://github.com/bollwyvl))
- Add description of manual calling of init [\#136](https://github.com/knsv/mermaid/pull/136) ([bollwyvl](https://github.com/bollwyvl))
- Allow other forms of node selection for init\(\) [\#135](https://github.com/knsv/mermaid/pull/135) ([bollwyvl](https://github.com/bollwyvl))
- Use a library-level variable for assigning ids [\#134](https://github.com/knsv/mermaid/pull/134) ([bollwyvl](https://github.com/bollwyvl))

## [0.4.0](https://github.com/knsv/mermaid/tree/0.4.0) (2015-03-01)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.3.5...0.4.0)

**Closed issues:**

- subgraph background is black in rendered flowchart PNG via CLI [\#121](https://github.com/knsv/mermaid/issues/121)
- Integrate editor at https://github.com/naseer/mermaid-webapp [\#110](https://github.com/knsv/mermaid/issues/110)
- Internet Explorer Support [\#99](https://github.com/knsv/mermaid/issues/99)
- Asymmetric shapes not documented [\#82](https://github.com/knsv/mermaid/issues/82)
- NoModificationAllowedError [\#23](https://github.com/knsv/mermaid/issues/23)
- Improve arrows [\#3](https://github.com/knsv/mermaid/issues/3)

## [0.3.5](https://github.com/knsv/mermaid/tree/0.3.5) (2015-02-15)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.3.4...0.3.5)

## [0.3.4](https://github.com/knsv/mermaid/tree/0.3.4) (2015-02-15)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.3.3...0.3.4)

**Closed issues:**

- Subgraph syntax bug? [\#120](https://github.com/knsv/mermaid/issues/120)
- Live editor [\#115](https://github.com/knsv/mermaid/issues/115)
- Error in "Basic Syntax" wiki page [\#113](https://github.com/knsv/mermaid/issues/113)
- semicolons, anyone? [\#111](https://github.com/knsv/mermaid/issues/111)
- undefined `sequenceConfig` fails [\#109](https://github.com/knsv/mermaid/issues/109)
- Sequence Diagrams: Show Actors below as well [\#106](https://github.com/knsv/mermaid/issues/106)
- Allow overriding sequence diagram configuration \(SVG properties\) [\#103](https://github.com/knsv/mermaid/issues/103)
- Error when rendering A-- This is the text -- B [\#102](https://github.com/knsv/mermaid/issues/102)
- Clipping in documentation [\#97](https://github.com/knsv/mermaid/issues/97)
- isolate class styling to the svg container [\#92](https://github.com/knsv/mermaid/issues/92)
- Apply styling from css when using the CLI utility [\#85](https://github.com/knsv/mermaid/issues/85)
- Generated SVG works poorly outside web browsers [\#58](https://github.com/knsv/mermaid/issues/58)
- Make the new graph declaration more visual [\#40](https://github.com/knsv/mermaid/issues/40)
- Generating SVG text blob for use in Node [\#2](https://github.com/knsv/mermaid/issues/2)

**Merged pull requests:**

- Add live editor [\#119](https://github.com/knsv/mermaid/pull/119) ([naseer](https://github.com/naseer))
- Adds CSS option to the CLI [\#116](https://github.com/knsv/mermaid/pull/116) ([fardog](https://github.com/fardog))
- Update flowchart.md in response Issue \#113 [\#114](https://github.com/knsv/mermaid/pull/114) ([vijay40](https://github.com/vijay40))
- Ignore all files except the license and dist/ folder when installing with Bower. [\#112](https://github.com/knsv/mermaid/pull/112) ([jasonbellamy](https://github.com/jasonbellamy))

## [0.3.3](https://github.com/knsv/mermaid/tree/0.3.3) (2015-01-25)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.3.2...0.3.3)

**Closed issues:**

- Missing arrows in sequence diagram [\#98](https://github.com/knsv/mermaid/issues/98)
- Error with \>9 linkStyles [\#95](https://github.com/knsv/mermaid/issues/95)
- Support for dotted links [\#26](https://github.com/knsv/mermaid/issues/26)

**Merged pull requests:**

- Require d3 directly to better support Node usage [\#107](https://github.com/knsv/mermaid/pull/107) ([markdalgleish](https://github.com/markdalgleish))
- update doc with -c option [\#105](https://github.com/knsv/mermaid/pull/105) ([jjmr](https://github.com/jjmr))
- Add new parameter to the console client to override the svg configuration in sequence diagrams [\#104](https://github.com/knsv/mermaid/pull/104) ([jjmr](https://github.com/jjmr))
- Text based labels, new shape [\#101](https://github.com/knsv/mermaid/pull/101) ([bjowes](https://github.com/bjowes))
- fix html tags in example usage [\#100](https://github.com/knsv/mermaid/pull/100) ([deiwin](https://github.com/deiwin))

## [0.3.2](https://github.com/knsv/mermaid/tree/0.3.2) (2015-01-11)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.3.1...0.3.2)

**Closed issues:**

- disable auto render [\#91](https://github.com/knsv/mermaid/issues/91)
- Tidy breaks mermaid \(linebreaks in \<div\>\) [\#87](https://github.com/knsv/mermaid/issues/87)
- Bug: \<br\> being rendered as text in node [\#73](https://github.com/knsv/mermaid/issues/73)
- Graph edges appear to render outside of the canvas [\#70](https://github.com/knsv/mermaid/issues/70)
- Make link text look like it is on the line [\#53](https://github.com/knsv/mermaid/issues/53)

**Merged pull requests:**

- Merge pull request \#1 from knsv/master [\#96](https://github.com/knsv/mermaid/pull/96) ([gkchic](https://github.com/gkchic))
- Removed duplicated section in flowchart docs [\#94](https://github.com/knsv/mermaid/pull/94) ([kaime](https://github.com/kaime))
- Grammar changes to sequence page [\#93](https://github.com/knsv/mermaid/pull/93) ([gkchic](https://github.com/gkchic))
- GitHub buttons [\#89](https://github.com/knsv/mermaid/pull/89) ([gkchic](https://github.com/gkchic))
- Template change [\#88](https://github.com/knsv/mermaid/pull/88) ([gkchic](https://github.com/gkchic))

## [0.3.1](https://github.com/knsv/mermaid/tree/0.3.1) (2015-01-05)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.3.0...0.3.1)

**Closed issues:**

- Non ASCII chars in labels [\#84](https://github.com/knsv/mermaid/issues/84)
- 'undefined' titles of Quicklinks on the usage page [\#80](https://github.com/knsv/mermaid/issues/80)
- \[cli\] Enhancement proposal: not fail --version / --help if phantomjs isn't installed [\#71](https://github.com/knsv/mermaid/issues/71)
- Neural Networks [\#39](https://github.com/knsv/mermaid/issues/39)
- Support for sequence diagrams [\#16](https://github.com/knsv/mermaid/issues/16)
- Client utility for mermaid [\#6](https://github.com/knsv/mermaid/issues/6)

**Merged pull requests:**

- Flowchart doc: Text in the circle now in a circle [\#81](https://github.com/knsv/mermaid/pull/81) ([Grahack](https://github.com/Grahack))
- Fix for issue \#73 [\#79](https://github.com/knsv/mermaid/pull/79) ([it0a](https://github.com/it0a))
- Ink template [\#78](https://github.com/knsv/mermaid/pull/78) ([gkchic](https://github.com/gkchic))
- Show help and version even if phantom isn't present. Fixes \#71 [\#75](https://github.com/knsv/mermaid/pull/75) ([fardog](https://github.com/fardog))
- Add apostrophe & 'and' [\#72](https://github.com/knsv/mermaid/pull/72) ([sudodoki](https://github.com/sudodoki))

## [0.3.0](https://github.com/knsv/mermaid/tree/0.3.0) (2014-12-22)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.16...0.3.0)

**Closed issues:**

- Consider shipping a standalone executable [\#65](https://github.com/knsv/mermaid/issues/65)
- Trailing whitespace at the end of lines is not ignored [\#55](https://github.com/knsv/mermaid/issues/55)
- How do I do comments? [\#47](https://github.com/knsv/mermaid/issues/47)
- This characters failed the lexical parsing [\#46](https://github.com/knsv/mermaid/issues/46)
- tutorial for creating new type of graph/layout [\#44](https://github.com/knsv/mermaid/issues/44)
- Improve readability with new line as terminator and whitespace [\#38](https://github.com/knsv/mermaid/issues/38)
- Use classes instead of inline style for easy styling [\#24](https://github.com/knsv/mermaid/issues/24)

**Merged pull requests:**

- Adds Command Line Interface for generating PNGs from mermaid description files [\#69](https://github.com/knsv/mermaid/pull/69) ([fardog](https://github.com/fardog))
- Allow special symbols for direction along with acronyms [\#66](https://github.com/knsv/mermaid/pull/66) ([vijay40](https://github.com/vijay40))

## [0.2.16](https://github.com/knsv/mermaid/tree/0.2.16) (2014-12-15)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.15...0.2.16)

**Closed issues:**

- Mermaid not rendering properly on Wordpress pages [\#59](https://github.com/knsv/mermaid/issues/59)
- Improve example page with live demo [\#52](https://github.com/knsv/mermaid/issues/52)
- Create image file via CLI? [\#48](https://github.com/knsv/mermaid/issues/48)
- Does not render upon AngularJS Updates [\#45](https://github.com/knsv/mermaid/issues/45)
- Download link in README.MD doesn't work. [\#42](https://github.com/knsv/mermaid/issues/42)
- linkStyle usage is not obvious [\#41](https://github.com/knsv/mermaid/issues/41)
- Move \*.spec.js in src/ to test/ [\#35](https://github.com/knsv/mermaid/issues/35)
- Lines routed outside visible area [\#19](https://github.com/knsv/mermaid/issues/19)

**Merged pull requests:**

- New grammar will allow statements ending without semicolon as disccused in Issue \#38 [\#63](https://github.com/knsv/mermaid/pull/63) ([vijay40](https://github.com/vijay40))
- Class based styling [\#62](https://github.com/knsv/mermaid/pull/62) ([bjowes](https://github.com/bjowes))
- Fix typos [\#60](https://github.com/knsv/mermaid/pull/60) ([sublimino](https://github.com/sublimino))
- Included .DS_Store in gitignore [\#57](https://github.com/knsv/mermaid/pull/57) ([alvynmcq](https://github.com/alvynmcq))
- Improves readablity discussed in issue \#38 [\#56](https://github.com/knsv/mermaid/pull/56) ([vijay40](https://github.com/vijay40))
- Added a linting task for gulp [\#43](https://github.com/knsv/mermaid/pull/43) ([serv](https://github.com/serv))

## [0.2.15](https://github.com/knsv/mermaid/tree/0.2.15) (2014-12-05)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.14...0.2.15)

**Closed issues:**

- Question marks don't render properly with /dist/mermaid.full.min.js [\#30](https://github.com/knsv/mermaid/issues/30)
- Error with some characters [\#25](https://github.com/knsv/mermaid/issues/25)
- Provide parse function in browser without `require`? [\#21](https://github.com/knsv/mermaid/issues/21)
- Better label text support [\#18](https://github.com/knsv/mermaid/issues/18)
- Cap-cased words break parser [\#8](https://github.com/knsv/mermaid/issues/8)

**Merged pull requests:**

- Include bower_components/ to .gitignore [\#33](https://github.com/knsv/mermaid/pull/33) ([serv](https://github.com/serv))
- Fixed reference to Git repo. [\#32](https://github.com/knsv/mermaid/pull/32) ([guyellis](https://github.com/guyellis))

## [0.2.14](https://github.com/knsv/mermaid/tree/0.2.14) (2014-12-03)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.13...0.2.14)

## [0.2.13](https://github.com/knsv/mermaid/tree/0.2.13) (2014-12-03)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.10...0.2.13)

**Closed issues:**

- modified init to be applied more than once [\#29](https://github.com/knsv/mermaid/issues/29)
- Wanted to know build process for the project. [\#28](https://github.com/knsv/mermaid/issues/28)
- Container support [\#27](https://github.com/knsv/mermaid/issues/27)
- can not support Chinese description [\#20](https://github.com/knsv/mermaid/issues/20)
- Node Label text mistaken for Direction [\#17](https://github.com/knsv/mermaid/issues/17)
- Support unicode chars in labels [\#9](https://github.com/knsv/mermaid/issues/9)
- Publish to NPM [\#7](https://github.com/knsv/mermaid/issues/7)

## [0.2.10](https://github.com/knsv/mermaid/tree/0.2.10) (2014-12-01)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.9...0.2.10)

## [0.2.9](https://github.com/knsv/mermaid/tree/0.2.9) (2014-12-01)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.8...0.2.9)

**Closed issues:**

- Add link to jsbin playground to README [\#11](https://github.com/knsv/mermaid/issues/11)
- What are the requirements ? [\#10](https://github.com/knsv/mermaid/issues/10)

**Merged pull requests:**

- Allow unicode chars in labels [\#13](https://github.com/knsv/mermaid/pull/13) ([codebeige](https://github.com/codebeige))

## [0.2.8](https://github.com/knsv/mermaid/tree/0.2.8) (2014-12-01)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.7...0.2.8)

## [0.2.7](https://github.com/knsv/mermaid/tree/0.2.7) (2014-12-01)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.6...0.2.7)

**Closed issues:**

- Provide parser as separate module [\#4](https://github.com/knsv/mermaid/issues/4)

## [0.2.6](https://github.com/knsv/mermaid/tree/0.2.6) (2014-11-27)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.5...0.2.6)

## [0.2.5](https://github.com/knsv/mermaid/tree/0.2.5) (2014-11-27)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.4...0.2.5)

**Merged pull requests:**

- Added new shapes! [\#1](https://github.com/knsv/mermaid/pull/1) ([bjowes](https://github.com/bjowes))

## [0.2.4](https://github.com/knsv/mermaid/tree/0.2.4) (2014-11-25)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.3...0.2.4)

## [0.2.3](https://github.com/knsv/mermaid/tree/0.2.3) (2014-11-24)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.2...0.2.3)

## [0.2.2](https://github.com/knsv/mermaid/tree/0.2.2) (2014-11-22)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.1...0.2.2)

## [0.2.1](https://github.com/knsv/mermaid/tree/0.2.1) (2014-11-22)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.2.0...0.2.1)

## [0.2.0](https://github.com/knsv/mermaid/tree/0.2.0) (2014-11-22)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.1.1...0.2.0)

## [0.1.1](https://github.com/knsv/mermaid/tree/0.1.1) (2014-11-17)

[Full Changelog](https://github.com/knsv/mermaid/compare/0.1.0...0.1.1)

## [0.1.0](https://github.com/knsv/mermaid/tree/0.1.0) (2014-11-16)
