import { FlowDB } from '../flowDb.js';
import flowParser from './flowParser.ts';
import { setConfig } from '../../../config.js';
import { vi } from 'vitest';
const spyOn = vi.spyOn;

setConfig({
  securityLevel: 'strict',
});

describe('[Lezer Interactions] when parsing', () => {
  beforeEach(function () {
    flowParser.parser.yy = new FlowDB();
    flowParser.parser.yy.clear();
  });

  it('should be possible to use click to a callback', function () {
    spyOn(flowParser.parser.yy, 'setClickEvent');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A callback');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setClickEvent).toHaveBeenCalledWith('A', 'callback');
  });

  it('should be possible to use click to a click and call callback', function () {
    spyOn(flowParser.parser.yy, 'setClickEvent');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A call callback()');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setClickEvent).toHaveBeenCalledWith('A', 'callback');
  });

  it('should be possible to use click to a callback with tooltip', function () {
    spyOn(flowParser.parser.yy, 'setClickEvent');
    spyOn(flowParser.parser.yy, 'setTooltip');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A callback "tooltip"');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setClickEvent).toHaveBeenCalledWith('A', 'callback');
    expect(flowParser.parser.yy.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should be possible to use click to a click and call callback with tooltip', function () {
    spyOn(flowParser.parser.yy, 'setClickEvent');
    spyOn(flowParser.parser.yy, 'setTooltip');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A call callback() "tooltip"');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setClickEvent).toHaveBeenCalledWith('A', 'callback');
    expect(flowParser.parser.yy.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should be possible to use click to a callback with an arbitrary number of args', function () {
    spyOn(flowParser.parser.yy, 'setClickEvent');
    const res = flowParser.parser.parse(
      'graph TD\nA-->B\nclick A call callback("test0", test1, test2)'
    );

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setClickEvent).toHaveBeenCalledWith(
      'A',
      'callback',
      '"test0", test1, test2'
    );
  });

  it('should handle interaction - click to a link', function () {
    spyOn(flowParser.parser.yy, 'setLink');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A "click.html"');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setLink).toHaveBeenCalledWith('A', 'click.html');
  });

  it('should handle interaction - click to a click and href link', function () {
    spyOn(flowParser.parser.yy, 'setLink');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A href "click.html"');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setLink).toHaveBeenCalledWith('A', 'click.html');
  });

  it('should handle interaction - click to a link with tooltip', function () {
    spyOn(flowParser.parser.yy, 'setLink');
    spyOn(flowParser.parser.yy, 'setTooltip');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A "click.html" "tooltip"');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setLink).toHaveBeenCalledWith('A', 'click.html');
    expect(flowParser.parser.yy.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should handle interaction - click to a click and href link with tooltip', function () {
    spyOn(flowParser.parser.yy, 'setLink');
    spyOn(flowParser.parser.yy, 'setTooltip');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A href "click.html" "tooltip"');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setLink).toHaveBeenCalledWith('A', 'click.html');
    expect(flowParser.parser.yy.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should handle interaction - click to a link with target', function () {
    spyOn(flowParser.parser.yy, 'setLink');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A "click.html" _blank');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
  });

  it('should handle interaction - click to a click and href link with target', function () {
    spyOn(flowParser.parser.yy, 'setLink');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A href "click.html" _blank');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
  });

  it('should handle interaction - click to a link with tooltip and target', function () {
    spyOn(flowParser.parser.yy, 'setLink');
    spyOn(flowParser.parser.yy, 'setTooltip');
    const res = flowParser.parser.parse('graph TD\nA-->B\nclick A "click.html" "tooltip" _blank');

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
    expect(flowParser.parser.yy.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });

  it('should handle interaction - click to a click and href link with tooltip and target', function () {
    spyOn(flowParser.parser.yy, 'setLink');
    spyOn(flowParser.parser.yy, 'setTooltip');
    const res = flowParser.parser.parse(
      'graph TD\nA-->B\nclick A href "click.html" "tooltip" _blank'
    );

    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(flowParser.parser.yy.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
    expect(flowParser.parser.yy.setTooltip).toHaveBeenCalledWith('A', 'tooltip');
  });
});
