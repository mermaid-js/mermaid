import { JSDOM } from 'jsdom';
import { describe, expect } from 'vitest';
import { mermaidAPI } from '@mermaid-js/core/mermaidAPI.js';
import { ensureNodeFromSelector, jsdomIt } from '@mermaid-js/core/tests/util.js';
import './mermaid.js';

// Diagram types whose parsers support accTitle/accDescr. Note that old flowchart 'graph' type will invoke the flowRenderer-v2. (See the flowchart v2 detector.)
// We have to have both the specific textDiagramType and the expected type name because the expected type may be slightly different from what is put in the diagram text (ex: in -v2 diagrams)
const diagramTypesAndExpectations = [
  // { textDiagramType: 'C4Context', expectedType: 'c4' }, TODO : setAccTitle not called in C4 jison parser
  { textDiagramType: 'classDiagram', expectedType: 'classDiagram' },
  { textDiagramType: 'classDiagram-v2', expectedType: 'classDiagram' },
  { textDiagramType: 'erDiagram', expectedType: 'er' },
  { textDiagramType: 'graph', expectedType: 'flowchart-v2' },
  { textDiagramType: 'flowchart', expectedType: 'flowchart-v2' },
  { textDiagramType: 'gitGraph', expectedType: 'gitGraph' },
  { textDiagramType: 'gantt', expectedType: 'gantt' },
  { textDiagramType: 'journey', expectedType: 'journey' },
  { textDiagramType: 'pie', expectedType: 'pie' },
  { textDiagramType: 'packet', expectedType: 'packet' },
  { textDiagramType: 'packet-beta', expectedType: 'packet' },
  {
    textDiagramType: 'xychart-beta',
    expectedType: 'xychart',
    content: 'x-axis "Attempts" 10000 --> 10000\ny-axis "Passing tests" 1 --> 1\nbar [1]',
  },
  {
    textDiagramType: 'xychart',
    expectedType: 'xychart',
    content: 'x-axis "Attempts" 10000 --> 10000\ny-axis "Passing tests" 1 --> 1\nbar [1]',
  },
  { textDiagramType: 'requirementDiagram', expectedType: 'requirement' },
  { textDiagramType: 'sequenceDiagram', expectedType: 'sequence' },
  { textDiagramType: 'stateDiagram-v2', expectedType: 'stateDiagram' },
  { textDiagramType: 'treeView-beta', expectedType: 'treeView' },
  { textDiagramType: 'radar-beta', expectedType: 'radar' },
  { textDiagramType: 'architecture-beta', expectedType: 'architecture' },
];

describe('accessibility', () => {
  const id = 'mermaid-fauxId';
  const a11yTitle = 'a11y title';
  const a11yDescr = 'a11y description';

  diagramTypesAndExpectations.forEach((testedDiagram) => {
    describe(`${testedDiagram.textDiagramType}`, () => {
      const diagramType = testedDiagram.textDiagramType;
      const content = testedDiagram.content || '';
      const diagramText = `${diagramType}\n accTitle: ${a11yTitle}\n accDescr: ${a11yDescr}\n${content}`;
      const expectedDiagramType = testedDiagram.expectedType;

      jsdomIt(
        'should set aria-roledescription to the diagram type AND should call addSVGa11yTitleDescription',
        async () => {
          const { svg } = await mermaidAPI.render(id, diagramText);
          const dom = new JSDOM(svg);
          const svgNode = ensureNodeFromSelector('svg', dom.window.document);
          const descNode = ensureNodeFromSelector('desc', svgNode);
          const titleNode = ensureNodeFromSelector('title', svgNode);
          expect(svgNode.getAttribute('aria-roledescription')).toBe(expectedDiagramType);
          expect(svgNode.getAttribute('aria-describedby')).toBe(`chart-desc-${id}`);
          expect(descNode.getAttribute('id')).toBe(`chart-desc-${id}`);
          expect(descNode.innerHTML).toBe(a11yDescr);
          expect(titleNode.innerHTML).toBe(a11yTitle);
        }
      );
    });
  });
});
