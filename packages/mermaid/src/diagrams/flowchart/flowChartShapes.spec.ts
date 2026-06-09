import { addToRender } from './flowChartShapes.js';
import type { RenderWithShapes } from './flowChartShapes.js';

type SizeFunction = (w: number, h: number) => number;

interface MockSvgElement {
  readonly __args: unknown[];
  readonly __tag: string | undefined;
  readonly __children: MockSvgElement[];
  readonly __attrs: Record<string, unknown>;
  insert: (tag?: string, ...args: unknown[]) => MockSvgElement;
  attr: (name: string, value: unknown) => MockSvgElement;
}

type MockShapeFunction = (
  parent: MockSvgElement,
  bbox: { width: number; height: number },
  node: Record<string, unknown>
) => MockSvgElement;

interface MockedRender {
  shapes: () => Record<string, MockShapeFunction>;
}

describe('flowchart shapes', function () {
  // rect-based shapes
  const rectShapes: [string, SizeFunction, SizeFunction][] = [['stadium', useWidth, useHeight]];
  rectShapes.forEach(function ([shapeType, getW, getH]) {
    it(`should add a ${shapeType} shape that renders a properly positioned rect element`, function () {
      const mockRender = MockRender();
      const mockSvg = MockSvg();
      addToRender(mockRender as unknown as RenderWithShapes);

      [
        [100, 100],
        [123, 45],
        [71, 300],
      ].forEach(function ([width, height]) {
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
  const pathShapes: [string, SizeFunction, SizeFunction][] = [['cylinder', useWidth, useHeight]];
  pathShapes.forEach(function ([shapeType]) {
    it(`should add a ${shapeType} shape that renders a properly positioned path element`, function () {
      const mockRender = MockRender();
      const mockSvg = MockSvg();
      addToRender(mockRender as unknown as RenderWithShapes);

      [
        [100, 100],
        [123, 45],
        [71, 300],
      ].forEach(function ([width, height]) {
        const shape = mockRender.shapes()[shapeType](mockSvg, { width, height }, {});
        expect(shape.__tag).toEqual('path');
        expect(shape.__attrs).toHaveProperty('d');
      });
    });
  });

  // polygon-based shapes
  const polygonShapes: [string, number, SizeFunction, SizeFunction][] = [
    [
      'question',
      4,
      function (w, h) {
        return (w + h) * 0.9;
      },
      function (w, h) {
        return (w + h) * 0.9;
      },
    ],
    [
      'hexagon',
      6,
      function (w, h) {
        return w + h / 2;
      },
      useHeight,
    ],
    ['rect_left_inv_arrow', 5, useWidth, useHeight],
    ['rect_right_inv_arrow', 5, useWidth, useHeight],
    ['lean_right', 4, useWidth, useHeight],
    ['lean_left', 4, useWidth, useHeight],
    ['trapezoid', 4, useWidth, useHeight],
    ['inv_trapezoid', 4, useWidth, useHeight],
    ['subroutine', 10, useWidth, useHeight],
  ];
  polygonShapes.forEach(function ([shapeType, expectedPointCount, getW, getH]) {
    it(`should add a ${shapeType} shape that renders a properly translated polygon element`, function () {
      const mockRender = MockRender();
      const mockSvg = MockSvg();
      addToRender(mockRender as unknown as RenderWithShapes);

      [
        [100, 100],
        [123, 45],
        [71, 300],
      ].forEach(function ([width, height]) {
        const shape = mockRender.shapes()[shapeType](mockSvg, { width, height }, {});
        const dx = -getW(width, height) / 2;
        const dy = getH(width, height) / 2;
        const points = (shape.__attrs.points as string).split(' ');
        expect(shape.__tag).toEqual('polygon');
        expect(shape.__attrs).toHaveProperty('transform', `translate(${dx},${dy})`);
        expect(points).toHaveLength(expectedPointCount);
      });
    });
  });
});

function MockRender(): MockedRender {
  const shapes: Record<string, MockShapeFunction> = {};
  return {
    shapes() {
      return shapes;
    },
  };
}

function MockSvg(tag?: string, ...args: unknown[]): MockSvgElement {
  const children: MockSvgElement[] = [];
  const attributes: Record<string, unknown> = {};
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
    insert: function (tag?: string, ...args: unknown[]) {
      const child = MockSvg(tag, ...args);
      children.push(child);
      return child;
    },
    attr(name: string, value: unknown) {
      this.__attrs[name] = value;
      return this;
    },
  };
}

function useWidth(w: number, _h: number): number {
  return w;
}

function useHeight(_w: number, h: number): number {
  return h;
}
