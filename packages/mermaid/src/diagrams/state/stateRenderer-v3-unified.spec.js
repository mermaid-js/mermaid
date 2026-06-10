import { vi, describe, it, expect, beforeEach } from 'vitest';

const renderState = vi.hoisted(() => ({
  nodeClass: 'node',
}));

vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(() => ({
    securityLevel: 'loose',
    state: {
      titleTopMargin: 25,
      useMaxWidth: true,
      nodeSpacing: 50,
      rankSpacing: 50,
    },
    layout: 'dagre',
    look: 'classic',
  })),
}));

vi.mock('../../rendering-util/render.js', () => ({
  render: vi.fn((data, svg) => {
    const layoutNode = data.nodes.find((node) => node.id === 'A') ?? data.nodes[0];
    if (layoutNode) {
      layoutNode.domId = `${svg.attr('id')}-${layoutNode.id}`;
    }
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node.setAttribute('class', renderState.nodeClass);
    node.setAttribute('id', layoutNode?.domId ?? 'state-A-0');

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.textContent = Array.isArray(layoutNode?.label)
      ? layoutNode.label[0]
      : (layoutNode?.label ?? 'Google');
    node.appendChild(label);

    svg.node().appendChild(node);
  }),
}));

vi.mock('../../rendering-util/setupViewPortForSVG.js', () => ({
  setupViewPortForSVG: vi.fn(),
}));

import { StateDB } from './stateDb.js';
import { draw } from './stateRenderer-v3-unified.js';

const DIAGRAM_ID = 'state-click-tooltip';

describe('stateRenderer v3 clickable links', () => {
  beforeEach(() => {
    document.body.innerHTML = `<svg id="${DIAGRAM_ID}"></svg>`;
  });

  it.each(['node', 'rough-node'])(
    'uses mermaidTooltip for state click tooltips on %s elements',
    async (nodeClass) => {
      renderState.nodeClass = nodeClass;

      const stateDb = new StateDB(1);
      stateDb.setRootDoc([{ stmt: 'state', id: 'A', description: 'Google' }]);
      stateDb.addLink('A', '"https://google.com"', '"Visit Google"');

      await draw('', DIAGRAM_ID, '1.0.0', {
        type: 'stateDiagram',
        db: stateDb,
      });

      const node = document.querySelector(`svg#${DIAGRAM_ID} a > g.${nodeClass}`);

      expect(node).not.toBeNull();
      expect(node.getAttribute('title')).toBe('Visit Google');

      stateDb.bindFunctions(document.body);

      const tooltip = document.querySelector('.mermaidTooltip');
      expect(tooltip).not.toBeNull();

      node.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }));

      expect(tooltip.innerHTML).toBe('Visit Google');
      expect(node.classList.contains('hover')).toBe(true);

      node.dispatchEvent(new window.MouseEvent('mouseout', { bubbles: true }));

      expect(node.classList.contains('hover')).toBe(false);
    }
  );
});
