/**
 * Mocked Sankey diagram renderer
 */
import { vi } from 'vitest';

export const draw = vi.fn().mockImplementation(() => undefined);

export const renderer = { draw };
