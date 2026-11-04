import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig, setSiteConfig } from '../../../config.js';
import { log } from '../../../logger.js';
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

  it('should be possible to use click to a callback', function () {
    spyOn(flowDb, 'setClickEvent');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A callback');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback');
  });

  it('should be possible to use click to a click and call callback', function () {
    spyOn(flowDb, 'setClickEvent');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A call callback()');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback');
  });

  it('should be possible to use click to a callback with tooltip', function () {
    spyOn(flowDb, 'setClickEvent');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A callback "tooltip"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should be possible to use click to a click and call callback with tooltip', function () {
    spyOn(flowDb, 'setClickEvent');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A call callback() "tooltip"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should be possible to use click to a callback with an arbitrary number of args', function () {
    spyOn(flowDb, 'setClickEvent');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A call callback("test0", test1, test2)');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback', '"test0", test1, test2');
  });

  it('should handle interaction - click to a link', function () {
    spyOn(flowDb, 'setLink');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
  });

  it('should handle interaction - click to a click and href link', function () {
    spyOn(flowDb, 'setLink');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A href "click.html"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
  });

  it('should handle interaction - click to a link with tooltip', function () {
    spyOn(flowDb, 'setLink');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html" "tooltip"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should handle interaction - click to a click and href link with tooltip', function () {
    spyOn(flowDb, 'setLink');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A href "click.html" "tooltip"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should handle interaction - click to a link with target', function () {
    spyOn(flowDb, 'setLink');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html" _blank');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
  });

  it('should handle interaction - click to a click and href link with target', function () {
    spyOn(flowDb, 'setLink');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A href "click.html" _blank');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
  });

  it('should handle interaction - click to a link with tooltip and target', function () {
    spyOn(flowDb, 'setLink');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html" "tooltip" _blank');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should handle interaction - click to a click and href link with tooltip and target', function () {
    spyOn(flowDb, 'setLink');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A href "click.html" "tooltip" _blank');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });
});

describe('[Interactions] click callbacks with securityLevel other than "loose"', () => {
  let flowDb;
  let warnSpy;
  beforeEach(function () {
    flowDb = new FlowDB();
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
    warnSpy = spyOn(log, 'warn').mockImplementation(() => undefined);
  });

  afterEach(function () {
    warnSpy.mockRestore();
    // Restore the default site config (securityLevel 'strict'). Note that
    // `setConfig` cannot be used here: securityLevel is a secure key and is
    // stripped from diagram-level config updates.
    setSiteConfig({});
  });

  it('warns that the callback is ignored when securityLevel is not "loose"', function () {
    flow.parser.parse('graph TD\nA-->B\nclick A call callback()');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'Click event callback calls are ignored because securityLevel is not "loose" in the mermaid configuration'
    );
  });

  it('warns once per click statement, not once per id', function () {
    flow.parser.parse('graph TD\nA-->B\nclick A,B call callback()');

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('does not warn when securityLevel is "loose"', function () {
    setSiteConfig({ securityLevel: 'loose' });
    flow.parser.parse('graph TD\nA-->B\nclick A call callback()');

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
