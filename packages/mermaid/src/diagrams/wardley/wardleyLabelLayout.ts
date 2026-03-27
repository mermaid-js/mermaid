/**
 * Label positioning and layout utilities for Wardley diagrams
 * Handles collision detection and smart label placement to minimize overlaps
 */

export interface LabelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Check if two rectangles overlap
 */
export const rectanglesOverlap = (rect1: LabelPosition, rect2: LabelPosition): boolean => {
  const left1 = rect1.x - rect1.width / 2;
  const right1 = rect1.x + rect1.width / 2;
  const top1 = rect1.y - rect1.height / 2;
  const bottom1 = rect1.y + rect1.height / 2;

  const left2 = rect2.x - rect2.width / 2;
  const right2 = rect2.x + rect2.width / 2;
  const top2 = rect2.y - rect2.height / 2;
  const bottom2 = rect2.y + rect2.height / 2;

  return !(right1 < left2 || right2 < left1 || bottom1 < top2 || bottom2 < top1);
};

/**
 * Calculate overlap area between two rectangles
 */
export const calculateOverlapArea = (rect1: LabelPosition, rect2: LabelPosition): number => {
  const left1 = rect1.x - rect1.width / 2;
  const right1 = rect1.x + rect1.width / 2;
  const top1 = rect1.y - rect1.height / 2;
  const bottom1 = rect1.y + rect1.height / 2;

  const left2 = rect2.x - rect2.width / 2;
  const right2 = rect2.x + rect2.width / 2;
  const top2 = rect2.y - rect2.height / 2;
  const bottom2 = rect2.y + rect2.height / 2;

  const overlapWidth = Math.max(0, Math.min(right1, right2) - Math.max(left1, left2));
  const overlapHeight = Math.max(0, Math.min(bottom1, bottom2) - Math.max(top1, top2));

  return overlapWidth * overlapHeight;
};

/**
 * Get candidate positions for a label (above, below, left, right)
 */
export const getCandidatePositions = (
  componentX: number,
  componentY: number,
  componentRadius: number,
  labelWidth: number,
  labelHeight: number,
  offsetDistance = 18
): LabelPosition[] => {
  return [
    // Above
    {
      x: componentX,
      y: componentY - offsetDistance,
      width: labelWidth,
      height: labelHeight,
    },
    // Below
    {
      x: componentX,
      y: componentY + offsetDistance,
      width: labelWidth,
      height: labelHeight,
    },
    // Left
    {
      x: componentX - offsetDistance,
      y: componentY,
      width: labelWidth,
      height: labelHeight,
    },
    // Right
    {
      x: componentX + offsetDistance,
      y: componentY,
      width: labelWidth,
      height: labelHeight,
    },
  ];
};

/**
 * Calculate total overlap with existing labels
 */
export const calculateTotalOverlap = (
  candidatePosition: LabelPosition,
  existingLabels: LabelPosition[]
): number => {
  let totalOverlap = 0;
  for (const label of existingLabels) {
    totalOverlap += calculateOverlapArea(candidatePosition, label);
  }
  return totalOverlap;
};

/**
 * Find the best position for a label among candidates
 * Returns the position with minimal overlap with existing labels
 */
export const findBestLabelPosition = (
  componentX: number,
  componentY: number,
  componentRadius: number,
  labelWidth: number,
  labelHeight: number,
  existingLabels: LabelPosition[],
  offsetDistance = 18
): LabelPosition => {
  const candidates = getCandidatePositions(
    componentX,
    componentY,
    componentRadius,
    labelWidth,
    labelHeight,
    offsetDistance
  );

  // Find candidate with minimum overlap
  let bestPosition = candidates[0];
  let minOverlap = calculateTotalOverlap(candidates[0], existingLabels);

  for (let i = 1; i < candidates.length; i++) {
    const overlap = calculateTotalOverlap(candidates[i], existingLabels);
    if (overlap < minOverlap) {
      minOverlap = overlap;
      bestPosition = candidates[i];
    }
  }

  return bestPosition;
};
