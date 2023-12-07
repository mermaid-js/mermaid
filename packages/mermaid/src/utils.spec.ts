import { vi } from 'vitest';
import utils, { calculatePoint, cleanAndMerge, detectDirective } from './utils.js';
import assignWithDepth from './assignWithDepth.js';
import { detectType } from './diagram-api/detectType.js';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import memoize from 'lodash-es/memoize.js';
import { MockedD3 } from './tests/MockedD3.js';
import { preprocessDiagram } from './preprocess.js';

addDiagrams();

describe('when assignWithDepth: should merge objects within objects', function () {
  it('should handle simple, depth:1 types (identity)', function () {
    const config_0 = { foo: 'bar', bar: 0 };
    const config_1 = { foo: 'bar', bar: 0 };
    const result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_1);
  });
  it('should handle simple, depth:1 types (dst: undefined)', function () {
    const config_0 = undefined;
    const config_1 = { foo: 'bar', bar: 0 };
    const result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_1);
  });
  it('should handle simple, depth:1 types (src: undefined)', function () {
    const config_0 = { foo: 'bar', bar: 0 };
    const config_1 = undefined;
    const result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_0);
  });
  it('should handle simple, depth:1 types (merge)', function () {
    const config_0 = { foo: 'bar', bar: 0 };
    const config_1 = { foo: 'foo' };
    const result = assignWithDepth(config_0, config_1);
    expect(result).toEqual({ foo: 'foo', bar: 0 });
  });
  it('should handle depth:2 types (dst: orphan)', function () {
    const config_0 = { foo: 'bar', bar: { foo: 'bar' } };
    const config_1 = { foo: 'bar' };
    const result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_0);
  });
  it('should handle depth:2 types (dst: object, src: simple type)', function () {
    const config_0 = { foo: 'bar', bar: { foo: 'bar' } };
    const config_1 = { foo: 'foo', bar: 'should NOT clobber' };
    const result = assignWithDepth(config_0, config_1);
    expect(result).toEqual({ foo: 'foo', bar: { foo: 'bar' } });
  });
  it('should handle depth:2 types (src: orphan)', function () {
    const config_0 = { foo: 'bar' };
    const config_1 = { foo: 'bar', bar: { foo: 'bar' } };
    const result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_1);
  });
  it('should handle depth:2 types (merge)', function () {
    const config_0 = { foo: 'bar', bar: { foo: 'bar' }, boofar: 1 };
    const config_1 = { foo: 'foo', bar: { bar: 0 }, foobar: 'foobar' };
    const result = assignWithDepth(config_0, config_1);
    expect(result).toEqual({
      foo: 'foo',
      bar: { foo: 'bar', bar: 0 },
      foobar: 'foobar',
      boofar: 1,
    });
  });
  it('should handle depth:3 types (merge with clobber because assignWithDepth::depth == 2)', function () {
    const config_0 = {
      foo: 'bar',
      bar: { foo: 'bar', bar: { foo: { message: 'this', willbe: 'clobbered' } } },
      boofar: 1,
    };
    const config_1 = {
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'clobbered other foo' } } },
      foobar: 'foobar',
    };
    const result = assignWithDepth(config_0, config_1);
    expect(result).toEqual({
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'clobbered other foo' } } },
      foobar: 'foobar',
      boofar: 1,
    });
  });
  it('should handle depth:3 types (merge with clobber because assignWithDepth::depth == 1)', function () {
    const config_0 = {
      foo: 'bar',
      bar: {
        foo: 'bar',
        bar: { foo: { message: '', willNotbe: 'present' }, bar: 'shouldNotBePresent' },
      },
      boofar: 1,
    };
    const config_1 = {
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'this' } } },
      foobar: 'foobar',
    };
    const result = assignWithDepth(config_0, config_1, { depth: 1 });
    expect(result).toEqual({
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'this' } } },
      foobar: 'foobar',
      boofar: 1,
    });
  });
  it('should handle depth:3 types (merge with no clobber because assignWithDepth::depth == 3)', function () {
    const config_0 = {
      foo: 'bar',
      bar: { foo: 'bar', bar: { foo: { message: '', willbe: 'present' } } },
      boofar: 1,
    };
    const config_1 = {
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'this' } } },
      foobar: 'foobar',
    };
    const result = assignWithDepth(config_0, config_1, { depth: 3 });
    expect(result).toEqual({
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'this', willbe: 'present' } } },
      foobar: 'foobar',
      boofar: 1,
    });
  });
});
describe('when memoizing', function () {
  it('should return the same value', function () {
    const fib: any = memoize(
      function (n: number, x: string, canary: { flag: boolean }) {
        canary.flag = true;
        if (n < 2) {
          return 1;
        } else {
          //We'll console.log a loader every time we have to recurse
          return fib(n - 2, x, canary) + fib(n - 1, x, canary);
        }
      },
      (n, x, _) => `${n}${x}`
    );
    let canary = { flag: false };
    fib(10, 'a', canary);
    expect(canary.flag).toBe(true);
    canary = { flag: false };
    fib(10, 'a', canary);
    expect(canary.flag).toBe(false);
    fib(10, 'b', canary);
    fib(10, 'b', canary);
    expect(canary.flag).toBe(true);
    canary = { flag: false };
    fib(10, 'b', canary);
    fib(10, 'a', canary);
    expect(canary.flag).toBe(false);
  });
});
describe('when detecting chart type ', function () {
  it('should handle a graph definition', function () {
    const str = 'graph TB\nbfs1:queue';
    const type = detectType(str);
    expect(type).toBe('flowchart');
  });
  it('should handle a wrap directive', () => {
    const wrap = { type: 'wrap', args: null };
    expect(detectDirective('%%{wrap}%%', 'wrap')).toEqual(wrap);
    expect(
      detectDirective(
        `%%{
      wrap
    }%%`,
        'wrap'
      )
    ).toEqual(wrap);
    expect(
      detectDirective(
        `%%{

          wrap

    }%%`,
        'wrap'
      )
    ).toEqual(wrap);
    expect(detectDirective('%%{wrap:}%%', 'wrap')).toEqual(wrap);
    expect(detectDirective('%%{wrap: }%%', 'wrap')).toEqual(wrap);
    expect(detectDirective('graph', 'wrap')).not.toEqual(wrap);
  });
  it('should handle an initialize definition', function () {
    const str = `
%%{initialize: { 'logLevel': 0, 'theme': 'dark' }}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = detectType(str);
    const init = preprocessDiagram(str).config;
    expect(type).toBe('sequence');
    expect(init).toEqual({ logLevel: 0, theme: 'dark' });
  });
  it('should handle an init definition', function () {
    const str = `
%%{init: { 'logLevel': 0, 'theme': 'dark' }}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = detectType(str);
    const init = preprocessDiagram(str).config;
    expect(type).toBe('sequence');
    expect(init).toEqual({ logLevel: 0, theme: 'dark' });
  });
  it('should handle an init definition with config converted to the proper diagram configuration', function () {
    const str = `
%%{init: { 'logLevel': 0, 'theme': 'dark', 'config': {'wrap': true} } }%%
sequenceDiagram
Alice->Bob: hi`;
    const type = detectType(str);
    const init = preprocessDiagram(str).config;
    expect(type).toBe('sequence');
    expect(init).toEqual({ logLevel: 0, theme: 'dark', sequence: { wrap: true } });
  });
  it('should handle a multiline init definition', function () {
    const str = `
%%{
  init: {
    'logLevel': 0,
    'theme': 'dark'
  }
}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = detectType(str);
    const init = preprocessDiagram(str).config;
    expect(type).toBe('sequence');
    expect(init).toEqual({ logLevel: 0, theme: 'dark' });
  });
  it('should handle multiple init directives', function () {
    const str = `
%%{ init: { 'logLevel': 0, 'theme': 'forest' } }%%
%%{
  init: {
    'theme': 'dark'
  }
}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = detectType(str);
    const init = preprocessDiagram(str).config;
    expect(type).toBe('sequence');
    expect(init).toEqual({ logLevel: 0, theme: 'dark' });
  });
  it('should handle a graph definition with leading spaces', function () {
    const str = '    graph TB\nbfs1:queue';
    const type = detectType(str);
    expect(type).toBe('flowchart');
  });

  it('should handle a graph definition with leading spaces and newline', function () {
    const str = '  \n  graph TB\nbfs1:queue';
    const type = detectType(str);
    expect(type).toBe('flowchart');
  });
  it('should handle a graph definition for gitGraph', function () {
    const str = '  \n  gitGraph TB:\nbfs1:queue';
    const type = detectType(str);
    expect(type).toBe('gitGraph');
  });
  it('should handle frontmatter', function () {
    const str = '---\ntitle: foo\n---\n  gitGraph TB:\nbfs1:queue';
    const type = detectType(str);
    expect(type).toBe('gitGraph');
  });
  it('should handle malformed frontmatter (with leading spaces) with `---` error graphtype', function () {
    const str = '    ---\ntitle: foo\n---\n  gitGraph TB:\nbfs1:queue';
    expect(detectType(str)).toBe('---');
  });
});
describe('when finding substring in array ', function () {
  it('should return the array index that contains the substring', function () {
    const arr = ['stroke:val1', 'fill:val2'];
    const result = utils.isSubstringInArray('fill', arr);
    expect(result).toEqual(1);
  });
  it('should return -1 if the substring is not found in the array', function () {
    const arr = ['stroke:val1', 'stroke-width:val2'];
    const result = utils.isSubstringInArray('fill', arr);
    expect(result).toEqual(-1);
  });
});
describe('when formatting urls', function () {
  it('should handle links', function () {
    const url = 'https://mermaid-js.github.io/mermaid/#/';

    let result = utils.formatUrl(url, { securityLevel: 'loose' });
    expect(result).toEqual(url);

    result = utils.formatUrl(url, { securityLevel: 'strict' });
    expect(result).toEqual(url);
  });
  it('should handle anchors', function () {
    const url = '#interaction';

    let result = utils.formatUrl(url, { securityLevel: 'loose' });
    expect(result).toEqual(url);

    result = utils.formatUrl(url, { securityLevel: 'strict' });
    expect(result).toEqual(url);
  });
  it('should handle mailto', function () {
    const url = 'mailto:user@user.user';

    let result = utils.formatUrl(url, { securityLevel: 'loose' });
    expect(result).toEqual(url);

    result = utils.formatUrl(url, { securityLevel: 'strict' });
    expect(result).toEqual(url);
  });
  it('should handle other protocols', function () {
    const url = 'notes://do-your-thing/id';

    let result = utils.formatUrl(url, { securityLevel: 'loose' });
    expect(result).toEqual(url);

    result = utils.formatUrl(url, { securityLevel: 'strict' });
    expect(result).toEqual(url);
  });
  it('should handle scripts', function () {
    const url = 'javascript:alert("test")';

    let result = utils.formatUrl(url, { securityLevel: 'loose' });
    expect(result).toEqual(url);

    result = utils.formatUrl(url, { securityLevel: 'strict' });
    expect(result).toEqual('about:blank');
  });
});

