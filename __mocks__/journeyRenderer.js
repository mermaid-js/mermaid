/**
 * Mocked pie (picChart) diagram renderer
 */

import { vi } from 'vitest';
export const setConf = vi.fn();

export const draw = vi.fn().mockImplementation(() => {
  return '';
});

export default {
  setConf,
  draw,
};
