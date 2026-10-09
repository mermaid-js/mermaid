import { describe, expect, it } from 'vitest';
import { hasTextBesidesImages } from './labelImageUtils.js';

function html(markup: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = markup;
  return div;
}

describe('labelImageUtils', () => {
  it('does not count image elements as label text', () => {
    expect(hasTextBesidesImages(html(' <img src="x"> <img src="y"> '))).toBe(false);
  });

  it('detects text next to image elements', () => {
    expect(hasTextBesidesImages(html('<img src="x"> label'))).toBe(true);
  });

  it('handles repeated malformed img-like text without regex parsing', () => {
    const div = document.createElement('div');
    div.textContent = '<img'.repeat(5000);

    expect(hasTextBesidesImages(div)).toBe(true);
  });
});
