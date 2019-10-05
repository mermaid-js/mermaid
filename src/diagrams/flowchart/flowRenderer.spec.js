import { addVertices } from './flowRenderer';
import { setConfig } from '../../config';

setConfig({
  securityLevel: 'strict',
  flowchart: {
    htmlLabels: false
  }
});

describe('the flowchart renderer', function() {
  describe('when adding vertices to a graph', function() {
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
      ['group', 'rect']
    ].forEach(function([type, expectedShape, expectedRadios = 0]) {
      it(`should add the correct shaped node to the graph for vertex type ${type}`, function() {
        const addedNodes = [];
        const mockG = {
          setNode: function(id, object) {
            addedNodes.push([id, object]);
          }
        };
        addVertices(
          {
            v1: {
              type,
              id: 'my-node-id',
              classes: [],
              styles: [],
              text: 'my vertex text'
            }
          },
          mockG,
          'svg-id'
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
  });
});
