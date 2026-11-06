import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from '../../mermaid.js';

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value(this: SVGElement): SVGRect {
      return new DOMRect(0, 0, (this.textContent ?? '').length * 7, 14);
    },
  });
});

describe('Gantt task label placeholders', () => {
  it('renders formatted task properties as text, not markup', async () => {
    mermaid.initialize({
      startOnLoad: false,
      gantt: { useWidth: 1200 },
    });

    const { svg } = await mermaid.render(
      'gantt-placeholder-test',
      `gantt
dateFormat YYYY-MM-DD
My task ends %enddate after %duration <img src=x onerror=alert(1)> :task1, 2020-02-20, 2w`
    );
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const label = doc.querySelector('#gantt-placeholder-test-task1-text');

    expect(label?.textContent?.trim()).toBe(
      'My task ends 2020-03-05 after 2w <img src=x onerror=alert(1)>'
    );
    expect(label?.querySelector('img')).toBeNull();
  });
});
