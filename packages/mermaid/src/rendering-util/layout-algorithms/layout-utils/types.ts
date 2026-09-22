/**
 * Shared geometry types for layout-utils (validateLayout, scoreLayout, helpers,
 * geometry). Intentionally minimal — see the original orthogonal pipeline types
 * file for the full surface used by the routing backend.
 */

/** A 2D point with x and y coordinates. */
export interface Point {
  x: number;
  y: number;
}

/** A rectangle defined by center point and boundaries. */
export interface Rect {
  /** Center x coordinate */
  cx: number;
  /** Center y coordinate */
  cy: number;
  /** Left edge x coordinate */
  left: number;
  /** Right edge x coordinate */
  right: number;
  /** Top edge y coordinate */
  top: number;
  /** Bottom edge y coordinate */
  bottom: number;
}

/**
 * Port side on a node boundary.
 * E = East (right), W = West (left), N = North (top), S = South (bottom)
 */
export type PortSide = 'E' | 'W' | 'N' | 'S';
