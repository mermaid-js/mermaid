# @mermaid-js/layout-elk

## 1.0.0

### Major Changes

- [#8213](https://github.com/mermaid-js/mermaid/pull/8213) [`33442fd`](https://github.com/mermaid-js/mermaid/commit/33442fddbf91852417ac2805afbd35aba0facbe1) Thanks [@aloisklink](https://github.com/aloisklink)! - chore!: require ES2024, Safari 17.4+, Node.JS v22.12+

  Mermaid is now built to target Safari 17.4+ and ES2024. If you need to support
  older browsers, you may need to polyfill or transpile mermaid.

  Safari 17.4+ has been chosen as the floor, as unlike Firefox/Chrome,
  older iOS devices don't get major Safari updates.

  Node.JS v22.12+ is also declared as requirement in our `package.json` files,
  but as mermaid requires a browser, this is mainly so we can use dependencies that
  also declare a Node.JS v22.12+ requirement, without causing issues for users when
  running `npm install`.

### Minor Changes

- [#8152](https://github.com/mermaid-js/mermaid/pull/8152) [`d4bea0d`](https://github.com/mermaid-js/mermaid/commit/d4bea0d33944ef8941daba8fab32fb144dde80da) Thanks [@knsv-bot](https://github.com/knsv-bot)! - feat: `elk.preset` picks a named combination of the options that decide where nodes end up.

  Three options settle node positions, and they sit in different phases of the layout: which layer a node lands in, where it goes within that layer, and which edges get reversed to make the graph acyclic. Choosing them well means knowing all three interact; `preset` names the combinations worth using.
  - `default` — network simplex layering, balanced Brandes-Koepf placement at the top level and inside subgraphs, and depth-first cycle breaking. Balanced placement centres branches and composite-state entries; depth-first breaking gives shorter back edges on graphs that loop.
  - `legacy` — reproduces what earlier versions actually rendered: Brandes-Koepf placement with ELK's own greedy cycle breaking.
  - `modelOrder` — as `depthFirst`, but breaks cycles by greedy model order, which disturbs declaration order least at the cost of longer back edges.
  - `depthFirst` — the previous default: network simplex layering and top-level placement, Brandes-Koepf placement inside subgraphs, `NONE` alignment, and depth-first cycle breaking.

  ```yaml
  ---
  config:
    layout: elk
    elk:
      preset: legacy
  ---
  ```

  Setting `layeringStrategy`, `nodePlacementStrategy`, `nodePlacementAlignment` or `cycleBreakingStrategy` explicitly overrides the preset for that one option and leaves the rest in place, so a preset is a starting point rather than a lock.

  **Node placement keeps `BRANDES_KOEPF`, but its alignment changes from `NONE` to `BALANCED` and cycle breaking from `GREEDY` to `DEPTH_FIRST`, so existing ELK diagrams will lay out differently.** `preset: legacy` restores the previous behaviour, and is the single switch for it — this is the net change against the last release, measured from what shipped rather than from any intermediate state.

  Subgraph contents use `BRANDES_KOEPF` under every preset. For `modelOrder` and `depthFirst` that is deliberately not the root's strategy: network simplex inside a frame produced routes that left the subgraph on its bounding-box corner. The two sides are tuned independently, so `nodePlacementStrategy` set explicitly still applies to both.

  Note that `legacy` uses `GREEDY` cycle breaking rather than the `GREEDY_MODEL_ORDER` the schema previously advertised. That default was declared in the schema but never listed in the shipped defaults, so it reached ELK as undefined and ELK's own default applied — `legacy` reproduces what was rendered, not what was documented.

- [#8152](https://github.com/mermaid-js/mermaid/pull/8152) [`1246a55`](https://github.com/mermaid-js/mermaid/commit/1246a55fd371fd5a8ed40f617be676b08e57645f) Thanks [@knsv-bot](https://github.com/knsv-bot)! - feat: draw line hops where ELK edges cross, controlled by `elk.lineHops`.

  Where two edges cross, the one that gives way is drawn with a small arc (or a visible gap) so it is clear which line passes over which. On by default; set `elk.lineHops: false` to draw plain crossings, or `'gap'` to use gaps instead of arcs.

  ```yaml
  ---
  config:
    layout: elk
    elk:
      lineHops: gap
  ---
  ```

  The crossing detection and both styles already existed and were used by swimlanes — this registers the `afterPaint` hook that lets ELK use them. An edge that takes a hop loses its corner rounding on that segment, which is the trade for a readable crossing; curved edges are skipped rather than rewritten, to avoid corrupting their geometry.

  **Existing ELK diagrams with crossing edges will render differently.**

- [#8155](https://github.com/mermaid-js/mermaid/pull/8155) [`810893c`](https://github.com/mermaid-js/mermaid/commit/810893c660ada9e223297a38adcf65d4f4e211a7) Thanks [@ashishjain0512](https://github.com/ashishjain0512)! - feat: this package is now built from mermaid's own ELK implementation instead of carrying its own copy, and is only needed for Mermaid builds that ship without ELK.

  `mermaid` bundles ELK and registers it automatically, so most projects can drop the dependency and the `registerLayoutLoaders` call. The package remains published and fully functional for the **tiny** build (`mermaid.tiny.js`), which omits ELK to stay small and where registering this is the only way to get an ELK layout.

  Because it is compiled from mermaid's ELK source rather than importing the whole `mermaid` entry point, the published bundle no longer drags in every diagram type, parser and KaTeX: the minified ESM payload drops from roughly **1.58 MB to 728 kB gzipped**. It stays self-contained, so it still loads from a CDN next to any Mermaid build with no import map.

  The rendering utilities the ELK source reaches (`dompurify`, `katex`, `dayjs`, `dagre-d3-es`) are now declared in the package's `dependencies`, so the npm build (`.core.mjs`) resolves them through your package manager — they dedupe against the host's copies and show up in audits — instead of carrying invisible inlined copies.

  > **Maintainers:** `peerDependencies.mermaid` still reads `^11.0.2`. It should be raised to the major that bundles ELK as part of the release.

### Patch Changes

- [#8152](https://github.com/mermaid-js/mermaid/pull/8152) [`785ca77`](https://github.com/mermaid-js/mermaid/commit/785ca77ea5b671a9c7ea83b9268924f38af9a578) Thanks [@knsv-bot](https://github.com/knsv-bot)! - fix: draw ELK subgraph frames an even distance from their contents.

  A subgraph could sit 76px from its nodes on one side and 24px on the other, with nothing visible in the gap. ELK sizes a container around everything it put inside, edges included, and an edge that runs against the flow of the layout is routed back around the outside — so a group holding one grew on whichever side that edge left by, and a group without one did not.

  The lane is real and the edge still needs it, so the space is not reclaimed. What changes is that the frame is no longer drawn around it: the frame is pulled in to an even distance from the group's own children, and the edge keeps its lane just outside, which is what an edge routed around a group should look like anyway.

  The top is left as ELK set it, since it carries the subgraph's title strip and there is no way to tell how much of that padding is the title and how much is spare.

  A frame still holds the lanes that genuinely belong to it. An edge with both endpoints inside a group never leaves it, so its lane is part of that group's interior and the frame stays drawn around it — which matters for nested groups, where a lane routed around an inner group sits inside the outer one.

  **Subgraphs render tighter, and groups that used to be visibly lopsided are now even.**

- [#8228](https://github.com/mermaid-js/mermaid/pull/8228) [`e36b883`](https://github.com/mermaid-js/mermaid/commit/e36b8837b4145dc3ed8f21895d2dc8db1d0e9af2) Thanks [@knsv-bot](https://github.com/knsv-bot)! - Reserve subgraph title padding before ELK routes edges so attachments stay on the painted frame. Clip stale interior endpoints along the incoming segment, avoiding edges that run along the subgraph border.

- [#8152](https://github.com/mermaid-js/mermaid/pull/8152) [`1befa91`](https://github.com/mermaid-js/mermaid/commit/1befa91746916a691022b5573364cd35c57407b8) Thanks [@knsv-bot](https://github.com/knsv-bot)! - fix: edges leave diamonds, stadiums and other non-rectangular shapes without kinking.

  ELK routes to ports on a node's bounding box and always leaves one perpendicular to the side it sits on. For a rectangle that port is the attachment point; for anything else the outline is inside the box, so the attachment has to move inwards — and the direction it moves in decides whether the edge stays orthogonal.

  It used to move along the ray from the node's centre, which lands on the outline at a different offset along the side than the port ELK chose, so the opening segment came out diagonal. The attachment now walks the outline along the edge's own departure axis, staying collinear with ELK's stub: the edge leaves the outline, crosses the box, and carries on in one straight line. Rectangular nodes are unaffected.

- [#8152](https://github.com/mermaid-js/mermaid/pull/8152) [`1348b4f`](https://github.com/mermaid-js/mermaid/commit/1348b4fe4863db8747ed1a8a406d82660749733d) Thanks [@knsv-bot](https://github.com/knsv-bot)! - fix: an edge no longer leaves a subgraph from the frame's corner.

  `elk.spacing.portsSurrounding` was left at ELK's default of `0`, which permits a
  port to sit exactly on a node's corner. A corner is the one boundary point with
  no side to leave from, so the edge came out of the vertex and then ran ALONG the
  frame's own edge before turning away from it. Subgraphs showed it first, because
  an edge that crosses a subgraph boundary attaches to the frame rather than to a
  node inside it, and a frame is large enough for the result to be obvious.

  A margin is now reserved at the ends of every side, so ELK keeps ports off the
  corners itself rather than the renderer correcting them afterwards. Over the
  `elk-edge-cases` corpus this takes the fixtures with a corner endpoint from 8 of
  30 down to 3.

  The value is 12, chosen by measurement: it is the smallest that clears the
  corner on that corpus. It is not a free parameter — 30 was tried and reorders
  layers.

- [#8194](https://github.com/mermaid-js/mermaid/pull/8194) [`012e1f7`](https://github.com/mermaid-js/mermaid/commit/012e1f78d36bf2b523613d4e3c273892df988fce) Thanks [@knsv-bot](https://github.com/knsv-bot)! - fix: center edges attached to small nodes such as start/end state circles. ELK's ports-surrounding margin exceeded the side length of nodes narrower than 24px, parking the edge anchor off-center; such anchors are now discarded so the edge aims at the node center.

- [#8152](https://github.com/mermaid-js/mermaid/pull/8152) [`1befa91`](https://github.com/mermaid-js/mermaid/commit/1befa91746916a691022b5573364cd35c57407b8) Thanks [@knsv-bot](https://github.com/knsv-bot)! - fix: an edge no longer leaves a node with a tiny kink.

  ELK spreads an edge's port evenly along a node's side, then routes the edge down a channel whose row rarely lines up with that port exactly. The leftover is a staircase of a few pixels right at the border: leave the port, run a short distance, step perpendicular onto the channel, carry on. With rounded corners the two micro-bends sit on top of each other and read as a glitch — one edge in the sample corpus stepped 3.25px and rendered as two quadratic curves with a zero-length segment between them.

  The step is now removed by moving the channel onto the port's row, so the edge draws as one straight line and **both ports stay exactly where the layout put them** — sliding an attachment along a node's border leaves a node whose other edges are still evenly spread looking lopsided. Only a step next to a node is touched, and only when it is small and the edge continues the same way afterwards, so a real turn is never collapsed. An edge is left alone entirely when moving its run would drag the far port, or would buy a crossing.

  Set `elk.straightenEdges: false` to keep the previous behaviour.

- [#8152](https://github.com/mermaid-js/mermaid/pull/8152) [`3b09225`](https://github.com/mermaid-js/mermaid/commit/3b09225e025984061dde26a7946787346cddb635) Thanks [@knsv-bot](https://github.com/knsv-bot)! - fix: stop ELK subgraphs padding one side more than the other.

  A subgraph could end up with far more space on one side than the other for no reason a reader could see — 74px on the right of one group against 24px everywhere else. The extra space was a routing lane held open for an edge that runs against the flow of the layout and has to be routed back around, and its width came from `spacing.baseValue`.

  That base value was doing two jobs at once. Every unset ELK spacing derives from it, so it had to stay large enough that an edge got a straight run before the node it enters — below about 40 the approach came out shorter than the arrowhead and the turn read as happening underneath it. But an edge routed down the inside of a frame claims a lane the same width, so paying for the approach out of the base value also pushed groups clear of their own borders.

  The two are now bought separately. The base value drops to 24, and the approach run, node separation and edge separation are set explicitly, so edges keep the run they had without the frame paying for it.

  `elk.layered.spacing.edgeNodeBetweenLayers` is the key that buys the approach. An earlier attempt used `elk.layered.spacing.edgeEdgeBetweenLayers`, which is edge-to-edge and a different quantity, and a note in the source concluded from it that ELK ignored edge-node spacing "in every key form". It does not; that note was wrong and is corrected.

  Subgraph contents also gain `PORT_POSITION` node flexibility, which lets a node shift so an edge can leave straight rather than bending off the port. (Their placement strategy is covered in the `elk.preset` note.)

  **Existing diagrams with subgraphs will render differently** — groups get tighter and more even.

- [#8129](https://github.com/mermaid-js/mermaid/pull/8129) [`83f5c47`](https://github.com/mermaid-js/mermaid/commit/83f5c475e9e806a6142e8c49e278cf55cd9997cf) Thanks [@ashishjain0512](https://github.com/ashishjain0512)! - fix(build): externalize `peerDependencies` in core builds so the layout plugins no longer inline a second copy of mermaid

  `getBuildConfig` only externalized `dependencies`, so a runtime (non-type) import of the peer-depended mermaid resolved through `exports` to `dist/mermaid.core.mjs` and esbuild inlined the whole bundle. `@mermaid-js/layout-elk`'s core entry had grown to 106 files / 6.6 MB, carrying its own mermaid with separate module-level singletons — so mermaid rendering fixes did not reach the ELK layout path until the plugin itself was republished. The core entry is back to 3 files / ~41 KB and now defers to the host's mermaid. The self-contained `esm` entry is unchanged.

- Updated dependencies [[`7a3c1a8`](https://github.com/mermaid-js/mermaid/commit/7a3c1a832b80066850d179a36fa7a0a3690134c4), [`0cf3797`](https://github.com/mermaid-js/mermaid/commit/0cf3797eba3bdb0deb5577c9c60803ebf8fc961a), [`846fd65`](https://github.com/mermaid-js/mermaid/commit/846fd650b0bb6b13584279cdd3ca84f787dddd3d), [`33442fd`](https://github.com/mermaid-js/mermaid/commit/33442fddbf91852417ac2805afbd35aba0facbe1), [`dc2e453`](https://github.com/mermaid-js/mermaid/commit/dc2e4539a7493f25844a49fa83ce4a6b377d7815), [`ce0302d`](https://github.com/mermaid-js/mermaid/commit/ce0302de41eb6bb4d813b0cf7ba83446b1762ef5), [`ad98070`](https://github.com/mermaid-js/mermaid/commit/ad98070b0ede6b76e5a6abdfd36c8cbfe9e28a42), [`e2aab3f`](https://github.com/mermaid-js/mermaid/commit/e2aab3f0e0110477c00b01b0a2b36e35f1d3b65f), [`6b79518`](https://github.com/mermaid-js/mermaid/commit/6b795184bd55cccd7a3bf8ae75c26c670decde1f), [`30325d4`](https://github.com/mermaid-js/mermaid/commit/30325d4984f48fd401c5d5bbb950879df2b3158d), [`cd48a64`](https://github.com/mermaid-js/mermaid/commit/cd48a648e5d8aca47cdbc66bde7ca18626a9d32d), [`c3ee3c7`](https://github.com/mermaid-js/mermaid/commit/c3ee3c72a165bef91528d2c840592a38f5f7830b), [`1ee934d`](https://github.com/mermaid-js/mermaid/commit/1ee934ddbaeeb5e44bddfc5e742b5230620e224c), [`a7831c5`](https://github.com/mermaid-js/mermaid/commit/a7831c5bb2a461aca7eb10bac387665a4735cbef), [`0cf3797`](https://github.com/mermaid-js/mermaid/commit/0cf3797eba3bdb0deb5577c9c60803ebf8fc961a), [`0320406`](https://github.com/mermaid-js/mermaid/commit/0320406298ac99012b2bf1442316f0db9c4bf1ca), [`810893c`](https://github.com/mermaid-js/mermaid/commit/810893c660ada9e223297a38adcf65d4f4e211a7), [`e36b883`](https://github.com/mermaid-js/mermaid/commit/e36b8837b4145dc3ed8f21895d2dc8db1d0e9af2), [`b993915`](https://github.com/mermaid-js/mermaid/commit/b9939159a1f069faa43d31798da9bd4f7353149c), [`4e00c5c`](https://github.com/mermaid-js/mermaid/commit/4e00c5c85b365358e18a688b877cefa52644b69e), [`3f05015`](https://github.com/mermaid-js/mermaid/commit/3f050155058a0a6789a32580bd9b7f84d4597d45), [`d57ed55`](https://github.com/mermaid-js/mermaid/commit/d57ed55a5482517927e5e4f4a9d0889078f4a902), [`1fc5bb3`](https://github.com/mermaid-js/mermaid/commit/1fc5bb34c454f875292c244a00ea0ba288b3b5c2), [`b979eb4`](https://github.com/mermaid-js/mermaid/commit/b979eb400918425980d98049dc40eb5f131dd18d), [`7ee4c3f`](https://github.com/mermaid-js/mermaid/commit/7ee4c3fb089f3a828f0213c0aa090ed5cacc310f), [`a6ec7ff`](https://github.com/mermaid-js/mermaid/commit/a6ec7ffd8bffc015ef58d5fa74b06009b8083a7f), [`1246a55`](https://github.com/mermaid-js/mermaid/commit/1246a55fd371fd5a8ed40f617be676b08e57645f), [`813c766`](https://github.com/mermaid-js/mermaid/commit/813c7665aa11c896469dee0ec57500169866aca6), [`8603bdd`](https://github.com/mermaid-js/mermaid/commit/8603bdd4eca14da74a8d606517975f847c2f2055), [`43d9fbc`](https://github.com/mermaid-js/mermaid/commit/43d9fbcea919c37b1baa3de06dbdc66592683d52), [`2878cf3`](https://github.com/mermaid-js/mermaid/commit/2878cf339cd294a64d71774b07636adeb1286991), [`16b9a7d`](https://github.com/mermaid-js/mermaid/commit/16b9a7db87a52baec3c5626c22d0fc2f546041ee), [`def4c81`](https://github.com/mermaid-js/mermaid/commit/def4c812e5dd4f6e089055ce2590abdae0269ee7), [`3802472`](https://github.com/mermaid-js/mermaid/commit/38024722bf92511ce7aa60ce7552609ec339b6be), [`a19bd08`](https://github.com/mermaid-js/mermaid/commit/a19bd085b6994e3c0b142a5e152559eef49935de), [`f5af413`](https://github.com/mermaid-js/mermaid/commit/f5af413186300f14d196a596146df2212af97065), [`a3a92ba`](https://github.com/mermaid-js/mermaid/commit/a3a92bac6a62c3df4359e17d555cd20e14503cde), [`e691042`](https://github.com/mermaid-js/mermaid/commit/e69104220b701575ab52012b9c807fead94679cb), [`ba0deed`](https://github.com/mermaid-js/mermaid/commit/ba0deed758a7a8bb38155cee1b4f2374a96d14d7), [`b05824a`](https://github.com/mermaid-js/mermaid/commit/b05824a4739b3a8f2d054ff1b8a48361a441587b), [`0ec29e9`](https://github.com/mermaid-js/mermaid/commit/0ec29e96e8c24d7d47ad140fefe924c4bd889ac2), [`0d77926`](https://github.com/mermaid-js/mermaid/commit/0d7792650682257f2a9ec4932860960e019a6280), [`93edd72`](https://github.com/mermaid-js/mermaid/commit/93edd728a566064dda37083151835847622e0e42), [`75e6c30`](https://github.com/mermaid-js/mermaid/commit/75e6c30cba57a5716edce4cfe8c4d84e640c1ea3), [`6df1149`](https://github.com/mermaid-js/mermaid/commit/6df1149ca906de887486275c83e54dd275d7b729), [`a31ecb7`](https://github.com/mermaid-js/mermaid/commit/a31ecb7d83edfb9a51a3cd5087c1f39a6b64611d)]:
  - mermaid@12.0.0

## 0.2.3

### Patch Changes

- [#7828](https://github.com/mermaid-js/mermaid/pull/7828) [`8eb3afc`](https://github.com/mermaid-js/mermaid/commit/8eb3afc08c64e0f5d2b2447daac417250a202c13) Thanks [@knsv-bot](https://github.com/knsv-bot)! - feat(elk): add `elk.keepEntryNodeOnTop` config option to keep a recursive flow's entry node on top

- [#7803](https://github.com/mermaid-js/mermaid/pull/7803) [`74e44eb`](https://github.com/mermaid-js/mermaid/commit/74e44ebf86d293cee1f2314c8b8a163284ea3911) Thanks [@knsv-bot](https://github.com/knsv-bot)! - feat(elk): add `elk.nodePlacementAlignment` config option

- Updated dependencies [[`215fe89`](https://github.com/mermaid-js/mermaid/commit/215fe89d3ecfb47cf0836cb52bf272b14fc99f29), [`3670b4e`](https://github.com/mermaid-js/mermaid/commit/3670b4e2d99b27945240dd3fe71da9175fddcaec), [`cdfc0ea`](https://github.com/mermaid-js/mermaid/commit/cdfc0ea65f47bc8f9605a2a646ed87c25a692216), [`c45cde9`](https://github.com/mermaid-js/mermaid/commit/c45cde9582ede4add658f62b771ba2a7efadde83), [`8d874c4`](https://github.com/mermaid-js/mermaid/commit/8d874c49fa1699cf22e99d4936b16f16dde1fc7f), [`8eb3afc`](https://github.com/mermaid-js/mermaid/commit/8eb3afc08c64e0f5d2b2447daac417250a202c13), [`74e44eb`](https://github.com/mermaid-js/mermaid/commit/74e44ebf86d293cee1f2314c8b8a163284ea3911), [`ea55b31`](https://github.com/mermaid-js/mermaid/commit/ea55b31bcfb36cfdfbc31a531058ee8c4ee53a4f), [`b3d1f63`](https://github.com/mermaid-js/mermaid/commit/b3d1f6316717faf099cbe21c9fb9f41c2e0bc069), [`71b8843`](https://github.com/mermaid-js/mermaid/commit/71b8843fb5ae25d7b884f5cc7ba856d978e0420b), [`9cbef5d`](https://github.com/mermaid-js/mermaid/commit/9cbef5d94f3aa6bea04b44f23ad81c1b8d7ca2b7), [`a2c0fb6`](https://github.com/mermaid-js/mermaid/commit/a2c0fb6cdf8073b8feb10595ea3cccff0237049b), [`a34cbf0`](https://github.com/mermaid-js/mermaid/commit/a34cbf02d9b5d88ac03f7792c8779ba2fd850378), [`f9cbe1e`](https://github.com/mermaid-js/mermaid/commit/f9cbe1ef3dcbb74b425d811c6dcf415953711544), [`ae3e115`](https://github.com/mermaid-js/mermaid/commit/ae3e1157c166fab7520d9ee2ed67b16613f6c243), [`90eeece`](https://github.com/mermaid-js/mermaid/commit/90eeeced88b8bc38b449ed01535b812b498f2b7d), [`afa2f80`](https://github.com/mermaid-js/mermaid/commit/afa2f80e658fe351ea73233a13787f7c3e2e433d), [`0fd7a9f`](https://github.com/mermaid-js/mermaid/commit/0fd7a9fe0d10a1ac39359bc5cb5341b5010a624e)]:
  - mermaid@11.17.0

## 0.2.2

### Patch Changes

- [#7712](https://github.com/mermaid-js/mermaid/pull/7712) [`e2e518a`](https://github.com/mermaid-js/mermaid/commit/e2e518a8a3220f0d6479ca038d59b3970abf14c8) Thanks [@knsv-bot](https://github.com/knsv-bot)! - fix(elk): propagate `elk.mergeEdges` config to subgraphs in ELK layout — previously edges defined inside a subgraph were not merged even when `elk.mergeEdges: true` was set

- Updated dependencies [[`ea1c48f`](https://github.com/mermaid-js/mermaid/commit/ea1c48f53fce5d025388d386c90da8743ee25b13), [`f45cc2c`](https://github.com/mermaid-js/mermaid/commit/f45cc2cc5683b90990e374a463b7bcad0fd68a38), [`f1f4d45`](https://github.com/mermaid-js/mermaid/commit/f1f4d45ee0513b64a2bd280087d31656f9d2c786), [`633c261`](https://github.com/mermaid-js/mermaid/commit/633c261dadbaa20ee0cf9a0299e2269abe4ca573), [`c8ba156`](https://github.com/mermaid-js/mermaid/commit/c8ba156f551e94dd9a5c30b4971fe83ef3538634), [`4e4e6c4`](https://github.com/mermaid-js/mermaid/commit/4e4e6c4a108d834dd0f643b08deb89159e0eca94), [`cfd2391`](https://github.com/mermaid-js/mermaid/commit/cfd23916f3c6b3ceafc4c0cfaf4078f6442bbc4f), [`c1f116d`](https://github.com/mermaid-js/mermaid/commit/c1f116d36646786326c596a5f25e519bdaac7748), [`b4d0442`](https://github.com/mermaid-js/mermaid/commit/b4d0442dd1628acb3f71681519e7f47fc8bacf55), [`72fbab1`](https://github.com/mermaid-js/mermaid/commit/72fbab1a4d6efbfa219b13c1639dabcadc754ad8), [`a6f097d`](https://github.com/mermaid-js/mermaid/commit/a6f097d580d459dfc3ade3e21030037341f79940), [`37f2e36`](https://github.com/mermaid-js/mermaid/commit/37f2e36fa017698b66093ac5518396523a7a3241), [`4e63e9d`](https://github.com/mermaid-js/mermaid/commit/4e63e9d338b6476df283afd4a002072945bc4563), [`4887e97`](https://github.com/mermaid-js/mermaid/commit/4887e9721c33b5d771306a4e7ab768d78908a157), [`a4c1e50`](https://github.com/mermaid-js/mermaid/commit/a4c1e507a347256f1f3a42be3feb5b6ddc7257f2), [`cc75089`](https://github.com/mermaid-js/mermaid/commit/cc750896b21a2715256ac0de486bafe0351c40c4), [`be2e282`](https://github.com/mermaid-js/mermaid/commit/be2e28201445505ec68b1ebf6e3e6813fb6a6898), [`d945968`](https://github.com/mermaid-js/mermaid/commit/d945968c13b154dcf2c89ad1e6ed5104458d32fe), [`2f5e9e8`](https://github.com/mermaid-js/mermaid/commit/2f5e9e8c9aabb74e61e43428e91217e9585c8d05), [`8dcdce4`](https://github.com/mermaid-js/mermaid/commit/8dcdce40ee091aafd546aa842aca8b4da1e49c1b), [`1bbc189`](https://github.com/mermaid-js/mermaid/commit/1bbc189b69be4c50a08ba74501567123769f30bb), [`05223be`](https://github.com/mermaid-js/mermaid/commit/05223bee47a424be3ba7805e753b96861d342765), [`365c1b1`](https://github.com/mermaid-js/mermaid/commit/365c1b1062dd6b5b7c59682f7df6b5c9ed40cd16), [`06a32b7`](https://github.com/mermaid-js/mermaid/commit/06a32b74fbe574ba36fb77ffd9743a8b884b2f55), [`afaf306`](https://github.com/mermaid-js/mermaid/commit/afaf3062381d115d66744413151b642f124dd9ba), [`216e4e9`](https://github.com/mermaid-js/mermaid/commit/216e4e9a61afceae885b00854f79e17373ccad31), [`79e97cd`](https://github.com/mermaid-js/mermaid/commit/79e97cd7b9cb8f2d9bf6ba6d04de5cdeb4223d1b), [`e5c75e6`](https://github.com/mermaid-js/mermaid/commit/e5c75e6b797f84f8f652d8771eb1ce6161dd8f89), [`974fa7b`](https://github.com/mermaid-js/mermaid/commit/974fa7b7e791b442ad5f7862f1cbecd53d982485), [`c2305df`](https://github.com/mermaid-js/mermaid/commit/c2305df424963c0263d1c75804248db2969ee17e), [`a4a250b`](https://github.com/mermaid-js/mermaid/commit/a4a250b96321e0648eecfbadbfb17b1537dff691)]:
  - mermaid@11.16.0

## 0.2.1

### Patch Changes

- [#7425](https://github.com/mermaid-js/mermaid/pull/7425) [`f16bfbb`](https://github.com/mermaid-js/mermaid/commit/f16bfbbd3b4cf59f816913029760031bf778f41d) Thanks [@knsv](https://github.com/knsv)! - fix: use rounded right-angle edges for ELK layout

  ELK layout edges now default to `rounded` curve (right-angle segments with rounded corners) instead of inheriting the global `basis` default. This fixes ELK edges that were curving instead of routing at right angles (#7213). Non-ELK layouts are unaffected and keep their existing `basis` default.

- Updated dependencies [[`96a766d`](https://github.com/mermaid-js/mermaid/commit/96a766dcdbb7d6e3043344a2ee3f1b64ba7a62c3), [`32723b2`](https://github.com/mermaid-js/mermaid/commit/32723b2de13474d7d13e9292e6f801e9874936ab), [`a60e615`](https://github.com/mermaid-js/mermaid/commit/a60e615bc31edeb1d623d096117812c0f721f2f8), [`1a9d45a`](https://github.com/mermaid-js/mermaid/commit/1a9d45abf0a991c40985021e8b523c32b46dd897), [`96ca7c0`](https://github.com/mermaid-js/mermaid/commit/96ca7c090f28eea458027e6871903d789575cfa1), [`60f6331`](https://github.com/mermaid-js/mermaid/commit/60f633101cd2e55ee80ad2250ae57d4c970430e5), [`fa15ce8`](https://github.com/mermaid-js/mermaid/commit/fa15ce8502d2f1d72787998d9d944c5a98b992dd), [`33c7c72`](https://github.com/mermaid-js/mermaid/commit/33c7c7206400509537a28f15d0e817340c482cb4), [`3c069b5`](https://github.com/mermaid-js/mermaid/commit/3c069b52859470dea89f45d5f859b1087b7e1fee), [`9745f32`](https://github.com/mermaid-js/mermaid/commit/9745f325cb9e1967640f0e85da193a2f820634f1), [`d6db0b0`](https://github.com/mermaid-js/mermaid/commit/d6db0b039654f6e122c6098821bc75f2910915e3), [`cdacb0b`](https://github.com/mermaid-js/mermaid/commit/cdacb0b30171bd15223c008a56c09f7ece842940), [`a408b55`](https://github.com/mermaid-js/mermaid/commit/a408b5586fb57aac54da4606940779562078f91d), [`712c1ec`](https://github.com/mermaid-js/mermaid/commit/712c1ec1222a771b38cd3b8a5ddf9c2fc4e2cbcc), [`981a62e`](https://github.com/mermaid-js/mermaid/commit/981a62e4ee6078d27a541db35df441734434d5c1), [`a4bb0b5`](https://github.com/mermaid-js/mermaid/commit/a4bb0b5920e24e44f1a12b163fdcfe6de672871a), [`b0f9d5b`](https://github.com/mermaid-js/mermaid/commit/b0f9d5b3aaf01bf5662525bcf59ac42d4bf069ab), [`981fbb8`](https://github.com/mermaid-js/mermaid/commit/981fbb8bd8be584d443dbdc14c84a2718906421d), [`93aa657`](https://github.com/mermaid-js/mermaid/commit/93aa6575788bdee992d4a60102b1dfdf95c9f4ce), [`6bc6617`](https://github.com/mermaid-js/mermaid/commit/6bc6617ca6a30b05d35d5ea1dacb940729ab42fd), [`73e9849`](https://github.com/mermaid-js/mermaid/commit/73e9849f993cd766eecddf349e335a4473560f37), [`9d0669a`](https://github.com/mermaid-js/mermaid/commit/9d0669a8c04281c3e96b96f285d4dd5d9e0088d7), [`acce4db`](https://github.com/mermaid-js/mermaid/commit/acce4db7a1bd8801666f1a9667a63e4010ec2020), [`7eed6a1`](https://github.com/mermaid-js/mermaid/commit/7eed6a1c347886461c931676b3ca22c1d5f3e1a8), [`2000680`](https://github.com/mermaid-js/mermaid/commit/2000680429204b0dd3a970bccfa47e8395f6b00d), [`b7c66a2`](https://github.com/mermaid-js/mermaid/commit/b7c66a220adc811404660004d19c81fc26b0fb53), [`f16bfbb`](https://github.com/mermaid-js/mermaid/commit/f16bfbbd3b4cf59f816913029760031bf778f41d), [`aac86f7`](https://github.com/mermaid-js/mermaid/commit/aac86f7de32a65fa850db20f14f65565a191564e), [`9745f32`](https://github.com/mermaid-js/mermaid/commit/9745f325cb9e1967640f0e85da193a2f820634f1), [`2dd29be`](https://github.com/mermaid-js/mermaid/commit/2dd29bee254a5b89c00eb0b0da1bcf7fe96ce46c), [`ace0367`](https://github.com/mermaid-js/mermaid/commit/ace0367afd0100ef645f7a583ba4cfbd08064133), [`09b74f1`](https://github.com/mermaid-js/mermaid/commit/09b74f1c29edf3d51c96d3ef17cb63af036908e1), [`33c7c72`](https://github.com/mermaid-js/mermaid/commit/33c7c7206400509537a28f15d0e817340c482cb4), [`835de00`](https://github.com/mermaid-js/mermaid/commit/835de0012d7e9981eceafd252b423768e9248830), [`a9e4c72`](https://github.com/mermaid-js/mermaid/commit/a9e4c72ed124b4ee632c1c9154838ab10e2d5e03), [`ff15e51`](https://github.com/mermaid-js/mermaid/commit/ff15e51d2e26df8f6331021ea83fe3a44d450b94), [`8bfd477`](https://github.com/mermaid-js/mermaid/commit/8bfd47758ad5255459d0cced5210d3cb8cfa6f91), [`b136acd`](https://github.com/mermaid-js/mermaid/commit/b136acdc670dee2e4825d5d93e825c0ed0551beb), [`e0317ac`](https://github.com/mermaid-js/mermaid/commit/e0317ac764349d5049f3ebeee30a15c2febc911b)]:
  - mermaid@11.13.0

## 0.2.0

### Minor Changes

- [#6802](https://github.com/mermaid-js/mermaid/pull/6802) [`c8e5027`](https://github.com/mermaid-js/mermaid/commit/c8e50276e877c4de7593a09ec458c99353e65af8) Thanks [@darshanr0107](https://github.com/darshanr0107)! - feat: Update mindmap rendering to support multiple layouts, improved edge intersections, and new shapes

### Patch Changes

- Updated dependencies [[`33bc4a0`](https://github.com/mermaid-js/mermaid/commit/33bc4a0b4e2ca6d937bb0a8c4e2081b1362b2800), [`e0b45c2`](https://github.com/mermaid-js/mermaid/commit/e0b45c2d2b41c2a9038bf87646fa3ccd7560eb20), [`012530e`](https://github.com/mermaid-js/mermaid/commit/012530e98e9b8b80962ab270b6bb3b6d9f6ada05), [`c8e5027`](https://github.com/mermaid-js/mermaid/commit/c8e50276e877c4de7593a09ec458c99353e65af8)]:
  - mermaid@11.11.0

## 0.1.9

### Patch Changes

- [#6857](https://github.com/mermaid-js/mermaid/pull/6857) [`b9ef683`](https://github.com/mermaid-js/mermaid/commit/b9ef683fb67b8959abc455d6cc5266c37ba435f6) Thanks [@knsv](https://github.com/knsv)! - feat: Exposing elk configuration forceNodeModelOrder and considerModelOrder to the mermaid configuration

- [#6849](https://github.com/mermaid-js/mermaid/pull/6849) [`2260948`](https://github.com/mermaid-js/mermaid/commit/2260948b7bda08f00616c2ce678bed1da69eb96c) Thanks [@anderium](https://github.com/anderium)! - Make elk not force node model order, but strongly consider it instead

- Updated dependencies [[`b9ef683`](https://github.com/mermaid-js/mermaid/commit/b9ef683fb67b8959abc455d6cc5266c37ba435f6), [`2c0931d`](https://github.com/mermaid-js/mermaid/commit/2c0931da46794b49d2523211e25f782900c34e94), [`33e08da`](https://github.com/mermaid-js/mermaid/commit/33e08daf175125295a06b1b80279437004a4e865), [`814b68b`](https://github.com/mermaid-js/mermaid/commit/814b68b4a94813f7c6b3d7fb4559532a7bab2652), [`fce7cab`](https://github.com/mermaid-js/mermaid/commit/fce7cabb71d68a20a66246fe23d066512126a412), [`fc07f0d`](https://github.com/mermaid-js/mermaid/commit/fc07f0d8abca49e4f887d7457b7b94fb07d1e3da), [`12e01bd`](https://github.com/mermaid-js/mermaid/commit/12e01bdb5cacf3569133979a5a4f1d8973e9aec1), [`01aaef3`](https://github.com/mermaid-js/mermaid/commit/01aaef39b4a1ec8bc5a0c6bfa3a20b712d67f4dc), [`daf8d8d`](https://github.com/mermaid-js/mermaid/commit/daf8d8d3befcd600618a629977b76463b38d0ad9), [`c36cd05`](https://github.com/mermaid-js/mermaid/commit/c36cd05c45ac3090181152b4dae41f8d7b569bd6), [`8bb29fc`](https://github.com/mermaid-js/mermaid/commit/8bb29fc879329ad109898e4025b4f4eba2ab0649), [`71b04f9`](https://github.com/mermaid-js/mermaid/commit/71b04f93b07f876df2b30656ef36036c1d0e4e4f), [`c99bce6`](https://github.com/mermaid-js/mermaid/commit/c99bce6bab4c7ce0b81b66d44f44853ce4aeb1c3), [`6cc1926`](https://github.com/mermaid-js/mermaid/commit/6cc192680a2531cab28f87a8061a53b786e010f3), [`9da6fb3`](https://github.com/mermaid-js/mermaid/commit/9da6fb39ae278401771943ac85d6d1b875f78cf1), [`e48b0ba`](https://github.com/mermaid-js/mermaid/commit/e48b0ba61dab7f95aa02da603b5b7d383b894932), [`4d62d59`](https://github.com/mermaid-js/mermaid/commit/4d62d5963238400270e9314c6e4d506f48147074), [`e9ce8cf`](https://github.com/mermaid-js/mermaid/commit/e9ce8cf4da9062d85098042044822100889bb0dd), [`9258b29`](https://github.com/mermaid-js/mermaid/commit/9258b2933bbe1ef41087345ffea3731673671c49), [`da90f67`](https://github.com/mermaid-js/mermaid/commit/da90f6760b6efb0da998bcb63b75eecc29e06c08), [`0133f1c`](https://github.com/mermaid-js/mermaid/commit/0133f1c0c5cff4fc4c8e0b99e9cf0b3d49dcbe71), [`895f9d4`](https://github.com/mermaid-js/mermaid/commit/895f9d43ff98ca05ebfba530789f677f31a011ff)]:
  - mermaid@11.10.0

## 0.1.8

### Patch Changes

- [#6648](https://github.com/mermaid-js/mermaid/pull/6648) [`85c5b9b`](https://github.com/mermaid-js/mermaid/commit/85c5b9b4c064e2edabf21757c8215a1018d4d288) Thanks [@knsv](https://github.com/knsv)! - Make elk respect the order of nodes based from the code

- Updated dependencies [[`97b79c3`](https://github.com/mermaid-js/mermaid/commit/97b79c3578a2004c63fa32f6d5e17bd8a536e13a), [`b1cf291`](https://github.com/mermaid-js/mermaid/commit/b1cf29127348602137552405e3300dee1697f0de), [`a4754ad`](https://github.com/mermaid-js/mermaid/commit/a4754ad195e70d52fbd46ef44f40797d2d215e41), [`2b05d7e`](https://github.com/mermaid-js/mermaid/commit/2b05d7e1edef635e6c80cb383b10ea0a89279f41), [`41e84b7`](https://github.com/mermaid-js/mermaid/commit/41e84b726a1f2df002b77c4b0071e2c15e47838e), [`d63d3bf`](https://github.com/mermaid-js/mermaid/commit/d63d3bf1e7596ac7eeb24ba06cbc7a70f9c8b070), [`aa6cb86`](https://github.com/mermaid-js/mermaid/commit/aa6cb86899968c65561eebfc1d54dd086b1518a2), [`df9df9d`](https://github.com/mermaid-js/mermaid/commit/df9df9dc32b80a8c320cc0efd5483b9485f15bde), [`cdbd3e5`](https://github.com/mermaid-js/mermaid/commit/cdbd3e58a3a35d63a79258115dedca4a535c1038), [`c17277e`](https://github.com/mermaid-js/mermaid/commit/c17277e743b1c12e4134fba44c62a7d5885f2574), [`a1ba65c`](https://github.com/mermaid-js/mermaid/commit/a1ba65c0c08432ec36e772570c3a5899cb57c102), [`1ddaf10`](https://github.com/mermaid-js/mermaid/commit/1ddaf10b89d8c7311c5e10d466b42fa36b61210b), [`ca80f71`](https://github.com/mermaid-js/mermaid/commit/ca80f719eac86cf4c31392105d5d896f39b84bbc), [`bca6ed6`](https://github.com/mermaid-js/mermaid/commit/bca6ed67c3e0db910bf498fdd0fc0346c02d392b)]:
  - mermaid@11.7.0

## 0.1.7

### Patch Changes

- [#6090](https://github.com/mermaid-js/mermaid/pull/6090) [`654097c`](https://github.com/mermaid-js/mermaid/commit/654097c43801b2d606bc3d2bef8c6fbc3301e9e4) Thanks [@knsv](https://github.com/knsv)! - fix: Updated offset calculations for diamond shape when handling intersections

## 0.1.6

### Patch Changes

- [#6081](https://github.com/mermaid-js/mermaid/pull/6081) [`68f41f6`](https://github.com/mermaid-js/mermaid/commit/68f41f685d2afe7d12f63aabf3de0c3461898471) Thanks [@knsv](https://github.com/knsv)! - fix: Elk rendering of Diamond shape intersections

- Updated dependencies [[`01b5079`](https://github.com/mermaid-js/mermaid/commit/01b5079562ec8d34ce9964910f168873843c68f8), [`1388662`](https://github.com/mermaid-js/mermaid/commit/1388662132cc829f9820c2e9970ae04e2dd90588), [`fe3cffb`](https://github.com/mermaid-js/mermaid/commit/fe3cffbb673a25b81989aacb06e5d0eda35326db)]:
  - mermaid@11.4.1

## 0.1.5

### Patch Changes

- [#5825](https://github.com/mermaid-js/mermaid/pull/5825) [`233e36c`](https://github.com/mermaid-js/mermaid/commit/233e36c9884fcce141a72ce7c845179781e18632) Thanks [@ashishjain0512](https://github.com/ashishjain0512)! - chore: Update render options

- Updated dependencies [[`6c5b7ce`](https://github.com/mermaid-js/mermaid/commit/6c5b7ce9f41c0fbd59fe03dbefc8418d97697f0a), [`9e3aa70`](https://github.com/mermaid-js/mermaid/commit/9e3aa705ae21fd4898504ab22d775a9e437b898e), [`de2c05c`](https://github.com/mermaid-js/mermaid/commit/de2c05cd5463af68d19dd7b6b3f1303d69ddb2dd)]:
  - mermaid@11.3.0

## 0.1.4

### Patch Changes

- [#5847](https://github.com/mermaid-js/mermaid/pull/5847) [`dd03043`](https://github.com/mermaid-js/mermaid/commit/dd0304387e85fc57a9ebb666f89ef788c012c2c5) Thanks [@sidharthv96](https://github.com/sidharthv96)! - chore: fix render types

## 0.1.3

### Patch Changes

- [#5810](https://github.com/mermaid-js/mermaid/pull/5810) [`33a809f`](https://github.com/mermaid-js/mermaid/commit/33a809f09a9aa1f84ba06201ab550bad81c3ff65) Thanks [@knsv](https://github.com/knsv)! - fix: Updates to the default elk configuration
  feat: exposing cycleBreakingStrategy to the configuration so that it can be modified suing the configuration.
- Updated dependencies [[`6ecdf7b`](https://github.com/mermaid-js/mermaid/commit/6ecdf7be688efdc53c52fea3ba891327242bc890), [`28bd07f`](https://github.com/mermaid-js/mermaid/commit/28bd07fdeb4fc981107d21317ec6160b31f80116), [`8e640da`](https://github.com/mermaid-js/mermaid/commit/8e640da5436e8ae013b11b1c1821a9afcc15d0d3), [`256a148`](https://github.com/mermaid-js/mermaid/commit/256a148bbf484fc7db6c19f94dd69d5d268ee048), [`16faef4`](https://github.com/mermaid-js/mermaid/commit/16faef4613b91a7d3a98a1563c25b57f9238acc7)]:
  - mermaid@11.1.0

## 0.1.2

### Patch Changes

- [#5761](https://github.com/mermaid-js/mermaid/pull/5761) [`b34dfe8`](https://github.com/mermaid-js/mermaid/commit/b34dfe8f45eded31da10965ced7ea40fde1ca76c) Thanks [@sidharthv96](https://github.com/sidharthv96)! - Fix type file path

## 0.1.1

### Patch Changes

- [#5758](https://github.com/mermaid-js/mermaid/pull/5758) [`501a55d`](https://github.com/mermaid-js/mermaid/commit/501a55d8f225901ba345c498dec4298490a0196e) Thanks [@sidharthv96](https://github.com/sidharthv96)! - fix: Types path

- Updated dependencies [[`5deaef4`](https://github.com/mermaid-js/mermaid/commit/5deaef456e74d796866431c26f69360e4e74dbff)]:
  - mermaid@11.0.2
