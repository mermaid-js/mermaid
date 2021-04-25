/* eslint-env jasmine */
import utils from './utils';

describe('when assignWithDepth: should merge objects within objects', function() {
  it('should handle simple, depth:1 types (identity)', function() {
    let config_0 = { foo: 'bar', bar: 0 };
    let config_1 = { foo: 'bar', bar: 0 };
    let result = utils.assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_1);
  });
  it('should handle simple, depth:1 types (dst: undefined)', function() {
    let config_0 = undefined;
    let config_1 = { foo: 'bar', bar: 0 };
    let result = utils.assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_1);
  });
  it('should handle simple, depth:1 types (src: undefined)', function() {
    let config_0 = { foo: 'bar', bar: 0 };
    let config_1 = undefined;
    let result = utils.assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_0);
  });
  it('should handle simple, depth:1 types (merge)', function() {
    let config_0 = { foo: 'bar', bar: 0 };
    let config_1 = { foo: 'foo' };
    let result = utils.assignWithDepth(config_0, config_1);
    expect(result).toEqual({ foo: 'foo', bar: 0});
  });
  it('should handle depth:2 types (dst: orphan)', function() {
    let config_0 = { foo: 'bar', bar: { foo: 'bar' } };
    let config_1 = { foo: 'bar' };
    let result = utils.assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_0);
  });
  it('should handle depth:2 types (dst: object, src: simple type)', function() {
    let config_0 = { foo: 'bar', bar: { foo: 'bar' } };
    let config_1 = { foo: 'foo', bar: 'should NOT clobber'};
    let result = utils.assignWithDepth(config_0, config_1);
    expect(result).toEqual({ foo: 'foo', bar: { foo: 'bar' } } );
  });
  it('should handle depth:2 types (src: orphan)', function() {
    let config_0 = { foo: 'bar' };
    let config_1 = { foo: 'bar', bar: { foo: 'bar' } };
    let result = utils.assignWithDepth(config_0, config_1);
    expect(result).toEqual(config_1);
  });
  it('should handle depth:2 types (merge)', function() {
    let config_0 = { foo: 'bar', bar: { foo: 'bar' }, boofar: 1 };
    let config_1 = { foo: 'foo', bar: { bar: 0 }, foobar: 'foobar' };
    let result = utils.assignWithDepth(config_0, config_1);
    expect(result).toEqual({ foo: "foo", bar: { foo: "bar", bar: 0 }, foobar: "foobar", boofar: 1 });
  });
  it('should handle depth:3 types (merge with clobber because assignWithDepth::depth == 2)', function() {
    let config_0 = { foo: 'bar', bar: { foo: 'bar', bar: { foo: { message: 'this', willbe: 'clobbered' } } }, boofar: 1 };
    let config_1 = { foo: 'foo', bar: { foo: 'foo', bar: { foo: { message: 'clobbered other foo' } } }, foobar: 'foobar' };
    let result = utils.assignWithDepth(config_0, config_1);
    expect(result).toEqual({ foo: "foo", bar: { foo: 'foo', bar: { foo: { message: 'clobbered other foo' } } }, foobar: "foobar", boofar: 1 });
  });
  it('should handle depth:3 types (merge with clobber because assignWithDepth::depth == 1)', function() {
    let config_0 = { foo: 'bar', bar: { foo: 'bar', bar: { foo: { message: '', willNotbe: 'present' }, bar: 'shouldNotBePresent' } }, boofar: 1 };
    let config_1 = { foo: 'foo', bar: { foo: 'foo', bar: { foo: { message: 'this' } } }, foobar: 'foobar' };
    let result = utils.assignWithDepth(config_0, config_1, { depth: 1 });
    expect(result).toEqual({ foo: "foo", bar: { foo: 'foo', bar: { foo: { message: 'this' } } }, foobar: "foobar", boofar: 1 });
  });
  it('should handle depth:3 types (merge with no clobber because assignWithDepth::depth == 3)', function() {
    let config_0 = { foo: 'bar', bar: { foo: 'bar', bar: { foo: { message: '', willbe: 'present' } } }, boofar: 1 };
    let config_1 = { foo: 'foo', bar: { foo: 'foo', bar: { foo: { message: 'this' } } }, foobar: 'foobar' };
    let result = utils.assignWithDepth(config_0, config_1, { depth: 3 });
    expect(result).toEqual({ foo: "foo", bar: { foo: 'foo', bar: { foo: { message: 'this', willbe: 'present' } } }, foobar: "foobar", boofar: 1 });
  });
});
describe('when memoizing', function() {
  it('should return the same value', function() {
    const fib = utils.memoize(function(n, canary) {
      canary.flag = true;
      if (n < 2){
        return 1;
      }else{
        //We'll console.log a loader every time we have to recurse
        return fib(n-2, canary) + fib(n-1, canary);
      }
    });
    let canary = {flag: false};
    fib(10, canary);
    expect(canary.flag).toBe(true);
    canary = {flag: false};
    fib(10, canary);
    expect(canary.flag).toBe(false);
  });
})
describe('when detecting chart type ', function() {
  it('should handle a graph definition', function() {
    const str = 'graph TB\nbfs1:queue';
    const type = utils.detectType(str);
    expect(type).toBe('flowchart');
  });
  it('should handle an initialize definition', function() {
    const str = `
%%{initialize: { 'logLevel': 0, 'theme': 'dark' }}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = utils.detectType(str);
    const init = utils.detectInit(str);
    expect(type).toBe('sequence');
    expect(init).toEqual({logLevel:0,theme:"dark"});
  });
  it('should handle an init definition', function() {
    const str = `
%%{init: { 'logLevel': 0, 'theme': 'dark' }}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = utils.detectType(str);
    const init = utils.detectInit(str);
    expect(type).toBe('sequence');
    expect(init).toEqual({logLevel:0,theme:"dark"});
  });
  it('should handle an init definition with config converted to the proper diagram configuration', function() {
    const str = `
%%{init: { 'logLevel': 0, 'theme': 'dark', 'config': {'wrap': true} } }%%
sequenceDiagram
Alice->Bob: hi`;
    const type = utils.detectType(str);
    const init = utils.detectInit(str);
    expect(type).toBe('sequence');
    expect(init).toEqual({logLevel:0, theme:"dark", sequence: { wrap: true }});
  });
  it('should handle a multiline init definition', function() {
    const str = `
%%{
  init: {
    'logLevel': 0,
    'theme': 'dark'
  }
}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = utils.detectType(str);
    const init = utils.detectInit(str);
    expect(type).toBe('sequence');
    expect(init).toEqual({logLevel:0,theme:"dark"});
  });
  it('should handle multiple init directives', function() {
    const str = `
%%{ init: { 'logLevel': 0, 'theme': 'forest' } }%%
%%{
  init: {
    'theme': 'dark'
  }
}%%
sequenceDiagram
Alice->Bob: hi`;
    const type = utils.detectType(str);
    const init = utils.detectInit(str);
    expect(type).toBe('sequence');
    expect(init).toEqual({logLevel:0,theme:"dark"});
  });
  it('should handle a graph definition with leading spaces', function() {
    const str = '    graph TB\nbfs1:queue';
    const type = utils.detectType(str);
    expect(type).toBe('flowchart');
  });

  it('should handle a graph definition with leading spaces and newline', function() {
    const str = '  \n  graph TB\nbfs1:queue';
    const type = utils.detectType(str);
    expect(type).toBe('flowchart');
  });
  it('should handle a graph definition for gitGraph', function() {
    const str = '  \n  gitGraph TB:\nbfs1:queue';
    const type = utils.detectType(str);
    expect(type).toBe('git');
  });
});
describe('when finding substring in array ', function() {
  it('should return the array index that contains the substring', function() {
    const arr = ['stroke:val1', 'fill:val2'];
    const result = utils.isSubstringInArray('fill', arr);
    expect(result).toEqual(1);
  });
  it('should return -1 if the substring is not found in the array', function() {
    const arr = ['stroke:val1', 'stroke-width:val2'];
    const result = utils.isSubstringInArray('fill', arr);
    expect(result).toEqual(-1);
  });
});
describe('when formatting urls', function() {
  it('should handle links', function() {
    const url = 'https://mermaid-js.github.io/mermaid/#/';

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
    expect(result).toEqual(url);
  });
  it('should handle anchors', function() {
    const url = '#interaction';

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
    expect(result).toEqual('about:blank');
  });
  it('should handle mailto', function() {
    const url = 'mailto:user@user.user';

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
    expect(result).toEqual(url);
  });
  it('should handle other protocols', function() {
    const url = 'notes://do-your-thing/id';

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
    expect(result).toEqual(url);
  });
  it('should handle scripts', function() {
    const url = 'javascript:alert("test")';

    let config = { securityLevel: 'loose' };
    let result = utils.formatUrl(url, config);
    expect(result).toEqual(url);

    config.securityLevel = 'strict';
    result = utils.formatUrl(url, config);
    expect(result).toEqual('about:blank');
  });
});
describe('when calculating SVG size', function() {
  it('should return width 100% when useMaxWidth is true', function () {
    const attrs = utils.calculateSvgSizeAttrs(100, 200, true);
    expect(attrs.get('height')).toEqual(100);
    expect(attrs.get('style')).toEqual('max-width: 200px;');
    expect(attrs.get('width')).toEqual('100%');
  });
  it('should return absolute width when useMaxWidth is false', function () {
    const attrs = utils.calculateSvgSizeAttrs(100, 200, false);
    expect(attrs.get('height')).toEqual(100);
    expect(attrs.get('width')).toEqual(200);
  });
});

describe('when initializing the id generator', function () {
  it('should return a random number generator based on Date', function (done) {
    const idGenerator = new utils.initIdGeneratior(false)
    expect(typeof idGenerator.next).toEqual('function')
    const lastId = idGenerator.next()
    setTimeout(() => {
      expect(idGenerator.next() > lastId).toBe(true)
      done()
    }, 5)
  });

  it('should return a non random number generator', function () {
    const idGenerator = new utils.initIdGeneratior(true)
    expect(typeof idGenerator.next).toEqual('function')
    const start = 0
    const lastId = idGenerator.next()
    expect(start).toEqual(lastId)
    expect(idGenerator.next()).toEqual(lastId +1)
  });

  it('should return a non random number generator based on seed', function () {
    const idGenerator = new utils.initIdGeneratior(true, 'thisIsASeed')
    expect(typeof idGenerator.next).toEqual('function')
    const start = 11
    const lastId = idGenerator.next()
    expect(start).toEqual(lastId)
    expect(idGenerator.next()).toEqual(lastId +1)
  });

})
