import { vi } from 'vitest';
import svgDraw from './svgDraw.js';

// This is the only place that uses this mock
export const MockD3 = (name, parent) => {
  const children = [];
  const elem = {
    get __children() {
      return children;
    },
    get __name() {
      return name;
    },
    get __parent() {
      return parent;
    },
  };
  elem.append = (name) => {
    const mockElem = MockD3(name, elem);
    children.push(mockElem);
    return mockElem;
  };
  elem.lower = vi.fn(() => elem);
  elem.attr = vi.fn(() => elem);
  elem.text = vi.fn(() => elem);
  elem.style = vi.fn(() => elem);
  return elem;
};

describe('svgDraw', function () {
  describe('drawRect', function () {
    it('should append a rectangle', function () {
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
        class: 'unitTestRectangleClass',
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
    it('should not add the class attribute if a class is not provided', () => {
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
      });
      expect(svg.__children.length).toBe(1);
      const rect = svg.__children[0];
      expect(rect.__name).toBe('rect');
      expect(rect.attr).toHaveBeenCalledWith('fill', '#ccc');
      expect(rect.attr).not.toHaveBeenCalledWith('class', expect.anything());
    });
  });
  describe('drawText', function () {
    it('should append a single element', function () {
      const svg = MockD3('svg');
      svgDraw.drawText(svg, {
        x: 10,
        y: 10,
        dy: '1em',
        text: 'One fine text message',
        class: 'noteText',
        fontFamily: 'courier',
        fontSize: '10px',
        fontWeight: '500',
      });
      expect(svg.__children.length).toBe(1);
      const text = svg.__children[0];
      expect(text.__name).toBe('text');
      expect(text.attr).toHaveBeenCalledWith('x', 10);
      expect(text.attr).toHaveBeenCalledWith('y', 10);
      expect(text.attr).toHaveBeenCalledWith('dy', '1em');
      expect(text.attr).toHaveBeenCalledWith('class', 'noteText');
      expect(text.text).toHaveBeenCalledWith('One fine text message');
      expect(text.style).toHaveBeenCalledWith('font-family', 'courier');
      expect(text.style).toHaveBeenCalledWith('font-size', '10px');
      expect(text.style).toHaveBeenCalledWith('font-weight', '500');
    });
    it('should append a multiple elements', function () {
      const svg = MockD3('svg');
      svgDraw.drawText(svg, {
        x: 10,
        y: 10,
        text: 'One fine text message<br>with multiple<br>fine lines',
      });
      expect(svg.__children.length).toBe(3);
      const text1 = svg.__children[0];
      expect(text1.__name).toBe('text');
      expect(text1.attr).toHaveBeenCalledWith('x', 10);
      expect(text1.attr).toHaveBeenCalledWith('y', 10);
      expect(text1.text).toHaveBeenCalledWith('One fine text message');

      const text2 = svg.__children[1];
      expect(text2.__name).toBe('text');
      expect(text2.attr).toHaveBeenCalledWith('x', 10);
      expect(text2.attr).toHaveBeenCalledWith('y', 10);
      expect(text2.text).toHaveBeenCalledWith('with multiple');

      const text3 = svg.__children[2];
      expect(text3.__name).toBe('text');
      expect(text3.attr).toHaveBeenCalledWith('x', 10);
      expect(text3.attr).toHaveBeenCalledWith('y', 10);
      expect(text3.text).toHaveBeenCalledWith('fine lines');
    });
    it('should work with numeral font sizes', function () {
      const svg = MockD3('svg');
      svgDraw.drawText(svg, {
        x: 10,
        y: 10,
        dy: '1em',
        text: 'One fine text message',
        class: 'noteText',
        fontFamily: 'courier',
        fontSize: 10,
        fontWeight: '500',
      });
      expect(svg.__children.length).toBe(1);
      const text = svg.__children[0];
      expect(text.__name).toBe('text');
      expect(text.attr).toHaveBeenCalledWith('x', 10);
      expect(text.attr).toHaveBeenCalledWith('y', 10);
      expect(text.attr).toHaveBeenCalledWith('dy', '1em');
      expect(text.attr).toHaveBeenCalledWith('class', 'noteText');
      expect(text.text).toHaveBeenCalledWith('One fine text message');
      expect(text.style).toHaveBeenCalledWith('font-family', 'courier');
      expect(text.style).toHaveBeenCalledWith('font-size', '10px');
      expect(text.style).toHaveBeenCalledWith('font-weight', '500');
    });
  });
  describe('drawBackgroundRect', function () {
    it('should append a rect before the previous element within a given bound', function () {
      const svg = MockD3('svg');
      const boundingRect = {
        startx: 50,
        starty: 200,
        stopx: 150,
        stopy: 260,
        title: undefined,
        fill: '#ccc',
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
