/**
 * Deterministic pseudo-random number generator (mulberry32).
 * Returns a function that produces values in [0, 1).
 */
export function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Simple string hash for seeding the PRNG.
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return hash;
}

/**
 * Resolve the boundary-waviness seed. A non-zero configured seed takes
 * precedence so renders are reproducible (visual regression tests). When the
 * configured seed is 0 or absent we fall back to hashing the SVG element id,
 * which gives each rendered diagram its own waviness pattern at the cost of
 * being unstable across renders.
 */
export function resolveSeed(configuredSeed: number | undefined, id: string): number {
  if (
    typeof configuredSeed === 'number' &&
    Number.isFinite(configuredSeed) &&
    configuredSeed !== 0
  ) {
    return configuredSeed;
  }
  return hashString(id);
}

/**
 * Generate a vertical wavy line (the "fold") through the center of the diagram.
 * Uses cubic bezier segments with alternating control point offsets.
 * @param width - diagram width
 * @param height - diagram height
 * @param seed - deterministic seed for variation
 * @param amplitudeOverride - optional amplitude in pixels; falls back to 1.5% of width
 * @returns SVG path d attribute string
 */
export function generateFoldPath(
  width: number,
  height: number,
  seed: number,
  amplitudeOverride?: number
): string {
  const cx = width / 2;
  const amplitude = amplitudeOverride ?? width * 0.015;
  const segments = 7;
  const segHeight = height / segments;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= segments; i++) {
    const jitter = seededRandom(seed + i * 17) * amplitude * 2 - amplitude;
    points.push({ x: cx + jitter, y: i * segHeight });
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midY = (p0.y + p1.y) / 2;
    const dir = i % 2 === 0 ? 1 : -1;
    const offset = amplitude * 1.5 * dir * seededRandom(seed + i * 31 + 7);
    const cp1x = p0.x + offset;
    const cp1y = midY;
    const cp2x = p1.x - offset;
    const cp2y = midY;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
  }

  return d;
}

/**
 * Generate a horizontal wavy line through the center of the diagram.
 *
 * Defaults to spanning the full width, but accepts an x-range so a single side
 * can be drawn. The Complex/Chaotic boundary (left half) is a genuine phase
 * shift and uses this wavy line; the Clear/Complicated boundary (right half) is
 * a gradient, not a phase shift, and is drawn separately via
 * {@link generateGradientBoundary}. The range endpoints are pinned to the centre
 * line so the wavy half meets the gradient half cleanly at the diagram centre.
 * @param width - diagram width
 * @param height - diagram height
 * @param seed - deterministic seed for variation
 * @param amplitudeOverride - optional amplitude in pixels; falls back to 1.5% of height
 * @param xStart - left edge of the segment (defaults to 0)
 * @param xEnd - right edge of the segment (defaults to width)
 * @returns SVG path d attribute string
 */
export function generateHorizontalBoundary(
  width: number,
  height: number,
  seed: number,
  amplitudeOverride?: number,
  xStart = 0,
  xEnd = width
): string {
  const cy = height / 2;
  const amplitude = amplitudeOverride ?? height * 0.015;
  const segments = 7;
  const segWidth = (xEnd - xStart) / segments;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= segments; i++) {
    // Pin the endpoints to the centre line so adjoining segments meet cleanly.
    const jitter =
      i === 0 || i === segments ? 0 : seededRandom(seed + i * 23) * amplitude * 2 - amplitude;
    points.push({ x: xStart + i * segWidth, y: cy + jitter });
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    const dir = i % 2 === 0 ? 1 : -1;
    const offset = amplitude * 1.5 * dir * seededRandom(seed + i * 37 + 11);
    const cp1x = midX;
    const cp1y = p0.y + offset;
    const cp2x = midX;
    const cp2y = p1.y - offset;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
  }

  return d;
}

/**
 * Generate a plain straight boundary line between two ordered domains.
 *
 * Used for the Clear/Complicated boundary, which is a gradient rather than a
 * phase shift — unlike the central fold, the Complex/Chaotic boundary, and the
 * Clear/Chaotic cliff, crossing it is a smooth, reversible transition, so it is
 * drawn as a simple straight line with no waviness.
 * @param xStart - left edge of the line
 * @param xEnd - right edge of the line
 * @param y - vertical position of the line
 * @returns SVG path d attribute string
 */
export function generateGradientBoundary(xStart: number, xEnd: number, y: number): string {
  return `M${xStart},${y} L${xEnd},${y}`;
}

/**
 * Generate the "cliff" path between Clear (bottom-right) and Chaotic (bottom-left).
 * This is a thicker, more abrupt boundary near the bottom center.
 * @param width - diagram width
 * @param height - diagram height
 * @returns SVG path d attribute string
 */
export function generateCliffPath(width: number, height: number): string {
  const cx = width / 2;
  const topY = height * 0.5;
  const bottomY = height;
  const amplitude = width * 0.03;

  // A steep S-curve from the center downward
  return [
    `M${cx},${topY}`,
    `C${cx + amplitude},${topY + (bottomY - topY) * 0.2}`,
    `${cx - amplitude * 1.5},${topY + (bottomY - topY) * 0.55}`,
    `${cx + amplitude * 0.5},${topY + (bottomY - topY) * 0.75}`,
    `C${cx - amplitude},${topY + (bottomY - topY) * 0.85}`,
    `${cx + amplitude * 0.3},${topY + (bottomY - topY) * 0.95}`,
    `${cx},${bottomY}`,
  ].join(' ');
}

/**
 * Generate an ellipse SVG path for the Aporetic region at the center.
 * @param cx - center x
 * @param cy - center y
 * @param rx - horizontal radius
 * @param ry - vertical radius
 * @returns SVG path d attribute string for an ellipse
 */
export function generateAporeticPath(cx: number, cy: number, rx: number, ry: number): string {
  // Draw an ellipse using two arc commands
  return [
    `M${cx - rx},${cy}`,
    `A${rx},${ry} 0 1,1 ${cx + rx},${cy}`,
    `A${rx},${ry} 0 1,1 ${cx - rx},${cy}`,
    'Z',
  ].join(' ');
}
