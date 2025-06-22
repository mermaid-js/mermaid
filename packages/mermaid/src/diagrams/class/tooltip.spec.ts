import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ClassDB } from './classDb.js';

const fakeRect = { left: 0, right: 0, top: 0, bottom: 0 };

describe('class diagram tooltip line breaks', () => {
  let db: ClassDB;
  let container: HTMLDivElement;
  let tooltip: HTMLDivElement;
  beforeEach(() => {
    db = new ClassDB();
    container = document.createElement('div');
    tooltip = document.createElement('div');
    tooltip.className = 'mermaidTooltip';
    document.body.appendChild(tooltip);
    container.innerHTML = `
      <svg>
        <g class="node" title="Line1&lt;br&gt;Line2"></g>
        <g class="node" title="Line3&lt;br/&gt;Line4"></g>
      </svg>`;
    const nodes = container.querySelectorAll<SVGGElement>('g.node');
    nodes.forEach((n) => {
      // @ts-ignore - override for test
      n.getBoundingClientRect = () => fakeRect;
    });
    db.bindFunctions(container);
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('replaces &lt;br&gt; with <br/>', () => {
    const node = container.querySelectorAll('g.node')[0] as SVGGElement;
    node.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(tooltip.innerHTML).toBe('Line1<br/>Line2');
  });

  it('replaces &lt;br/&gt; with <br/>', () => {
    const node = container.querySelectorAll('g.node')[1] as SVGGElement;
    node.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(tooltip.innerHTML).toBe('Line3<br/>Line4');
  });
});
