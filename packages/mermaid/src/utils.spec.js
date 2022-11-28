import { vi } from 'vitest';
import utils from './utils';
import assignWithDepth from './assignWithDepth';
import { detectType } from './diagram-api/detectType';
import { addDiagrams } from './diagram-api/diagram-orchestration';
import memoize from 'lodash-es/memoize';
import { MockedD3 } from './tests/MockedD3';

addDiagrams();

describe('when assignWithDepth: should merge objects within objects', function () {
  it('should handle simple, depth:1 types (identity)', function () {
    let config_0 = { foo: 'bar', bar: 0 };
    let config_1 = { foo: 'bar', bar: 0 };
    let result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_1);
  });
  it('should handle simple, depth:1 types (dst: undefined)', function () {
    let config_0 = undefined;
    let config_1 = { foo: 'bar', bar: 0 };
    let result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_1);
  });
  it('should handle simple, depth:1 types (src: undefined)', function () {
    let config_0 = { foo: 'bar', bar: 0 };
    let config_1 = undefined;
    let result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_0);
  });
  it('should handle simple, depth:1 types (merge)', function () {
    let config_0 = { foo: 'bar', bar: 0 };
    let config_1 = { foo: 'foo' };
    let result = assignWithDepth(config_0, config_1);
    expect(result).toEqual({ foo: 'foo', bar: 0 });
  });
  it('should handle depth:2 types (dst: orphan)', function () {
    let config_0 = { foo: 'bar', bar: { foo: 'bar' } };
    let config_1 = { foo: 'bar' };
    let result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_0);
  });
  it('should handle depth:2 types (dst: object, src: simple type)', function () {
    let config_0 = { foo: 'bar', bar: { foo: 'bar' } };
    let config_1 = { foo: 'foo', bar: 'should NOT clobber' };
    let result = assignWithDepth(config_0, config_1);
    expect(result).toEqual({ foo: 'foo', bar: { foo: 'bar' } });
  });
  it('should handle depth:2 types (src: orphan)', function () {
    let config_0 = { foo: 'bar' };
    let config_1 = { foo: 'bar', bar: { foo: 'bar' } };
    let result = assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_1);
  });
  it('should handle depth:2 types (merge)', function () {
    let config_0 = { foo: 'bar', bar: { foo: 'bar' }, boofar: 1 };
    let config_1 = { foo: 'foo', bar: { bar: 0 }, foobar: 'foobar' };
    let result = assignWithDepth(config_0, config_1);
    expect(result).toEqual({
      foo: 'foo',
      bar: { foo: 'bar', bar: 0 },
      foobar: 'foobar',
      boofar: 1,
    });
  });
  it('should handle depth:3 types (merge with clobber because assignWithDepth::depth == 2)', function () {
    let config_0 = {
      foo: 'bar',
      bar: { foo: 'bar', bar: { foo: { message: 'this', willbe: 'clobbered' } } },
      boofar: 1,
    };
    let config_1 = {
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'clobbered other foo' } } },
      foobar: 'foobar',
    };
    let result = assignWithDepth(config_0, config_1);
    expect(result).toEqual({
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'clobbered other foo' } } },
      foobar: 'foobar',
      boofar: 1,
    });
  });
  it('should handle depth:3 types (merge with clobber because assignWithDepth::depth == 1)', function () {
    let config_0 = {
      foo: 'bar',
      bar: {
        foo: 'bar',
        bar: { foo: { message: '', willNotbe: 'present' }, bar: 'shouldNotBePresent' },
      },
      boofar: 1,
    };
    let config_1 = {
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'this' } } },
      foobar: 'foobar',
    };
    let result = assignWithDepth(config_0, config_1, { depth: 1 });
    expect(result).toEqual({
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'this' } } },
      foobar: 'foobar',
      boofar: 1,
    });
  });
  it('should handle depth:3 types (merge with no clobber because assignWithDepth::depth == 3)', function () {
    let config_0 = {
      foo: 'bar',
      bar: { foo: 'bar', bar: { foo: { message: '', willbe: 'present' } } },
      boofar: 1,
    };
    let config_1 = {
      foo: 'foo',
      bar: { foo: 'foo', bar: { foo: { message: 'this' } } },
      foobar: 'foobar',
    };
    let result = assignWithDepth(config_0, config_1, { depth: 3 });
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
    const fib = memoize(
      function (n, x, canary) {
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
  it('should handle an initialize definition', function () {
    const str = `
%%{initialize: { 'logLevel': 0, 'theme': 'dark' }}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = detectType(str);
    const init = utils.detectInit(str);
    expect(type).toBe('sequence');
    expect(init).toEqual({ logLevel: 0, theme: 'dark' });
  });
  it('should handle an init definition', function () {
    const str = `
%%{init: { 'logLevel': 0, 'theme': 'dark' }}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = detectType(str);
    const init = utils.detectInit(str);
    expect(type).toBe('sequence');
    expect(init).toEqual({ logLevel: 0, theme: 'dark' });
  });
  it('should handle an init definition with config converted to the proper diagram configuration', function () {
    const str = `
%%{init: { 'logLevel': 0, 'theme': 'dark', 'config': {'wrap': true} } }%%
sequenceDiagram
Alice->Bob: hi`;
    const type = detectType(str);
    const init = utils.detectInit(str);
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
    const init = utils.detectInit(str);
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
    const init = utils.detectInit(str);
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
  it('should not allow frontmatter with leading spaces', function () {
    const str = '    ---\ntitle: foo\n---\n  gitGraph TB:\nbfs1:queue';
    expect(() => detectType(str)).toThrow('No diagram type detected for text');
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

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
    expect(result).toEqual(url);
  });
  it('should handle anchors', function () {
    const url = '#interaction';

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
    expect(result).toEqual(url);
  });
  it('should handle mailto', function () {
    const url = 'mailto:user@user.user';

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
    expect(result).toEqual(url);
  });
  it('should handle other protocols', function () {
    const url = 'notes://do-your-thing/id';

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
    expect(result).toEqual(url);
  });
  it('should handle scripts', function () {
    const url = 'javascript:alert("test")';

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
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
    const idGenerator = new utils.initIdGenerator(false);
    expect(typeof idGenerator.next).toEqual('function');
    const lastId = idGenerator.next();
    vi.advanceTimersByTime(1000);
    expect(idGenerator.next() > lastId).toBe(true);
  });

  it('should return a non random number generator', function () {
    const idGenerator = new utils.initIdGenerator(true);
    expect(typeof idGenerator.next).toEqual('function');
    const start = 0;
    const lastId = idGenerator.next();
    expect(start).toEqual(lastId);
    expect(idGenerator.next()).toEqual(lastId + 1);
  });

  it('should return a non random number generator based on seed', function () {
    const idGenerator = new utils.initIdGenerator(true, 'thisIsASeed');
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
    const svg_append_spy = vi.spyOn(svg, 'append');
    utils.insertTitle(svg, 'testClass', 0, '');
    expect(svg_append_spy).not.toHaveBeenCalled();
  });

  it('appends the title as a text item with the given title text', function () {
    const svg_append_spy = vi.spyOn(svg, 'append').mockReturnValue(fauxTitle);
    const title_text_spy = vi.spyOn(fauxTitle, 'text');

    utils.insertTitle(svg, 'testClass', 5, 'test title');
    expect(svg_append_spy).toHaveBeenCalled();
    expect(title_text_spy).toHaveBeenCalledWith('test title');
  });

  it('x value is the bounds x position + half of the bounds width', () => {
    vi.spyOn(svg, 'append').mockReturnValue(fauxTitle);
    const title_attr_spy = vi.spyOn(fauxTitle, 'attr');

    utils.insertTitle(svg, 'testClass', 5, 'test title');
    expect(title_attr_spy).toHaveBeenCalledWith('x', 10 + 100 / 2);
  });

  it('y value is the negative of given title top margin', () => {
    vi.spyOn(svg, 'append').mockReturnValue(fauxTitle);
    const title_attr_spy = vi.spyOn(fauxTitle, 'attr');

    utils.insertTitle(svg, 'testClass', 5, 'test title');
    expect(title_attr_spy).toHaveBeenCalledWith('y', -5);
  });

  it('class is the given css class', () => {
    vi.spyOn(svg, 'append').mockReturnValue(fauxTitle);
    const title_attr_spy = vi.spyOn(fauxTitle, 'attr');

    utils.insertTitle(svg, 'testClass', 5, 'test title');
    expect(title_attr_spy).toHaveBeenCalledWith('class', 'testClass');
  });
});
