import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { select } from 'd3';
import { setConfig } from '../../config.js';
import { draw } from './gitGraphRenderer.js';
import { db, clear } from './gitGraphAst.js';
import { parser } from './gitGraphParser.js';

describe('GitGraph Click Events (Rendering)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    setConfig({ securityLevel: 'loose' });
    clear();

    // Mock SVG getBBox method
    // @ts-ignore - jsdom doesn't implement getBBox
    Element.prototype.getBBox = vi.fn(() => ({ x: 0, y: 0, width: 100, height: 50 }));
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should create anchor elements for commits during construction', async () => {
    const diagram = `
      gitGraph
        commit id: "cl-same-tab"
        click commit "cl-same-tab" "https://example.com" "Tooltip"
    `;
    await parser.parse(diagram);
    const svgId = 'gitgraph-click-test';
    const svg = select(container).append('svg').attr('id', svgId);

    // @ts-ignore - partial diagram object for testing
    await draw(diagram, svgId, '1.0', { db, type: 'gitGraph' });

    const anchor = svg.select('a');
    expect(anchor.empty()).toBe(false);
    expect(anchor.attr('xlink:href')).toBe('https://example.com');
    expect(anchor.attr('rel')).toBe('noopener noreferrer');
    expect(anchor.select('title').text()).toBe('Tooltip');
    expect(svg.select('.commit.clickable').empty()).toBe(false);
  });

  it('should respect securityLevel="strict" and NOT create anchors', async () => {
    setConfig({ securityLevel: 'strict' });
    const diagram = `
      gitGraph
        commit id: "cl-same-tab"
        click commit "cl-same-tab" "https://example.com"
    `;
    await parser.parse(diagram);
    const svgId = 'gitgraph-strict-test';
    const svg = select(container).append('svg').attr('id', svgId);

    // @ts-ignore - partial diagram object for testing
    await draw(diagram, svgId, '1.0', { db, type: 'gitGraph' });

    expect(svg.select('a').empty()).toBe(true);
    expect(svg.select('.clickable').empty()).toBe(true);
  });

  it('should force target="_top" when securityLevel="sandbox"', async () => {
    setConfig({ securityLevel: 'sandbox' });
    const diagram = `
      gitGraph
        commit id: "cl-same-tab"
        click commit "cl-same-tab" "https://example.com" _blank
    `;
    await parser.parse(diagram);
    const svgId = 'gitgraph-sandbox-test';
    const svg = select(container).append('svg').attr('id', svgId);

    // @ts-ignore - partial diagram object for testing
    await draw(diagram, svgId, '1.0', { db, type: 'gitGraph' });

    expect(svg.select('a').attr('target')).toBe('_top');
  });

  it('should create anchors for branches and tags', async () => {
    const diagram = `
      gitGraph
        branch "br-same-tab"
        commit id: "c1" tag: "tg-new-tab"
        click branch "br-same-tab" "https://example.com/branch"
        click tag "tg-new-tab" "https://example.com/tag"
    `;
    await parser.parse(diagram);
    const svgId = 'gitgraph-branch-tag-test';
    const svg = select(container).append('svg').attr('id', svgId);

    // @ts-ignore - partial diagram object for testing
    await draw(diagram, svgId, '1.0', { db, type: 'gitGraph' });

    const anchors = svg.selectAll('a');
    expect(anchors.size()).toBe(2);
    expect(svg.select('.branchLabel.clickable').empty()).toBe(false);
    expect(svg.select('.tag.clickable').empty()).toBe(false);
  });

  it('should ignore invalid targets at runtime', async () => {
    const diagram = `
      gitGraph
        commit id: "c1"
        click commit "c1" "https://example.com"
    `;
    await parser.parse(diagram);

    db.setLink('c1', 'https://example.com', 'commit', undefined, 'invalid-target' as any);

    const svgId = 'gitgraph-invalid-target-test';
    const svg = select(container).append('svg').attr('id', svgId);

    // @ts-ignore - partial diagram object for testing
    await draw(diagram, svgId, '1.0', { db, type: 'gitGraph' });

    const anchor = svg.select('a');
    expect(anchor.attr('target')).toBeNull();
  });
});
