/**
 * Mocked pie (picChart) diagram renderer
 */
import { vi } from 'vitest';

const draw = vi.fn().mockImplementation(() => '');

export const renderer = { draw };
