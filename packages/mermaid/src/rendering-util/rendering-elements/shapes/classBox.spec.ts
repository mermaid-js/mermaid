import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as configApi from '../../../config.js';
import { ClassMember } from '../../../diagrams/class/classTypes.js';
import type { ClassNode } from '../../../diagrams/class/classTypes.js';
import type { Node } from '../../types.js';
import { classBox } from './classBox.js';

const numberAttribute = (element: Element, name: string) =>
  Number.parseFloat(element.getAttribute(name) ?? '0');

const box = (x: number, y: number, width: number, height: number) =>
  ({
    x,
    y,
    width,
    height,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  }) as DOMRect;

/** Rough.js emits plain path data for a rectangle, so the drawn extent can be derived from it. */
const pathPoints = (d: string) => {
  const numbers = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const points: [number, number][] = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    points.push([numbers[i], numbers[i + 1]]);
  }
  return points;
};

const translateOf = (element: Element): [number, number] => {
  const transform = element.getAttribute('transform') ?? '';
  const start = transform.indexOf('translate(');
  if (start === -1) {
    return [0, 0];
  }
  const inner = transform.slice(start + 'translate('.length, transform.indexOf(')', start));
  const [x = '0', y = '0'] = inner.split(/[ ,]+/);
  return [Number(x) || 0, Number(y) || 0];
};

const union = (boxes: DOMRect[]) => {
  if (boxes.length === 0) {
    return box(0, 0, 0, 0);
  }
  const left = Math.min(...boxes.map((child) => child.x));
  const top = Math.min(...boxes.map((child) => child.y));
  const right = Math.max(...boxes.map((child) => child.x + child.width));
  const bottom = Math.max(...boxes.map((child) => child.y + child.height));
  return box(left, top, right - left, bottom - top);
};

let originalGetBBox: PropertyDescriptor | undefined;
let originalGetComputedTextLength: PropertyDescriptor | undefined;

beforeAll(() => {
  originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');
  originalGetComputedTextLength = Object.getOwnPropertyDescriptor(
    SVGElement.prototype,
    'getComputedTextLength'
  );

  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value(this: SVGElement) {
      const tag = this.tagName.toLowerCase();
      if (tag === 'rect') {
        return box(
          numberAttribute(this, 'x'),
          numberAttribute(this, 'y'),
          numberAttribute(this, 'width'),
          numberAttribute(this, 'height')
        );
      }
      if (tag === 'path') {
        const points = pathPoints(this.getAttribute('d') ?? '');
        if (points.length === 0) {
          return box(0, 0, 0, 0);
        }
        return union(points.map(([x, y]) => box(x, y, 0, 0)));
      }
      if (tag === 'text' || tag === 'tspan') {
        return box(0, 0, (this.textContent?.length ?? 0) * 7, 16);
      }
      // Groups report the union of their children after applying the children's own transforms.
      const childBoxes = [...this.children]
        .filter((child): child is SVGGraphicsElement => child instanceof SVGElement)
        .map((child) => {
          const childBox = child.getBBox();
          const [dx, dy] = translateOf(child);
          return box(childBox.x + dx, childBox.y + dy, childBox.width, childBox.height);
        });
      return union(childBoxes);
    },
  });

  Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
    configurable: true,
    value(this: SVGElement) {
      return (this.textContent?.length ?? 0) * 7;
    },
  });
});

afterAll(() => {
  const restore = (name: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Object.defineProperty(SVGElement.prototype, name, descriptor);
    } else {
      Reflect.deleteProperty(SVGElement.prototype, name);
    }
  };
  restore('getBBox', originalGetBBox);
  restore('getComputedTextLength', originalGetComputedTextLength);
});

const svg = () => select(document.querySelector<SVGSVGElement>('svg')!);

type TestClassNode = ClassNode & Node & { width?: number; height?: number };

const classNode = ({
  members = [],
  methods = [],
  annotations = [],
}: {
  members?: string[];
  methods?: string[];
  annotations?: string[];
}): TestClassNode =>
  ({
    id: 'Class1',
    domId: 'classId-Class1',
    label: 'Class1',
    text: 'Class1',
    type: 'class',
    shape: 'classBox',
    cssClasses: 'default',
    look: 'classic',
    x: 0,
    y: 0,
    styles: [],
    members: members.map((member) => new ClassMember(member, 'attribute')),
    methods: methods.map((method) => new ClassMember(method, 'method')),
    annotations,
  }) as unknown as TestClassNode;

