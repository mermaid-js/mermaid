import { addVertices, addEdges } from './flowRenderer.js';
import { setConfig } from '../../config.js';

setConfig({
  flowchart: {
    htmlLabels: false,
  },
});

describe('the flowchart renderer', function () {
  describe('when adding vertices to a graph', function () {
    [
      ['round', 'rect', 5],
      ['square', 'rect'],
      ['diamond', 'question'],
      ['hexagon', 'hexagon'],
      ['odd', 'rect_left_inv_arrow'],
      ['lean_right', 'lean_right'],
      ['lean_left', 'lean_left'],
      ['trapezoid', 'trapezoid'],
      ['inv_trapezoid', 'inv_trapezoid'],
      ['odd_right', 'rect_left_inv_arrow'],
      ['circle', 'circle'],
      ['ellipse', 'ellipse'],
      ['stadium', 'stadium'],
      ['subroutine', 'subroutine'],
      ['cylinder', 'cylinder'],
      ['group', 'rect'],
    ].forEach(function ([type, expectedShape, expectedRadios = 0]) {
      it(`should add the correct shaped node to the graph for vertex type ${type}`, function () {
        const fakeDiag = {
          db: {
            lookUpDomId: () => {
              return 'my-node-id';
            },
          },
        };
        const addedNodes = [];
        const mockG = {
          setNode: function (id, object) {
            addedNodes.push([id, object]);
          },
        };
        addVertices(
          {
            v1: {
              type,
              id: 'my-node-id',
              classes: [],
              styles: [],
              text: 'my vertex text',
            },
          },
          mockG,
          'svg-id',
          undefined,
          undefined,
          fakeDiag
        );
        expect(addedNodes).toHaveLength(1);
        expect(addedNodes[0][0]).toEqual('my-node-id');
        expect(addedNodes[0][1]).toHaveProperty('id', 'my-node-id');
        expect(addedNodes[0][1]).toHaveProperty('labelType', 'svg');
        expect(addedNodes[0][1]).toHaveProperty('shape', expectedShape);
        expect(addedNodes[0][1]).toHaveProperty('rx', expectedRadios);
        expect(addedNodes[0][1]).toHaveProperty('ry', expectedRadios);
      });
    });

    ['Multi<br>Line', 'Multi<br/>Line', 'Multi<br />Line', 'Multi<br\t/>Line'].forEach(function (
      labelText
    ) {
      it('should handle multiline texts with different line breaks', function () {
        const addedNodes = [];
        const fakeDiag = {
          db: {
            lookUpDomId: () => {
              return 'my-node-id';
            },
          },
        };
        const mockG = {
          setNode: function (id, object) {
            addedNodes.push([id, object]);
          },
        };
        addVertices(
          {
            v1: {
              type: 'rect',
              id: 'my-node-id',
              classes: [],
              styles: [],
              text: 'Multi<br>Line',
            },
          },
          mockG,
          'svg-id',
          false,
          document,
          fakeDiag
        );
        expect(addedNodes).toHaveLength(1);
        expect(addedNodes[0][0]).toEqual('my-node-id');
        expect(addedNodes[0][1]).toHaveProperty('id', 'my-node-id');
        expect(addedNodes[0][1]).toHaveProperty('labelType', 'svg');
        expect(addedNodes[0][1].label).toBeDefined();
        expect(addedNodes[0][1].label).toBeDefined(); // <text> node
        expect(addedNodes[0][1].label.firstChild.innerHTML).toEqual('Multi'); // <tspan> node, line 1
        expect(addedNodes[0][1].label.lastChild.innerHTML).toEqual('Line'); // <tspan> node, line 2
      });
    });

    [
      [['fill:#fff'], 'fill:#fff;', ''],
      [['color:#ccc'], '', 'color:#ccc;'],
      [['fill:#fff', 'color:#ccc'], 'fill:#fff;', 'color:#ccc;'],
      [
        ['fill:#fff', 'color:#ccc', 'text-align:center'],
        'fill:#fff;',
        'color:#ccc;text-align:center;',
      ],
    ].forEach(function ([style, expectedStyle, expectedLabelStyle]) {
      it(`should add the styles to style and/or labelStyle for style ${style}`, function () {
        const addedNodes = [];
        const fakeDiag = {
          db: {
            lookUpDomId: () => {
              return 'my-node-id';
            },
          },
        };
        const mockG = {
          setNode: function (id, object) {
            addedNodes.push([id, object]);
          },
        };
        addVertices(
          {
            v1: {
              type: 'rect',
              id: 'my-node-id',
              classes: [],
              styles: style,
              text: 'my vertex text',
            },
          },
          mockG,
          'svg-id',
          undefined,
          undefined,
          fakeDiag
        );
        expect(addedNodes).toHaveLength(1);
        expect(addedNodes[0][0]).toEqual('my-node-id');
        expect(addedNodes[0][1]).toHaveProperty('id', 'my-node-id');
        expect(addedNodes[0][1]).toHaveProperty('labelType', 'svg');
        expect(addedNodes[0][1]).toHaveProperty('style', expectedStyle);
        expect(addedNodes[0][1]).toHaveProperty('labelStyle', expectedLabelStyle);
      });
    });

    it(`should add default class to all nodes which do not have another class assigned`, function () {
      const addedNodes = [];
      const mockG = {
        setNode: function (id, object) {
          addedNodes.push([id, object]);
        },
      };
      const fakeDiag = {
        db: {
          lookUpDomId: () => {
            return 'my-node-id';
          },
        },
      };
      addVertices(
        {
          v1: {
            type: 'rect',
            id: 'my-node-id',
            classes: [],
            styles: [],
            text: 'my vertex text',
          },
          v2: {
            type: 'rect',
            id: 'myNode',
            classes: ['myClass'],
            styles: [],
            text: 'my vertex text',
          },
        },
        mockG,
        'svg-id',
        undefined,
        undefined,
        fakeDiag
      );
      expect(addedNodes).toHaveLength(2);
      expect(addedNodes[0][0]).toEqual('my-node-id');
      expect(addedNodes[0][1]).toHaveProperty('class', 'default');
      expect(addedNodes[1][0]).toEqual('my-node-id');
      expect(addedNodes[1][1]).toHaveProperty('class', 'myClass');
    });
  });

  describe('when adding edges to a graph', function () {
    it('should handle multiline texts and set centered label position', function () {
      const addedEdges = [];
      const fakeDiag = {
        db: {
          lookUpDomId: () => {
            return 'my-node-id';
          },
        },
      };
      const mockG = {
        setEdge: function (s, e, data, c) {
          addedEdges.push(data);
        },
      };
      addEdges(
        [
          { text: 'Multi<br>Line' },
          { text: 'Multi<br/>Line' },
          { text: 'Multi<br />Line' },
          { text: 'Multi<br\t/>Line' },
          { style: ['stroke:DarkGray', 'stroke-width:2px'], text: 'Multi<br>Line' },
          { style: ['stroke:DarkGray', 'stroke-width:2px'], text: 'Multi<br/>Line' },
          { style: ['stroke:DarkGray', 'stroke-width:2px'], text: 'Multi<br />Line' },
          { style: ['stroke:DarkGray', 'stroke-width:2px'], text: 'Multi<br\t/>Line' },
        ],
        mockG,
        fakeDiag
      );

      addedEdges.forEach(function (edge) {
        expect(edge).toHaveProperty('label', 'Multi\nLine');
        expect(edge).toHaveProperty('labelpos', 'c');
      });
    });

    [
      [['stroke:DarkGray'], 'stroke:DarkGray;', ''],
      [['color:red'], '', 'fill:red;'],
      [['stroke:DarkGray', 'color:red'], 'stroke:DarkGray;', 'fill:red;'],
      [
        ['stroke:DarkGray', 'color:red', 'stroke-width:2px'],
        'stroke:DarkGray;stroke-width:2px;',
        'fill:red;',
      ],
    ].forEach(function ([style, expectedStyle, expectedLabelStyle]) {
      it(`should add the styles to style and/or labelStyle for style ${style}`, function () {
        const addedEdges = [];
        const fakeDiag = {
          db: {
            lookUpDomId: () => {
              return 'my-node-id';
            },
          },
        };
        const mockG = {
          setEdge: function (s, e, data, c) {
            addedEdges.push(data);
          },
        };
        addEdges([{ style: style, text: 'styling' }], mockG, fakeDiag);

        expect(addedEdges).toHaveLength(1);
        expect(addedEdges[0]).toHaveProperty('style', expectedStyle);
        expect(addedEdges[0]).toHaveProperty('labelStyle', expectedLabelStyle);
      });
    });
  });
});
