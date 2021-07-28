import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

const spyOn = jest.spyOn;

setConfig({
  securityLevel: 'strict'
});

describe('[Interactions] when parsing', () => {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('it should be possible to use click to a callback', function() {
    spyOn(flowDb, 'setClickEvent');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A callback');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback');
  });

  it('it should be possible to use click to a click and call callback', function() {
    spyOn(flowDb, 'setClickEvent');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A call callback()');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback');
  });

  it('it should be possible to use click to a callback with toolip', function() {
    spyOn(flowDb, 'setClickEvent');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A callback "tooltip"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A','tooltip');
  });

  it('it should be possible to use click to a click and call callback with toolip', function() {
    spyOn(flowDb, 'setClickEvent');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A call callback() "tooltip"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A','tooltip');
  });

  it('it should be possible to use click to a callback with an arbitrary number of args', function() {
      spyOn(flowDb, 'setClickEvent');
      const res = flow.parser.parse('graph TD\nA-->B\nclick A call callback("test0", test1, test2)');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(flowDb.setClickEvent).toHaveBeenCalledWith('A', 'callback','"test0", test1, test2');
    });

  it('should handle interaction - click to a link', function() {
    spyOn(flowDb, 'setLink');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
  });

  it('should handle interaction - click to a click and href link', function() {
    spyOn(flowDb, 'setLink');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A href "click.html"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
  });

  it('should handle interaction - click to a link with tooltip', function() {
    spyOn(flowDb, 'setLink');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html" "tooltip"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A','tooltip');
  });

  it('should handle interaction - click to a click and href link with tooltip', function() {
    spyOn(flowDb, 'setLink');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A href "click.html" "tooltip"');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A','tooltip');
  });

  it('should handle interaction - click to a link with target', function() {
    spyOn(flowDb, 'setLink');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html" _blank');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
  });

  it('should handle interaction - click to a click and href link with target', function() {
    spyOn(flowDb, 'setLink');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A href "click.html" _blank');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
  });

  it('should handle interaction - click to a link with tooltip and target', function() {
    spyOn(flowDb, 'setLink');
    spyOn(flowDb, 'setTooltip');
    const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html" "tooltip" _blank');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
    expect(flowDb.setTooltip).toHaveBeenCalledWith('A','tooltip');
  });

  it('should handle interaction - click to a click and href link with tooltip and target', function() {
      spyOn(flowDb, 'setLink');
      spyOn(flowDb, 'setTooltip');
      const res = flow.parser.parse('graph TD\nA-->B\nclick A href "click.html" "tooltip" _blank');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(flowDb.setLink).toHaveBeenCalledWith('A', 'click.html', '_blank');
      expect(flowDb.setTooltip).toHaveBeenCalledWith('A','tooltip');
    });

});
