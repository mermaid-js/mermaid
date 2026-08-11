/**
 * The DOMUS entry point for layout validation.
 *
 * Every DOMUS pass and spec should import `validateLayout` from here rather
 * than from `layout-utils/validateLayout` directly. The core validator stays
 * algorithm-agnostic and shared; this module is where DOMUS-specific checks and
 * penalties are attached, so a scoring change made for DOMUS cannot move
 * swimlanes or cose-bilkent.
 *
 * If half the passes validated through the core and half through here, the
 * score-gated passes would be optimising against two different objectives, so
 * consistency matters more than it might look.
 */
import type { LayoutData } from '../../types.js';
import {
  validateLayout as validateLayoutCore,
  type Issue,
  type LayoutIssueType,
  type LayoutValidationExtension,
  type ValidateLayoutResult,
} from '../layout-utils/validateLayout.js';
import { domusLocalCrossingExtension } from './validation/localCrossings.js';
import { groupTitleNodeOverlapExtension } from './validation/groupTitleNodeOverlap.js';
import { foreignNodeGroupOverlapExtension } from './validation/foreignNodeGroupOverlap.js';
import { edgeZeroLengthSegmentExtension } from './validation/edgeZeroLengthSegment.js';

/** Validation extensions applied to every DOMUS layout. */
export const DOMUS_VALIDATION_EXTENSIONS: readonly LayoutValidationExtension[] = [
  domusLocalCrossingExtension,
  groupTitleNodeOverlapExtension,
  foreignNodeGroupOverlapExtension,
  edgeZeroLengthSegmentExtension,
];

/**
 * Core validation plus the DOMUS extensions.
 *
 * `abortAboveIssueCount` is forwarded for score-gated passes that only need a
 * fast "does this candidate have fewer issues than the baseline" answer; see the
 * option's docs on the core validator. The extensions are non-negotiable — a
 * caller cannot swap the objective, only ask for an earlier "no".
 */
export function validateLayout(
  layout: LayoutData,
  options: { abortAboveIssueCount?: number } = {}
): ValidateLayoutResult {
  return validateLayoutCore(layout, {
    extensions: DOMUS_VALIDATION_EXTENSIONS,
    abortAboveIssueCount: options.abortAboveIssueCount,
  });
}

export type { Issue, LayoutIssueType, ValidateLayoutResult };
