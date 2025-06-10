import { FlowDB } from '../../../diagrams/flowchart/flowDb.js';
import flow from '../../../diagrams/flowchart/parser/flowParser.js';
import type { Node } from '../../types.ts';
import { layerAssignment } from './layerAssignment.js';
import { assignNodeOrder } from './nodeOrdering.js';

describe('nodeOrdering', () => {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
  });

  it('should correctly assign the orders to node', async () => {
    const flowchart = `
          flowchart LR
            A --> B --> C
        `;

    // Get layout data from flowDb
    await flow.parse(flowchart);
    const layoutData = flow.parser.yy.getData();

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(1, layoutData);

    expect(layoutData.nodes.find((node: Node) => node.id === 'A').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'B').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'C').order).toEqual(0);
  });
  it('should correctly assign the orders to node', async () => {
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

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(50, layoutData);
    expect(layoutData.nodes.find((node: Node) => node.id === 'two').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'b1').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'three').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'c2').order).toEqual(0);

    // expect(graph.getNodeAttributes('B').layer).toEqual(2);
    // expect(graph.getNodeAttributes('C').layer).toEqual(3);
  });

  it('should correctly assign the orders to node', async () => {
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

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(50, layoutData);
    expect(layoutData.nodes.find((node: Node) => node.id === 'one').order).toEqual(0.75);
    expect(layoutData.nodes.find((node: Node) => node.id === 'a1').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'a2').order).toEqual(1);
    expect(layoutData.nodes.find((node: Node) => node.id === 'a3').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'a4').order).toEqual(2);
  });
  it('should correctly assign the orders to node', async () => {
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

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(50, layoutData);
    expect(layoutData.nodes.find((node: Node) => node.id === 'P1').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'P1.5').order).toEqual(1);
    expect(layoutData.nodes.find((node: Node) => node.id === 'P2').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'P2.5').order).toEqual(2);
    expect(layoutData.nodes.find((node: Node) => node.id === 'P3').order).toEqual(1);
    expect(layoutData.nodes.find((node: Node) => node.id === 'P4').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'P5').order).toEqual(2);
    expect(layoutData.nodes.find((node: Node) => node.id === 'P6').order).toEqual(1);
  });

  it('should correctly assign the orders to node', async () => {
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

    // Call Layer Assignment for the graph
    layerAssignment(layoutData);

    // Call Node order Assignment for the graph
    assignNodeOrder(50, layoutData);
    expect(layoutData.nodes.find((node: Node) => node.id === 'Z').order).toEqual(8);
    expect(layoutData.nodes.find((node: Node) => node.id === 'Y').order).toEqual(0.5);
    expect(layoutData.nodes.find((node: Node) => node.id === 'X').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'a').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'b').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'c').order).toEqual(0);
    expect(layoutData.nodes.find((node: Node) => node.id === 'd').order).toEqual(1);
    expect(layoutData.nodes.find((node: Node) => node.id === 'P').order).toEqual(1);
  });
});