describe('when initializing the id generator', function () {
  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers();
  });

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
  });

  it('should return a random number generator based on Date', function () {
    const idGenerator = new utils.InitIDGenerator(false);
    expect(typeof idGenerator.next).toEqual('function');
    const lastId = idGenerator.next();
    vi.advanceTimersByTime(1000);
    expect(idGenerator.next() > lastId).toBe(true);
  });

  it('should return a non random number generator', function () {
    const idGenerator = new utils.InitIDGenerator(true);
    expect(typeof idGenerator.next).toEqual('function');
    const start = 0;
    const lastId = idGenerator.next();
    expect(start).toEqual(lastId);
    expect(idGenerator.next()).toEqual(lastId + 1);
  });

  it('should return a non random number generator based on seed', function () {
    const idGenerator = new utils.InitIDGenerator(true, 'thisIsASeed');
    expect(typeof idGenerator.next).toEqual('function');
    const start = 11;
    const lastId = idGenerator.next();
    expect(start).toEqual(lastId);
    expect(idGenerator.next()).toEqual(lastId + 1);
  });
});

describe('when inserting titles', function () {
  const svg = new MockedD3('svg');
  const mockedElement = {
    getBBox: vi.fn().mockReturnValue({ x: 10, y: 11, width: 100, height: 200 }),
  };
  const fauxTitle = new MockedD3('title');

  beforeEach(() => {
    svg.node = vi.fn().mockReturnValue(mockedElement);
  });

  it('does nothing if the title is empty', function () {
    const svgAppendSpy = vi.spyOn(svg, 'append');
    utils.insertTitle(svg, 'testClass', 0, '');
    expect(svgAppendSpy).not.toHaveBeenCalled();
  });

  it('appends the title as a text item with the given title text', function () {
    const svgAppendSpy = vi.spyOn(svg, 'append').mockReturnValue(fauxTitle);
    const titleTextSpy = vi.spyOn(fauxTitle, 'text');

    utils.insertTitle(svg, 'testClass', 5, 'test title');
    expect(svgAppendSpy).toHaveBeenCalled();
    expect(titleTextSpy).toHaveBeenCalledWith('test title');
  });

  it('x value is the bounds x position + half of the bounds width', () => {
    vi.spyOn(svg, 'append').mockReturnValue(fauxTitle);
    const titleAttrSpy = vi.spyOn(fauxTitle, 'attr');

    utils.insertTitle(svg, 'testClass', 5, 'test title');
    expect(titleAttrSpy).toHaveBeenCalledWith('x', 10 + 100 / 2);
  });

  it('y value is the negative of given title top margin', () => {
    vi.spyOn(svg, 'append').mockReturnValue(fauxTitle);
    const titleAttrSpy = vi.spyOn(fauxTitle, 'attr');

    utils.insertTitle(svg, 'testClass', 5, 'test title');
    expect(titleAttrSpy).toHaveBeenCalledWith('y', -5);
  });

  it('class is the given css class', () => {
    vi.spyOn(svg, 'append').mockReturnValue(fauxTitle);
    const titleAttrSpy = vi.spyOn(fauxTitle, 'attr');

    utils.insertTitle(svg, 'testClass', 5, 'test title');
    expect(titleAttrSpy).toHaveBeenCalledWith('class', 'testClass');
  });
});