const draw = async (node: TestClassNode) => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  await classBox(svg(), node);
  return node;
};

const dividerCount = () => document.querySelectorAll('.divider').length;

const dividerYs = () =>
  [...document.querySelectorAll('.divider')].map((divider) => {
    const [dx, dy] = translateOf(divider.querySelector('path') ?? divider);
    return dy;
  });

const absoluteBounds = (selector: string) => {
  const element = document.querySelector<SVGGraphicsElement>(selector)!;
  const local = element.getBBox();
  const [dx, dy] = translateOf(element);
  return box(local.x + dx, local.y + dy, local.width, local.height);
};

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  configApi.reset();
  configApi.setConfig({
    htmlLabels: false,
    flowchart: { htmlLabels: false },
    theme: 'redux-color',
  });
});

describe('classDiagram hideEmptyMembersBox', () => {
  it('draws a single divider for a class with only attributes', async () => {
    configApi.setConfig({ class: { hideEmptyMembersBox: true } });
    await draw(classNode({ members: ['+ a'] }));

    expect(dividerCount()).toBe(1);
  });

  it('draws a single divider for a class with only methods', async () => {
    configApi.setConfig({ class: { hideEmptyMembersBox: true } });
    await draw(classNode({ methods: ['+ foo()'] }));

    expect(dividerCount()).toBe(1);
  });

  it('draws both dividers for a class with attributes and methods', async () => {
    configApi.setConfig({ class: { hideEmptyMembersBox: true } });
    await draw(classNode({ members: ['+ a'], methods: ['+ foo()'] }));

    expect(dividerCount()).toBe(2);
  });

  it('draws no divider for a class with neither attributes nor methods', async () => {
    configApi.setConfig({ class: { hideEmptyMembersBox: true } });
    await draw(classNode({}));

    expect(dividerCount()).toBe(0);
  });

  it('keeps the empty methods row when hideEmptyMembersBox is disabled', async () => {
    configApi.setConfig({ class: { hideEmptyMembersBox: false } });
    const node = await draw(classNode({ members: ['+ a'] }));

    expect(dividerCount()).toBe(2);
    expect(node.height ?? 0).toBeGreaterThan(0);
  });

  it('makes a class with only attributes shorter when the empty methods row is hidden', async () => {
    configApi.setConfig({ class: { hideEmptyMembersBox: true } });
    const hidden = await draw(classNode({ members: ['+ a'] }));
    const hiddenHeight = hidden.height ?? 0;

    configApi.setConfig({ class: { hideEmptyMembersBox: false } });
    const shown = await draw(classNode({ members: ['+ a'] }));

    expect(shown.height ?? 0).toBeGreaterThan(hiddenHeight);
  });

  it('makes a class with only methods shorter when the empty attributes row is hidden', async () => {
    configApi.setConfig({ class: { hideEmptyMembersBox: true } });
    const hidden = await draw(classNode({ methods: ['+ foo()'] }));
    const hiddenHeight = hidden.height ?? 0;

    configApi.setConfig({ class: { hideEmptyMembersBox: false } });
    const shown = await draw(classNode({ methods: ['+ foo()'] }));

    expect(shown.height ?? 0).toBeGreaterThan(hiddenHeight);
  });

  it('keeps the attributes row inside the box when the empty methods row is hidden', async () => {
    configApi.setConfig({ class: { hideEmptyMembersBox: true } });
    await draw(classNode({ members: ['+ a'] }));

    const members = absoluteBounds('g.members-group');
    const rect = absoluteBounds('.outer-path');

    expect(members.y + members.height).toBeLessThanOrEqual(rect.y + rect.height);
  });

  it('keeps the methods row inside the box when the empty attributes row is hidden', async () => {
    configApi.setConfig({ class: { hideEmptyMembersBox: true } });
    await draw(classNode({ methods: ['+ foo()'] }));

    const methods = absoluteBounds('g.methods-group');
    const rect = absoluteBounds('.outer-path');

    expect(methods.y + methods.height).toBeLessThanOrEqual(rect.y + rect.height);
  });
});
