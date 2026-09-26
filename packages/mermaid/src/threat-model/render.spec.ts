// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderThreatModel } from './render.js';
import type { ThreatModel } from './model.js';
import type { LayoutData } from '../rendering-util/types.js';

function scene() {
  document.body.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg"><g id="node-API"><circle/></g><g id="Zone"><rect/></g><path id="diagram-query"/></svg>';
  const svg = document.querySelector('svg')!;
  // jsdom has no SVG layout engine. Browser layout is tested separately.
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 400, height: 200 }),
  });
  const data = {
    diagramId: 'diagram',
    nodes: [
      { id: 'API', domId: 'node-API' },
      { id: 'Zone', domId: 'Zone' },
    ],
  } as LayoutData;
  const model: ThreatModel = {
    version: 1,
    id: 'test',
    state: 'draft',
    elements: [
      { id: 'API', kind: 'process' },
      { id: 'query', kind: 'flow' },
      { id: 'Zone', kind: 'boundary' },
    ],
    threats: [
      {
        id: 'T1',
        title: '<script>alert(1)</script>',
        description: '<img src=x onerror="alert(1)">',
        targets: ['API', 'query'],
        severity: 'high',
        status: 'open',
        tickets: ['javascript:alert(1)'],
      },
    ],
  };
  return { svg, data, model };
}

describe('threat model SVG annotations', () => {
  it('marks nodes, explicit edges and trust boundaries; prints the register', () => {
    const { svg, model, data } = scene();
    renderThreatModel(svg, model, data);
    expect(svg.querySelector('#node-API')?.getAttribute('data-threat-ids')).toBe('T1');
    expect(svg.querySelector('#diagram-query')?.getAttribute('data-threat-ids')).toBe('T1');
    expect(svg.querySelector('circle')?.style.stroke).toBe('#c2410c');
    expect(svg.querySelector('#Zone rect')?.getAttribute('style')).toContain(
      'stroke-dasharray: 8 5'
    );
    expect(svg.querySelector('.threat-model-register')?.textContent).toContain('T1 | HIGH | open');
    expect(svg.textContent).toContain('Deployment review required');
  });
  it('renders untrusted strings only as text, never links or HTML', () => {
    const { svg, model, data } = scene();
    renderThreatModel(svg, model, data);
    expect(svg.querySelectorAll('script, img, a, foreignObject, [onerror]')).toHaveLength(0);
    expect(svg.textContent).toContain('<script>alert(1)</script>');
    expect(svg.textContent).toContain('javascript:alert(1)');
  });
  it('uses the highest active severity, not the last threat', () => {
    const { svg, model, data } = scene();
    model.threats.push({
      ...model.threats[0],
      id: 'T2',
      severity: 'critical',
      status: 'mitigated',
    });
    model.threats.push({ ...model.threats[0], id: 'T3', severity: 'low' });
    renderThreatModel(svg, model, data);
    expect(svg.querySelector('circle')?.style.stroke).toBe('#c2410c');
  });
  it('keeps hidden targets in the register', () => {
    const { svg, model, data } = scene();
    svg.querySelector('#node-API')?.remove();
    expect(() => renderThreatModel(svg, model, data)).not.toThrow();
    expect(svg.textContent).toContain('On: API, query');
  });
});
