/**
 * Mocked sequence diagram renderer
 */

import { vi } from 'vitest';

export const bounds = vi.fn();
export const drawActors = vi.fn();
export const drawActorsPopup = vi.fn();

export const setConf = vi.fn();

export const draw = vi.fn().mockImplementation(() => {
  return '';
});

export default {
  bounds,
  drawActors,
  drawActorsPopup,
  setConf,
  draw,
};
