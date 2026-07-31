# @mermaid-js/layout-elk

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
