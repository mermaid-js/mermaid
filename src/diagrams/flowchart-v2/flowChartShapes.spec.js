import { addToRender } from './flowChartShapes';

describe('flowchart shapes', function() {
  // rect-based shapes
  [
    ['stadium', useWidth, useHeight]
  ].forEach(function([shapeType, getW, getH]) {
    it(`should add a ${shapeType} shape that renders a properly positioned rect element`, function() {
      const mockRender = MockRender();
      const mockSvg = MockSvg();
      addToRender(mockRender);

      [[100, 100], [123, 45], [71, 300]].forEach(function([width, height]) {
        const shape = mockRender.shapes()[shapeType](mockSvg, { width, height }, {});
        const w = width + height / 4;
        const h = height;
        const dx = -getW(w, h) / 2;
        const dy = -getH(w, h) / 2;
        expect(shape.__tag).toEqual('rect');
        expect(shape.__attrs).toHaveProperty('x', dx);
        expect(shape.__attrs).toHaveProperty('y', dy);
      });
    });
  });

  // path-based shapes
  [
    ['cylinder', useWidth, useHeight]
  ].forEach(function([shapeType, getW, getH]) {
    it(`should add a ${shapeType} shape that renders a properly positioned path element`, function() {
      const mockRender = MockRender();
      const mockSvg = MockSvg();
      addToRender(mockRender);

      [[100, 100], [123, 45], [71, 300]].forEach(function([width, height]) {
        const shape = mockRender.shapes()[shapeType](mockSvg, { width, height }, {});
        expect(shape.__tag).toEqual('path');
        expect(shape.__attrs).toHaveProperty('d');
      });
    });
  });

  // polygon-based shapes
  [
    [
      'question',
      4,
      function(w, h) {
        return (w + h) * 0.9;
      },
      function(w, h) {
        return (w + h) * 0.9;
      }
    ],
    [
      'hexagon',
      6,
      function(w, h) {
        return w + h / 2;
      },
      useHeight
    ],
    ['rect_left_inv_arrow', 5, useWidth, useHeight],
    ['rect_right_inv_arrow', 5, useWidth, useHeight],
    ['lean_right', 4, useWidth, useHeight],
    ['lean_left', 4, useWidth, useHeight],
    ['trapezoid', 4, useWidth, useHeight],
    ['inv_trapezoid', 4, useWidth, useHeight]
  ].forEach(function([shapeType, expectedPointCount, getW, getH]) {
    it(`should add a ${shapeType} shape that renders a properly translated polygon element`, function() {
      const mockRender = MockRender();
      const mockSvg = MockSvg();
      addToRender(mockRender);

      [[100, 100], [123, 45], [71, 300]].forEach(function([width, height]) {
        const shape = mockRender.shapes()[shapeType](mockSvg, { width, height }, {});
        const dx = -getW(width, height) / 2;
        const dy = getH(width, height) / 2;
        const points = shape.__attrs.points.split(' ');
        expect(shape.__tag).toEqual('polygon');
        expect(shape.__attrs).toHaveProperty('transform', `translate(${dx},${dy})`);
        expect(points).toHaveLength(expectedPointCount);
      });
    });
  });
});

function MockRender() {
  const shapes = {};
  return {
    shapes() {
      return shapes;
    }
  };
}

function MockSvg(tag, ...args) {
  const children = [];
  const attributes = {};
  return {
    get __args() {
      return args;
    },
    get __tag() {
      return tag;
    },
    get __children() {
      return children;
    },
    get __attrs() {
      return attributes;
    },
    insert: function(tag, ...args) {
      const child = MockSvg(tag, ...args);
      children.push(child);
      return child;
    },
    attr(name, value) {
      this.__attrs[name] = value;
      return this;
    }
  };
}

function useWidth(w, h) {
  return w;
}

function useHeight(w, h) {
  return h;
}
