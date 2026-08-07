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

/** Validation extensions applied to every DOMUS layout. */
export const DOMUS_VALIDATION_EXTENSIONS: readonly LayoutValidationExtension[] = [
  domusLocalCrossingExtension,
  groupTitleNodeOverlapExtension,
];

/** Core validation plus the DOMUS extensions. */
export function validateLayout(layout: LayoutData): ValidateLayoutResult {
  return validateLayoutCore(layout, { extensions: DOMUS_VALIDATION_EXTENSIONS });
}

export type { Issue, LayoutIssueType, ValidateLayoutResult };
