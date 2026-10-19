// @ts-expect-error No types available for JISON
import { parser as ishikawa } from './parser/ishikawa.jison';
import { IshikawaDB } from './ishikawaDb.js';
import { renderer } from './ishikawaRenderer.js';
import type { Diagram } from '../../Diagram.js';
import { setLogLevel } from '../../diagram-api/diagramAPI.js';
import { reset } from '../../config.js';

const diagramId = 'ishikawa-test';

const stubSvgTextMeasurement = (): void => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: function (this: SVGElement) {
      const text = this.textContent ?? '';
      const width = Math.max(text.length * 8, 1);
      const height = 16;
      const x = Number(this.getAttribute('x') ?? 0);
      const y = Number(this.getAttribute('y') ?? 0);

      return {
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
      };
    },
  });
};

describe('when parsing an Ishikawa diagram', function () {
  beforeEach(function () {
    reset();
    ishikawa.yy = new IshikawaDB();
    ishikawa.yy.clear();
    document.body.innerHTML = `<svg id="${diagramId}"></svg>`;
    stubSvgTextMeasurement();
    setLogLevel('trace');
  });

  it('should parse a basic Ishikawa hierarchy', function () {
    const str = `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
`;

    ishikawa.parse(str);
    const root = ishikawa.yy.getRoot();
    expect(root?.text).toEqual('Blurry Photo');
    expect(root?.children.length).toEqual(2);
    expect(root?.children[0].text).toEqual('Process');
    expect(root?.children[0].children[0].text).toEqual('Out of focus');
    expect(root?.children[1].text).toEqual('User');
    expect(root?.children[1].children[0].text).toEqual('Shaky hands');
  });

  it('should support an unindented root with nested causes', function () {
    const str = `ishikawa-beta
Problem
Cause A
  Subcause A1
Cause B
`;

    ishikawa.parse(str);
    const root = ishikawa.yy.getRoot();
    expect(root?.text).toEqual('Problem');
    expect(root?.children.length).toEqual(2);
    expect(root?.children[0].text).toEqual('Cause A');
    expect(root?.children[0].children[0].text).toEqual('Subcause A1');
    expect(root?.children[1].text).toEqual('Cause B');
  });

  it('should handle effect indented more than causes', function () {
    const str = `ishikawa-beta
    Problem
Cause A
  Subcause A1
Cause B
`;

    ishikawa.parse(str);
    const root = ishikawa.yy.getRoot();
    expect(root?.text).toEqual('Problem');
    expect(root?.children.length).toEqual(2);
    expect(root?.children[0].text).toEqual('Cause A');
    expect(root?.children[0].children.length).toEqual(1);
    expect(root?.children[0].children[0].text).toEqual('Subcause A1');
    expect(root?.children[1].text).toEqual('Cause B');
  });

  it('should parse an empty gap branch', function () {
    const str = `ishikawa-beta
Problem
Cause A
[]
Cause B
`;

    ishikawa.parse(str);
    const root = ishikawa.yy.getRoot();
    expect(root?.children.length).toEqual(3);
    expect(root?.children[0].text).toEqual('Cause A');
    expect(root?.children[0].isGap).toBe(false);
    expect(root?.children[1].text).toEqual('[]');
    expect(root?.children[1].isGap).toBe(true);
  });

  it('should reserve space for empty gap branches without rendering them', function () {
    const str = `ishikawa-beta
Problem
Cause A
[]
Cause B
`;

    ishikawa.parse(str);
    void renderer.draw(str, diagramId, '1.0.0', { db: ishikawa.yy } as unknown as Diagram);

    const branchLines = [...document.querySelectorAll<SVGLineElement>('line.ishikawa-branch')];
    const labels = [...document.querySelectorAll<SVGTextElement>('text')].map(
      (text) => text.textContent
    );
    const spine = document.querySelector<SVGLineElement>('line.ishikawa-spine');

    expect(branchLines).toHaveLength(2);
    expect(labels).not.toContain('[]');
    expect(Number(spine?.getAttribute('x1'))).toBeLessThan(-80);
  });
});
