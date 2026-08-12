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

  it('should handle interaction - click on a subgraph to a link (#5428)', function () {
    const res = flow.parser.parse(
      'flowchart LR\nsubgraph machine\ngoogle-->results\nend\nhuman-->google\nclick machine "google.pl"'
    );

    const subGraphs = flow.parser.yy.getSubGraphs();
    const machine = subGraphs.find((sg) => sg.id === 'machine');
    expect(machine).toBeDefined();
    expect(machine.link).toBe('google.pl');
    expect(machine.classes).toContain('clickable');

    // The link must also be surfaced on the rendered subgraph (group) node.
    const { nodes } = flow.parser.yy.getData();
    const machineNode = nodes.find((n) => n.id === 'machine');
    expect(machineNode.isGroup).toBe(true);
    expect(machineNode.link).toBe('google.pl');
    expect(machineNode.cssClasses).toContain('clickable');
  });

  it('should handle interaction - click on a subgraph to a link with target', function () {
    const res = flow.parser.parse(
      'flowchart LR\nsubgraph machine\ngoogle-->results\nend\nclick machine "google.pl" _blank'
    );

    const subGraphs = flow.parser.yy.getSubGraphs();
    const machine = subGraphs.find((sg) => sg.id === 'machine');
    expect(machine.link).toBe('google.pl');
    expect(machine.linkTarget).toBe('_blank');
  });
});
