import { select } from 'd3';
import { setConfig } from '../../config.js';
import { addDetector } from '../../diagram-api/detectType.js';
import { Diagram } from '../../Diagram.js';
import { ensureNodeFromSelector, jsdomIt } from '../../tests/util.js';
import flowDetector from './flowDetector-v2.js';
import { draw } from './flowRenderer-v3-unified.js';
const { id, detector, loader } = flowDetector;

addDetector(id, detector, loader); // Add architecture schemas to Mermaid

describe('Accessibility', function () {
  jsdomIt('should hide edges', async () => {
    const svgNode = await drawDiagram(`
      flowchart
        A[First node] --> B[Second node]
    `);
    const edgePaths = svgNode.querySelectorAll('.edgePaths');
    expect(edgePaths).toHaveLength(1);
    expect(edgePaths[0].getAttribute('aria-hidden')).toBe('true');
    const edgeLabels = svgNode.querySelectorAll('.edgeLabels');
    expect(edgeLabels).toHaveLength(1);
    expect(edgeLabels[0].getAttribute('aria-hidden')).toBe('true');
  });

  jsdomIt('should be an aria list of nodes, in declaration order', async () => {
    const svgNode = await drawDiagram(`
      flowchart
        A[First node] --> B[Second node]
    `);
    const list = svgNode.querySelectorAll('g.nodes[role=list]');
    expect(list).toHaveLength(1);
    const nodes = [...list[0].querySelectorAll('g.node[role=listitem]')];
    expect(nodes.map((node) => node.textContent)).toEqual(['First node', 'Second node']);
  });

  jsdomIt('should link to subsequent node', async () => {
    const svgNode = await drawDiagram(`
      flowchart
        A[First node] --> B[Second node]
    `);
    const nodeA = svgNode.querySelector('#flowchart-A-0');
    expect(nodeA).toBeTruthy();
    const outboundList = nodeA!.querySelector('[role=list]');
    expect(outboundList?.getAttribute('aria-label')).toBe('Outbound edges');
    const outboundListItems = [...outboundList!.querySelectorAll('[role=listitem] a')];
    expect(outboundListItems.map((item) => item.getAttribute('aria-label'))).toEqual([
      'Second node',
    ]);
    expect(
      outboundListItems.map((item) => item.getAttributeNS('http://www.w3.org/1999/xlink', 'href'))
    ).toEqual(['#flowchart-B-1']);
  });

  jsdomIt('should also link to previous node when configured', async () => {
    setConfig({ accessibility: { listInboundEdges: true } });
    const svgNode = await drawDiagram(`
      flowchart
        A[First node] --> B[Second node]
      `);
    const nodeA = svgNode.querySelector('#flowchart-A-0');
    expect(nodeA, 'Missing first node').toBeTruthy();
    const outboundList = nodeA!.querySelector('[role=list]');
    expect(outboundList?.getAttribute('aria-label')).toBe('Outbound edges');
    const outboundListItems = [...outboundList!.querySelectorAll('[role=listitem] a')];
    expect(outboundListItems.map((item) => item.getAttribute('aria-label'))).toEqual([
      'Second node',
    ]);
    expect(
      outboundListItems.map((item) => item.getAttributeNS('http://www.w3.org/1999/xlink', 'href'))
    ).toEqual(['#flowchart-B-1']);

    const nodeB = svgNode.querySelector('#flowchart-B-1');
    expect(nodeB, 'Missing second node').toBeTruthy();
    const inboundList = nodeB!.querySelector('[role=list]');
    expect(inboundList?.getAttribute('aria-label')).toBe('Inbound edges');
    const inboundListItems = [...inboundList!.querySelectorAll('[role=listitem] a')];
    expect(inboundListItems.map((item) => item.getAttribute('aria-label'))).toEqual(['First node']);
    expect(
      inboundListItems.map((item) => item.getAttributeNS('http://www.w3.org/1999/xlink', 'href'))
    ).toEqual(['#flowchart-A-0']);
  });
});

async function drawDiagram(diagramText: string): Promise<Element> {
  select('#svg').append('g'); // This renderer assumes there's a <g> inside the <svg>.
  const diagram = await Diagram.fromText(diagramText);
  await draw('NOT_USED', 'svg', '1.0.0', diagram);
  return ensureNodeFromSelector('#svg');
}
