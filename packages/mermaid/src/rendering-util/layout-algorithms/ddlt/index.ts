export type {
  DdltFixtureProfile,
  DdltManifest,
  DdltManifestEntry,
  FixtureNodeSize,
  FixtureGroupLabelSize,
  FixtureEdgeLabelSize,
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
  applyFixtureGroupLabelSizesStrict,
  applyFixtureEdgeLabelSizesStrict,
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
export { measureLayoutWithFixture } from './jsdomMeasure.js';
export type { JsdomMeasureOptions, JsdomMeasureResult } from './jsdomMeasure.js';
export { loadDdltFixture } from './loadDdltFixture.js';
export { baselineDdltSpec } from './baselineDdltSpec.js';
export {
  cloneLayoutDataForDomMeasure,
  copyMeasuredGraphOntoCanonical,
} from '../../cloneLayoutDataForMeasure.js';
export { combineValidateLayoutResults } from './aggregateValidate.js';
export type { AggregateValidateReport, NamedValidateResult } from './aggregateValidate.js';
