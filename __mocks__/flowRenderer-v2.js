/**
 * Mocked flow (flowchart) diagram v2 renderer
 */

import { vi } from 'vitest';

export const setConf = vi.fn();
export const addVertices = vi.fn();
export const addEdges = vi.fn();
export const getClasses = vi.fn().mockImplementation(() => {
  return {};
});

export const draw = vi.fn().mockImplementation(() => {
  return '';
});

export default {
  setConf,
  addVertices,
  addEdges,
  getClasses,
  draw,
};
