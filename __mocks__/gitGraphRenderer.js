/**
 * Mocked git (graph) diagram renderer
 */

import { vi } from 'vitest';

export const draw = vi.fn().mockImplementation(() => {
  return '';
});

export default {
  draw,
};
