/**
 * Mocked state diagram v2 renderer
 */

import { vi } from 'vitest';

export const setConf = vi.fn();
export const getClasses = vi.fn().mockImplementation(() => {
  return {};
});
export const stateDomId = vi.fn().mockImplementation(() => {
  return 'mocked-stateDiagram-stateDomId';
});
export const draw = vi.fn().mockImplementation(() => {
  return '';
});

export default {
  setConf,
  getClasses,
  draw,
};
