import { describe, it, expect, vi, beforeEach } from 'vitest';
import { select } from 'd3';

const mocks = vi.hoisted(() => ({
  getConfig: vi.fn(),
  getEffectiveHtmlLabels: vi.fn(),
  createLabel: vi.fn(),
}));

vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: mocks.getConfig,
}));

vi.mock('../../config.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getEffectiveHtmlLabels: mocks.getEffectiveHtmlLabels,
}));

vi.mock('./createLabel.js', () => ({
  default: mocks.createLabel,
}));

import { insertCluster } from './clusters.js';

const baseConfig = (overrides = {}) => ({
  themeVariables: { clusterBkg: '#fff', clusterBorder: '#000' },
  handDrawnSeed: 0,
  securityLevel: 'loose',
  flowchart: {},
  ...overrides,
});

const baseNode = (overrides = {}) => ({
  id: 'sub1',
  domId: 'sub1',
  cssClasses: 'cluster',
  look: 'neo',
  label: 'My subgraph',
  labelStyle: '',
  padding: 8,
  width: 100,
  height: 100,
  x: 50,
  y: 50,
  rx: 0,
  ry: 0,
  ...overrides,
});

describe('clusters rect - click/link support on subgraphs (#5428)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mocks.getConfig.mockReset().mockReturnValue(baseConfig());
    mocks.getEffectiveHtmlLabels.mockReset().mockReturnValue(false);
    mocks.createLabel.mockReset().mockImplementation((parent) => {
      const node = parent.insert('text').text('label').node();
      node.getBBox = () => ({ x: 0, y: 0, width: 40, height: 20 });
      return Promise.resolve(node);
    });

    // jsdom does not implement SVG layout, so getBBox() is not available on
    // SVG elements. Stub it so the rect/cluster sizing code can run.
    global.SVGElement.prototype.getBBox = () => ({
      x: 0,
      y: 0,
      width: 40,
      height: 20,
    });
  });

  it('wraps the cluster label in an <a> when node.link is set', async () => {
    const svg = select(document.body).append('svg');
    const node = baseNode({ link: 'https://example.com' });

    const { cluster } = await insertCluster(svg, node);

    const anchor = cluster.select('a');
    expect(anchor.empty()).toBe(false);
    expect(anchor.attr('xlink:href')).toBe('https://example.com');
    expect(anchor.attr('target')).toBe('_blank');
    expect(anchor.select('g.cluster-label').empty()).toBe(false);
  });

  it('uses node.linkTarget as the anchor target when provided', async () => {
    const svg = select(document.body).append('svg');
    const node = baseNode({ link: 'https://example.com', linkTarget: '_self' });

    const { cluster } = await insertCluster(svg, node);

    expect(cluster.select('a').attr('target')).toBe('_self');
  });

  it('forces target=_top when securityLevel is sandbox, regardless of linkTarget', async () => {
    mocks.getConfig.mockReturnValue(baseConfig({ securityLevel: 'sandbox' }));
    const svg = select(document.body).append('svg');
    const node = baseNode({ link: 'https://example.com', linkTarget: '_self' });

    const { cluster } = await insertCluster(svg, node);

    expect(cluster.select('a').attr('target')).toBe('_top');
  });

  it('does not wrap the label in an anchor when node.link is not set', async () => {
    const svg = select(document.body).append('svg');
    const node = baseNode();

    const { cluster } = await insertCluster(svg, node);

    expect(cluster.select('a').empty()).toBe(true);
    expect(cluster.select('g.cluster-label').empty()).toBe(false);
  });
});
