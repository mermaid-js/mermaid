import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';
import { vi } from 'vitest';
const spyOn = vi.spyOn;

setConfig({
  securityLevel: 'strict',
});

describe('[Interactions] when parsing', () => {
  let flowDb;
  beforeEach(function () {
    flowDb = new FlowDB();
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  function parseClick(statement) {
    flow.parser.parse(`graph TD\nA-->B\n${statement}`);
  }

  it.each(['A', 'A,B'])('should tokenize click separately from target IDs %s', (ids) => {
    const lexer = Object.create(flow.parser.lexer);
    lexer.setInput(`click \t${ids} callback`, flowDb);

    expect(lexer.lex()).toBe(flow.parser.symbols_.CLICK);
    expect(lexer.yytext).toBe('click');
    expect(lexer.lex()).toBe(flow.parser.symbols_.SPACE);
    expect(lexer.lex()).toBe(flow.parser.symbols_.CLICK_IDS);
    expect(lexer.yytext).toBe(ids);
  });

  it.each([
    {
      command: 'call callback("test") "tooltip"',
      method: 'setClickEvent',
      args: ['callback', '"test"'],
    },
    {
      command: 'href "click.html" "tooltip" _blank',
      method: 'setLink',
      args: ['click.html', '_blank'],
    },
  ])('should pass comma-separated target IDs to $method', ({ command, method, args }) => {
    const interaction = spyOn(flowDb, method);

    const clickString = `click \tA,B ${command}`;
    parseClick(clickString);

    expect(interaction).toHaveBeenCalledWith('A,B', ...args, 'tooltip');
  });

  it.each(['\n', '\r\n'])('should allow %j between target IDs and commands', (newline) => {
    const callback = spyOn(flowDb, 'setClickEvent');
    const link = spyOn(flowDb, 'setLink');

    flow.parser.parse(
      `graph TD\nA-->B\nclick A${newline}callback\nclick B${newline}href "click.html"\n`
    );

    expect(callback).toHaveBeenCalledWith('A', 'callback');
    expect(link).toHaveBeenCalledWith('B', 'click.html');
  });

  it.each([
    'click A call callback()',
    'click A call callback( \n\t )',
    'click A call callback("first\nsecond")',
    'click A "page.html"',
    'click A href "page.html" "first\nsecond"',
  ])('should parse the statement following %s', (statement) => {
    flow.parser.parse(`graph TD\nA-->B\n${statement}; click B "next.html";`);
    expect(flowDb.getVertices().get('B').link).toBe('next.html');
  });

  it.each(['click A "page.html', 'click A call callback("arg"', 'click A call callback('])(
    'should reject an unterminated click command: %s',
    (statement) => {
      expect(() => parseClick(statement)).toThrow();
    }
  );

  it('should be possible to use click to a callback', function () {
    spyOn(flowDb, 'setClickEvent');
    parseClick('click A callback');

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback');
  });

  it('should be possible to use click to a click and call callback', function () {
    spyOn(flowDb, 'setClickEvent');
    parseClick('click A call callback()');

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback', undefined);
  });

  it('should be possible to use click to a callback with tooltip', function () {
    spyOn(flowDb, 'setClickEvent');
    const clickString = 'click A callback "tooltip"';
    parseClick(clickString);

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback', undefined, 'tooltip');
  });

  it('should be possible to use click to a click and call callback with tooltip', function () {
    spyOn(flowDb, 'setClickEvent');
    const clickString = 'click A call callback() "tooltip"';
    parseClick(clickString);

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback', undefined, 'tooltip');
  });

  it('should be possible to use click to a callback with an arbitrary number of args', function () {
    spyOn(flowDb, 'setClickEvent');
    parseClick('click A call callback("test0", test1, test2)');

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback', '"test0", test1, test2');
  });

  it('should handle interaction - click to a link', function () {
    spyOn(flowDb, 'setLink');
    parseClick('click A "click.html"');

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
  });

  it('should handle interaction - click to a click and href link', function () {
    spyOn(flowDb, 'setLink');
    parseClick('click A href "click.html"');

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
  });

  it('should handle interaction - click to a link with tooltip', function () {
    spyOn(flowDb, 'setLink');
    const clickString = 'click A "click.html" "tooltip"';
    parseClick(clickString);

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', undefined, 'tooltip');
  });

  it('should handle interaction - click to a click and href link with tooltip', function () {
    spyOn(flowDb, 'setLink');
    const clickString = 'click A href "click.html" "tooltip"';
    parseClick(clickString);

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', undefined, 'tooltip');
  });

  it('should handle interaction - click to a link with target', function () {
    spyOn(flowDb, 'setLink');
    parseClick('click A "click.html" _blank');

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
  });

  it('should handle interaction - click to a click and href link with target', function () {
    spyOn(flowDb, 'setLink');
    parseClick('click A href "click.html" _blank');

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
  });

  it('should handle interaction - click to a link with tooltip and target', function () {
    spyOn(flowDb, 'setLink');
    const clickString = 'click A "click.html" "tooltip" _blank';
    parseClick(clickString);

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank', 'tooltip');
  });

  it('should handle interaction - click to a click and href link with tooltip and target', function () {
    spyOn(flowDb, 'setLink');
    const clickString = 'click A href "click.html" "tooltip" _blank';
    parseClick(clickString);

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank', 'tooltip');
  });
});