describe('when parsing font sizes', function () {
  it('parses number inputs', function () {
    expect(utils.parseFontSize(14)).toEqual([14, '14px']);
  });

  it('parses string em inputs', function () {
    expect(utils.parseFontSize('14em')).toEqual([14, '14em']);
  });

  it('parses string px inputs', function () {
    expect(utils.parseFontSize('14px')).toEqual([14, '14px']);
  });

  it('parses string inputs without units', function () {
    expect(utils.parseFontSize('14')).toEqual([14, '14px']);
  });

  it('handles undefined input', function () {
    expect(utils.parseFontSize(undefined)).toEqual([undefined, undefined]);
  });

  it('handles unparsable input', function () {
    // @ts-expect-error Explicitly testing unparsable input
    expect(utils.parseFontSize({ fontSize: 14 })).toEqual([undefined, undefined]);
  });
});

describe('cleanAndMerge', () => {
  test('should merge objects', () => {
    expect(cleanAndMerge({ a: 1, b: 2 }, { b: 3 })).toEqual({ a: 1, b: 3 });
    expect(cleanAndMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  test('should remove undefined values', () => {
    expect(cleanAndMerge({ a: 1, b: 2 }, { b: undefined })).toEqual({ a: 1, b: 2 });
    expect(cleanAndMerge({ a: 1, b: 2 }, { a: 2, b: undefined })).toEqual({ a: 2, b: 2 });
    expect(cleanAndMerge({ a: 1, b: { c: 2 } }, { a: 2, b: undefined })).toEqual({
      a: 2,
      b: { c: 2 },
    });
    // @ts-expect-error Explicitly testing different type
    expect(cleanAndMerge({ a: 1, b: { c: 2 } }, { a: 2, b: { c: undefined } })).toEqual({
      a: 2,
      b: { c: 2 },
    });
  });

  test('should create deep copies of object', () => {
    const input: { a: number; b?: number } = { a: 1 };
    const output = cleanAndMerge(input, { b: 2 });
    expect(output).toEqual({ a: 1, b: 2 });
    output.b = 3;
    expect(input).toEqual({ a: 1 });

    const inputDeep = { a: { b: 1 } };
    const outputDeep = cleanAndMerge(inputDeep, { a: { b: 2 } });
    expect(outputDeep).toEqual({ a: { b: 2 } });
    outputDeep.a.b = 3;
    expect(inputDeep).toEqual({ a: { b: 1 } });
  });
});

describe('calculatePoint', () => {
  it('should calculate a point on a straight line', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: 20 },
    ];
    expect(calculatePoint(points, 0)).toEqual({ x: 0, y: 0 });
    expect(calculatePoint(points, 5)).toEqual({ x: 0, y: 5 });
    expect(calculatePoint(points, 10)).toEqual({ x: 0, y: 10 });
  });

  it('should calculate a point on a straight line with slope', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];
    expect(calculatePoint(points, 0)).toMatchInlineSnapshot(`
      {
        "x": 0,
        "y": 0,
      }
    `);
    expect(calculatePoint(points, 5)).toMatchInlineSnapshot(`
      {
        "x": 3.53553,
        "y": 3.53553,
      }
    `);
    expect(calculatePoint(points, 10)).toMatchInlineSnapshot(`
      {
        "x": 7.07107,
        "y": 7.07107,
      }
    `);
  });

  it('should calculate a point on a straight line with negative slope', () => {
    const points = [
      { x: 20, y: 20 },
      { x: 10, y: 10 },
      { x: 15, y: 15 },
      { x: 0, y: 0 },
    ];
    expect(calculatePoint(points, 0)).toMatchInlineSnapshot(`
      {
        "x": 20,
        "y": 20,
      }
    `);
    expect(calculatePoint(points, 5)).toMatchInlineSnapshot(`
      {
        "x": 16.46447,
        "y": 16.46447,
      }
    `);
    expect(calculatePoint(points, 10)).toMatchInlineSnapshot(`
      {
        "x": 12.92893,
        "y": 12.92893,
      }
    `);
  });

  it('should calculate a point on a curved line', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ];
    expect(calculatePoint(points, 0)).toMatchInlineSnapshot(`
      {
        "x": 0,
        "y": 0,
      }
    `);
    expect(calculatePoint(points, 15)).toMatchInlineSnapshot(`
      {
        "x": 10.6066,
        "y": 9.3934,
      }
    `);
    expect(calculatePoint(points, 20)).toMatchInlineSnapshot(`
      {
        "x": 14.14214,
        "y": 5.85786,
      }
    `);
  });

  it('should throw an error if the new point cannot be found', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];
    const distanceToTraverse = 30;
    expect(() => calculatePoint(points, distanceToTraverse)).toThrow(
      'Could not find a suitable point for the given distance'
    );
  });
});
