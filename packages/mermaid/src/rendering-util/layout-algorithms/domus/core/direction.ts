export type OrthoDirection = 'TB' | 'BT' | 'LR' | 'RL' | 'TD' | 'DT';

export function normalizeOrthoDirection(
  dir: string | null | undefined
): OrthoDirection | undefined {
  const d = typeof dir === 'string' ? dir.trim().toUpperCase() : '';
  if (!d) {
    return undefined;
  }
  if (d === 'TB' || d === 'BT' || d === 'LR' || d === 'RL' || d === 'TD' || d === 'DT') {
    return d;
  }
  return undefined;
}

export function isVerticalOrthoDirection(dir: string | null | undefined): boolean {
  const d = normalizeOrthoDirection(dir);
  return d === 'TB' || d === 'BT' || d === 'TD' || d === 'DT';
}

export function isHorizontalOrthoDirection(dir: string | null | undefined): boolean {
  const d = normalizeOrthoDirection(dir);
  return d === 'LR' || d === 'RL';
}

export function oppositeOrthoDirection(dir: string | null | undefined): OrthoDirection | undefined {
  const d = normalizeOrthoDirection(dir);
  if (!d) {
    return undefined;
  }
  switch (d) {
    case 'TB':
      return 'BT';
    case 'BT':
      return 'TB';
    case 'LR':
      return 'RL';
    case 'RL':
      return 'LR';
    case 'TD':
      return 'DT';
    case 'DT':
      return 'TD';
  }
}

/**
 * In vertical flowcharts (TB/BT/TD/DT), prefer preserving the horizontal layering (x),
 * i.e. when nudging we bias toward moving along x rather than disrupting vertical ordering.
 */
export function preferAxisForVerticalFlowNudges(dir: string | null | undefined): 'x' | undefined {
  return isVerticalOrthoDirection(dir) ? 'x' : undefined;
}
