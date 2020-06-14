/* eslint-env jasmine */
import utils from './utils';

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
