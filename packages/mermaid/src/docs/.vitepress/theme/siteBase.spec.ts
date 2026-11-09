import { describe, expect, it, vi } from 'vitest';
import { addBase } from './siteBase.js';

vi.mock('vitepress', () => ({ withBase: (path: string) => path }));

describe('addBase', () => {
  it.each([
    ['/icons/folder.svg', '/', '/icons/folder.svg'],
    ['/icons/folder.svg', '/open-source/', '/open-source/icons/folder.svg'],
    ['/open-source/icons/folder.svg', '/open-source/', '/open-source/icons/folder.svg'],
  ])('maps %s under base %s to %s', (path, base, expected) => {
    expect(addBase(path, base)).toBe(expected);
  });
});
