import { FlowDB } from '../../../diagrams/flowchart/flowDb.js';
import flow from '../../../diagrams/flowchart/parser/flowParser.js';
import type { D3Selection } from '../../../types.ts';
import { createGraphWithElements } from '../../createGraph.js';
import type { Node } from '../../types.ts';
import { assignInitialPositions } from './assignInitialPositions.js';
import { layerAssignment } from './layerAssignment.js';
import { assignNodeOrder } from './nodeOrdering.js';
import * as d3 from 'd3';

describe('assignInitialPositioning', () => {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
  });

  it('should correctly assign initial positioning to node', async () => {
    const flowchart = `
          flowchart LR
            A --> B --> C
        `;

    // Get layout data from flowDb
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();

    const svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> = d3.select('svg');
    const element = svg.select('g') as unknown as D3Selection<SVGElement>;
    const graph = createGraphWithElements(element, layoutData);

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(50, layoutData);

    const firstNode = layoutData.nodes.find((node: Node) => node.id === 'A');
    const secondNode = layoutData.nodes.find((node: Node) => node.id === 'B');
    const thirdNode = layoutData.nodes.find((node: Node) => node.id === 'C');
    // Call Initial Position Assignment for the graph
    assignInitialPositions(100, 130, layoutData);

    const node1 = layoutData.nodes.find((node: Node) => node.id === 'A');
    const node2 = layoutData.nodes.find((node: Node) => node.id === 'B');
    const node3 = layoutData.nodes.find((node: Node) => node.id === 'C');
    expect(node1.x).toEqual(firstNode.order * 100);
    expect(node1.y).toEqual(firstNode.layer * 130);
    expect(node2.x).toEqual(secondNode.order * 100);
    expect(node2.y).toEqual(secondNode.layer * 130);
    expect(node3.x).toEqual(thirdNode.order * 100);
    expect(node3.y).toEqual(thirdNode.layer * 130);
  });
  it('should correctly assign initial positioning to nodes in subgraphs', async () => {
    const flowchart = `
          flowchart LR
            subgraph two
              b1
            end
            subgraph three
              c2
            end
            three --> two
            two --> c2
        `;

    // Get layout data from flowDb
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();

    const svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> = d3.select('svg');
    const element = svg.select('g') as unknown as D3Selection<SVGElement>;
    const graph = createGraphWithElements(element, layoutData);

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(50, layoutData);

    const twoNode = layoutData.nodes.find((node: Node) => node.id === 'two');
    const b1Node = layoutData.nodes.find((node: Node) => node.id === 'b1');
    const threeNode = layoutData.nodes.find((node: Node) => node.id === 'three');
    const c2Node = layoutData.nodes.find((node: Node) => node.id === 'c2');

    // Call Initial Position Assignment for the graph
    assignInitialPositions(100, 130, layoutData);

    expect(twoNode.x).toEqual(twoNode.order * 100);
    expect(twoNode.y).toEqual(twoNode.layer * 130);
    expect(b1Node.x).toEqual(b1Node.order * 100);
    expect(b1Node.y).toEqual(b1Node.layer * 130);
    expect(threeNode.x).toEqual(threeNode.order * 100);
    expect(threeNode.y).toEqual(threeNode.layer * 130);
    expect(c2Node.x).toEqual(c2Node.order * 100);
    expect(c2Node.y).toEqual(c2Node.layer * 130);
  });

  it('should correctly assign initial positioning to nodes in complex subgraph', async () => {
    const flowchart = `
          flowchart LR
            subgraph one
              a1[Iam a node with a super long label] -- I am a long label --> a2[I am another node with a mega long label]
              a1 -- Another long label --> a2
              a3 --> a1 & a2 & a3 & a4
              a1 --> a4
            end
        `;

    // Get layout data from flowDb
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();

    const svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> = d3.select('svg');
    const element = svg.select('g') as unknown as D3Selection<SVGElement>;
    const graph = createGraphWithElements(element, layoutData);

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(50, layoutData);

    const oneNode = layoutData.nodes.find((node: Node) => node.id === 'one');
    const a1Node = layoutData.nodes.find((node: Node) => node.id === 'a1');
    const a2Node = layoutData.nodes.find((node: Node) => node.id === 'a2');
    const a3Node = layoutData.nodes.find((node: Node) => node.id === 'a3');
    const a4Node = layoutData.nodes.find((node: Node) => node.id === 'a4');

    // Call Initial Position Assignment for the graph
    assignInitialPositions(100, 130, layoutData);

    expect(oneNode.x).toEqual(oneNode.order * 100);
    expect(oneNode.y).toEqual(oneNode.layer * 130);
    expect(a1Node.x).toEqual(a1Node.order * 100);
    expect(a1Node.y).toEqual(a1Node.layer * 130);
    expect(a2Node.x).toEqual(a2Node.order * 100);
    expect(a2Node.y).toEqual(a2Node.layer * 130);
    expect(a3Node.x).toEqual(a3Node.order * 100);
    expect(a3Node.y).toEqual(a3Node.layer * 130);
    expect(a4Node.x).toEqual(a4Node.order * 100);
    expect(a4Node.y).toEqual(a4Node.layer * 130);
  });

  it('should correctly assign initial positioning to nodes in TD subgraphs', async () => {
    const flowchart = `
          flowchart TD
        P1
        P1 -->P1.5
        subgraph P1.5
          P2
          P2.5(( A ))
          P3
        end
        P2 --> P4
        P3 --> P6
        P1.5 --> P5
        `;

    // Get layout data from flowDb
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();

    const svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> = d3.select('svg');
    const element = svg.select('g') as unknown as D3Selection<SVGElement>;
    const graph = createGraphWithElements(element, layoutData);

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(50, layoutData);

    const p1Node = layoutData.nodes.find((node: Node) => node.id === 'P1');
    const p15Node = layoutData.nodes.find((node: Node) => node.id === 'P1.5');
    const p2Node = layoutData.nodes.find((node: Node) => node.id === 'P2');
    const p25Node = layoutData.nodes.find((node: Node) => node.id === 'P2.5');
    const p3Node = layoutData.nodes.find((node: Node) => node.id === 'P3');
    const p4Node = layoutData.nodes.find((node: Node) => node.id === 'P4');
    const p5Node = layoutData.nodes.find((node: Node) => node.id === 'P5');
    const p6Node = layoutData.nodes.find((node: Node) => node.id === 'P6');

    // Call Initial Position Assignment for the graph
    assignInitialPositions(100, 130, layoutData);

    expect(p1Node.x).toEqual(p1Node.order * 100);
    expect(p1Node.y).toEqual(p1Node.layer * 130);
    expect(p15Node.x).toEqual(p15Node.order * 100);
    expect(p15Node.y).toEqual(p15Node.layer * 130);
    expect(p2Node.x).toEqual(p2Node.order * 100);
    expect(p2Node.y).toEqual(p2Node.layer * 130);
    expect(p25Node.x).toEqual(p25Node.order * 100);
    expect(p25Node.y).toEqual(p25Node.layer * 130);
    expect(p3Node.x).toEqual(p3Node.order * 100);
    expect(p3Node.y).toEqual(p3Node.layer * 130);
    expect(p4Node.x).toEqual(p4Node.order * 100);
    expect(p4Node.y).toEqual(p4Node.layer * 130);
    expect(p5Node.x).toEqual(p5Node.order * 100);
    expect(p5Node.y).toEqual(p5Node.layer * 130);
    expect(p6Node.x).toEqual(p6Node.order * 100);
    expect(p6Node.y).toEqual(p6Node.layer * 130);
  });
  it('should correctly assign initial positioning to nodes in TD subgraphs', async () => {
    const flowchart = `
        flowchart
        subgraph Z
        subgraph X
        a --> b
        end
        subgraph Y
        c --> d
        end
        end
        Y --> X
        X --> P
        P --> Y
        `;

    // Get layout data from flowDb
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();

    const svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> = d3.select('svg');
    const element = svg.select('g') as unknown as D3Selection<SVGElement>;
    const graph = createGraphWithElements(element, layoutData);

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(50, layoutData);

    const zNode = layoutData.nodes.find((node: Node) => node.id === 'Z');
    const yNode = layoutData.nodes.find((node: Node) => node.id === 'Y');
    const xNode = layoutData.nodes.find((node: Node) => node.id === 'X');
    const aNode = layoutData.nodes.find((node: Node) => node.id === 'a');
    const bNode = layoutData.nodes.find((node: Node) => node.id === 'b');
    const cNode = layoutData.nodes.find((node: Node) => node.id === 'c');
    const dNode = layoutData.nodes.find((node: Node) => node.id === 'd');
    const pNode = layoutData.nodes.find((node: Node) => node.id === 'P');

    // Call Initial Position Assignment for the graph
    assignInitialPositions(100, 130, layoutData);

    expect(zNode.x).toEqual(zNode.order * 100);
    expect(zNode.y).toEqual(zNode.layer * 130);
    expect(yNode.x).toEqual(yNode.order * 100);
    expect(yNode.y).toEqual(yNode.layer * 130);
    expect(xNode.x).toEqual(xNode.order * 100);
    expect(xNode.y).toEqual(xNode.layer * 130);
    expect(aNode.x).toEqual(aNode.order * 100);
    expect(aNode.y).toEqual(aNode.layer * 130);
    expect(bNode.x).toEqual(bNode.order * 100);
    expect(bNode.y).toEqual(bNode.layer * 130);
    expect(cNode.x).toEqual(cNode.order * 100);
    expect(cNode.y).toEqual(cNode.layer * 130);
    expect(dNode.x).toEqual(dNode.order * 100);
    expect(dNode.y).toEqual(dNode.layer * 130);
    expect(pNode.x).toEqual(pNode.order * 100);
    expect(pNode.y).toEqual(pNode.layer * 130);
  });
});
