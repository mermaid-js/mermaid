export type {
  DdltFixtureProfile,
  DdltManifest,
  DdltManifestEntry,
  FixtureNodeSize,
  LayoutTestBackend,
  LayoutTestBackendId,
  LayoutTestFixture,
  OrthogonalTrace,
  SizesFixture,
} from './types.js';
export { layoutTestsDir } from './paths.js';
export {
  loadFreshSizesFixture,
  loadSizesFixture,
  applyFixtureContentSizesStrict,
  applyFixtureLabelSizesStrict,
  applySyntheticContentSizes,
  applySyntheticLabelSizes,
} from './fixtureSizes.js';
export type { SyntheticSizesOptions } from './fixtureSizes.js';
export { parseMmdFileToLayoutData } from './parseToLayoutData.js';
export type { ParseToLayoutDataOptions } from './parseToLayoutData.js';
export { discoverLayoutTestFixtures } from './discoverFixtures.js';
export { injectDomusEdgeLabelNodes } from './domusEdgeLabelInject.js';
export {
  parseApplySizesAndLayout,
  runDomusOrthogonalDdlt,
  runSwimlanesDdlt,
  getLayoutTestBackend,
  backendsForProfile,
} from './backends.js';
export { loadDdltFixture } from './loadDdltFixture.js';
export { baselineDdltSpec } from './baselineDdltSpec.js';
export {
  cloneLayoutDataForDomMeasure,
  copyMeasuredGraphOntoCanonical,
} from '../../cloneLayoutDataForMeasure.js';
export { combineValidateLayoutResults } from './aggregateValidate.js';
export type { AggregateValidateReport, NamedValidateResult } from './aggregateValidate.js';
