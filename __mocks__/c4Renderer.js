/**
 * Mocked C4Context diagram renderer
 */

import { vi } from 'vitest';

export const drawPersonOrSystemArray = vi.fn();
export const drawBoundary = vi.fn();

export const setConf = vi.fn();

export const draw = vi.fn().mockImplementation(() => {
  return '';
});

export default {
  drawPersonOrSystemArray,
  drawBoundary,
  setConf,
  draw,
};
