import flowDb from '../flowDb.js';
import { cleanupComments } from '../../../diagram-api/comments.js';
import setupGraph from './setup-graph.js';
import { select } from 'd3';
import { swimlaneLayout, assignRanks, getSubgraphLookupTable } from './swimlane-layout.js';
import { getDiagramFromText } from '../../../Diagram.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.ts';
import jsdom from 'jsdom';

const { JSDOM } = jsdom;

addDiagrams();
describe('When doing a assigning ranks specific for swim lanes ', () => {
  let root;
  let doc;
  beforeEach(function () {
    const dom = new JSDOM(`<!DOCTYPE html><body><pre id="swimmer">My First JSDOM!</pre></body>`);
    root = select(dom.window.document.getElementById('swimmer'));
    root.html = () => {
      ' return <div>hello</div>';
    };

    doc = dom.window.document;
  });
  describe('Layout: ', () => {
    // it('should rank the nodes:', async () => {
    //   const diagram = await getDiagramFromText(`swimlane LR
    // subgraph "\`one\`"
    //   start --> cat --> rat
    //   end`);
    //   const g = setupGraph(diagram, 'swimmer', root, doc);
    //   const subgraphLookupTable = getSubgraphLookupTable(diagram);
    //   const ranks = assignRanks(g, subgraphLookupTable);
    //   expect(ranks.get('start')).toEqual(0);
    //   expect(ranks.get('cat')).toEqual(1);
    //   expect(ranks.get('rat')).toEqual(2);
    // });

    it('should rank the nodes:', async () => {
      const diagram = await getDiagramFromText(`swimlane LR
    subgraph "\`one\`"
      start --> cat --> rat
      end
    subgraph "\`two\`"
      monkey --> dog --> done
      end
    cat --> monkey`);
      const g = setupGraph(diagram, 'swimmer', root, doc);
      const subgraphLookupTable = getSubgraphLookupTable(diagram);
      const ranks = assignRanks(g, subgraphLookupTable);
      expect(ranks.get('start')).toEqual(0);
      expect(ranks.get('cat')).toEqual(1);
      expect(ranks.get('rat')).toEqual(2);
      expect(ranks.get('monkey')).toEqual(1);
      expect(ranks.get('dog')).toEqual(2);
      expect(ranks.get('done')).toEqual(3);
    });
  });
  describe('Layout: ', () => {
    it('should rank the nodes:', async () => {
      const diagram = await getDiagramFromText(`swimlane LR
    subgraph "\`one\`"
      start --> cat --> rat
      end`);
      const g = setupGraph(diagram, 'swimmer', root, doc);
      const subgraphLookupTable = getSubgraphLookupTable(diagram);
      const { graph, lanes } = swimlaneLayout(g, diagram);
      expect(lanes.length).toBe(1);
    });

    it('should rank the nodes:', async () => {
      const diagram = await getDiagramFromText(`swimlane LR
    subgraph "\`one\`"
      start --> cat --> rat
      end
    subgraph "\`two\`"
      monkey --> dog --> done
      end
    cat --> monkey`);
      const g = setupGraph(diagram, 'swimmer', root, doc);
      const subgraphLookupTable = getSubgraphLookupTable(diagram);
      const { graph, lanes } = swimlaneLayout(g, diagram);
      expect(lanes.length).toBe(2);
      // Check the coordinates of the start node
      console.log('Nodes:', graph.nodes());
      console.log('Start:', graph.node('start'));
    });
  });
});
