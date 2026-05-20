import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from '../../mermaid.js';
import { mermaidAPI } from '../../mermaidAPI.js';

const installDom = () => {
  const dom = new JSDOM(`<html lang="en"><body><div id="container"></div></body></html>`, {
    resources: 'usable',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeParse(_window: any) {
      _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 30 });
      _window.Element.prototype.getComputedTextLength = () => 50;
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window = dom.window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).document = dom.window.document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).MutationObserver = undefined;
  return dom;
};

describe('network renderer', () => {
  beforeAll(async () => {
    await mermaid.registerExternalDiagrams([]);
    mermaid.initialize({
      deterministicIds: true,
      deterministicIDSeed: 'network-test',
      logLevel: 5,
    });
  });

  it('renders an SVG with one icon per node and one line per link', async () => {
    installDom();
    const code = `networkDiagram
    node router : router "Router"
    node sw1 : switch "Switch 1"
    node sw2 : switch "Switch 2"
    node srv : server "Server"
    router --- sw1
    router --- sw2
    sw1 --- srv : "primary"
    sw2 --- srv : "secondary"`;
    const { svg } = await mermaidAPI.render('network-1', code);
    const dom = new JSDOM(svg);
    const root = dom.window.document.body.firstElementChild!;
    expect(root.querySelectorAll('.networkNode').length).toBe(4);
    expect(root.querySelectorAll('.networkLink').length).toBe(4);
    expect(root.querySelectorAll('.networkLinkLabel').length).toBe(2);
    expect(root.querySelector('.networkTitle')).toBeNull();
  });

  it('renders the diagram title when provided', async () => {
    installDom();
    const code = `networkDiagram
    title Sample Topology
    node a : router
    node b : switch
    a --- b`;
    const { svg } = await mermaidAPI.render('network-2', code);
    const dom = new JSDOM(svg);
    const titleEl = dom.window.document.querySelector('.networkTitle');
    expect(titleEl?.textContent).toBe('Sample Topology');
  });

  it('auto-registers nodes that are only referenced in links', async () => {
    installDom();
    const code = `network
    a --- b
    b --- c`;
    const { svg } = await mermaidAPI.render('network-3', code);
    const dom = new JSDOM(svg);
    const nodes = dom.window.document.querySelectorAll('.networkNode');
    expect(nodes.length).toBe(3);
    const ids = [...nodes].map((n) => n.getAttribute('data-id'));
    expect(ids.sort()).toEqual(['a', 'b', 'c']);
  });

  it('uses the default icon class for unknown types', async () => {
    installDom();
    const code = `networkDiagram
    node x : whatever`;
    const { svg } = await mermaidAPI.render('network-4', code);
    const dom = new JSDOM(svg);
    expect(dom.window.document.querySelector('.networkNode-whatever')).not.toBeNull();
  });
});
