import { describe, expect, it } from 'vitest';
import WidthProviderOnBrowser from '../../../src/positioning/WidthProviderFunc';
import { TextType } from '../../../src/positioning/Coordinate';

describe('WidthProviderOnBrowser', () => {
  it('should know the width of a string', () => {
    const width = WidthProviderOnBrowser('foo', TextType.MessageContent);
    // TODO: Find a way to test it on real browser. Otherwise it is always 0
    expect(width).toBe(0);
  });
});
