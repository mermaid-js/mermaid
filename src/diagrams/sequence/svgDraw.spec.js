/* eslint-env jasmine */
const svgDraw = require('./svgDraw');
const { MockD3 } = require('d3');

describe('svgDraw', function() {
  describe('drawRect', function() {
    it('it should append a rectangle', function() {
      const svg = MockD3('svg');
      svgDraw.drawRect(svg, {
        x: 10,
        y: 10,
        fill: '#ccc',
        stroke: 'red',
        width: '20',
        height: '20',
        rx: '10',
        ry: '10',
        class: 'unitTestRectangleClass'
      });
      expect(svg.__children.length).toBe(1);
      const rect = svg.__children[0];
      expect(rect.__name).toBe('rect');
      expect(rect.attr).toHaveBeenCalledWith('x', 10);
      expect(rect.attr).toHaveBeenCalledWith('y', 10);
      expect(rect.attr).toHaveBeenCalledWith('fill', '#ccc');
      expect(rect.attr).toHaveBeenCalledWith('stroke', 'red');
      expect(rect.attr).toHaveBeenCalledWith('width', '20');
      expect(rect.attr).toHaveBeenCalledWith('height', '20');
      expect(rect.attr).toHaveBeenCalledWith('rx', '10');
      expect(rect.attr).toHaveBeenCalledWith('ry', '10');
      expect(rect.attr).toHaveBeenCalledWith('class', 'unitTestRectangleClass');
    });
    it('it should not add the class attribute if a class isn`t provided', () => {
      const svg = MockD3('svg');
      svgDraw.drawRect(svg, {
        x: 10,
        y: 10,
        fill: '#ccc',
        stroke: 'red',
        width: '20',
        height: '20',
        rx: '10',
        ry: '10'
      });
      expect(svg.__children.length).toBe(1);
      const rect = svg.__children[0];
      expect(rect.__name).toBe('rect');
      expect(rect.attr).toHaveBeenCalledWith('fill', '#ccc');
      expect(rect.attr).not.toHaveBeenCalledWith('class', expect.anything());
    });
  });
  describe('drawBackgroundRect', function() {
    it('it should append a rect before the previous element within a given bound', function() {
      const svg = MockD3('svg');
      const boundingRect = {
        startx: 50,
        starty: 200,
        stopx: 150,
        stopy: 260,
        title: undefined,
        fill: '#ccc'
      };
      svgDraw.drawBackgroundRect(svg, boundingRect);
      expect(svg.__children.length).toBe(1);
      const rect = svg.__children[0];
      expect(rect.__name).toBe('rect');
      expect(rect.attr).toHaveBeenCalledWith('x', 50);
      expect(rect.attr).toHaveBeenCalledWith('y', 200);
      expect(rect.attr).toHaveBeenCalledWith('width', 100);
      expect(rect.attr).toHaveBeenCalledWith('height', 60);
      expect(rect.attr).toHaveBeenCalledWith('fill', '#ccc');
      expect(rect.attr).toHaveBeenCalledWith('class', 'rect');
      expect(rect.lower).toHaveBeenCalled();
    });
  });
});
