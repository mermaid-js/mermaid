import { select } from 'd3';
import * as configApi from '../../config.js';
import { bounds, drawTasks } from './journeyRenderer.js';

describe('journey renderer', () => {
  afterEach(() => {
    configApi.reset();
    configApi.setSiteConfig({});
    configApi.saveConfigFromInitialize({});
  });

  // What mermaid.initialize() does with the user's options
  const initialize = (journey: Record<string, string[]>) => {
    const options = { journey };
    configApi.saveConfigFromInitialize(options);
    configApi.setSiteConfig(options);
  };

  const draw = () => {
    document.body.innerHTML = '';
    const diagram = select(document.body).append('svg');
    bounds.init();
    drawTasks(
      diagram,
      [
        { section: 'One', task: 'Task A', score: 5, people: [] },
        { section: 'Two', task: 'Task B', score: 3, people: [] },
      ],
      0,
      'journey'
    );
    return diagram;
  };

  const styles = (selector: string, property: string) =>
    draw()
      .selectAll(selector)
      .nodes()
      .map((node) => (node as HTMLElement).style.getPropertyValue(property));

  const drawnFills = (selector: string) =>
    draw()
      .selectAll(selector)
      .nodes()
      .map((rect) => ({
        attr: (rect as SVGElement).getAttribute('fill'),
        style: (rect as SVGElement).style.getPropertyValue('fill'),
      }));

  it('should fill sections and tasks with the sectionFills the user set, also as a style', () => {
    initialize({ sectionFills: ['#ff0000', '#00ff00'] });

    const expected = [
      { attr: '#ff0000', style: '#ff0000' },
      { attr: '#00ff00', style: '#00ff00' },
    ];
    expect(drawnFills('rect.journey-section')).toEqual(expected);
    expect(drawnFills('rect.task')).toEqual(expected);
  });

  it('should leave the theme in charge of the fill when sectionFills is not set', () => {
    expect(styles('rect.journey-section', 'fill')).toEqual(['', '']);
  });

  it('should keep the default fills when sectionFills is empty', () => {
    initialize({ sectionFills: [] });

    expect(drawnFills('rect.journey-section')).toEqual([
      { attr: '#191970', style: '' },
      { attr: '#8B008B', style: '' },
    ]);
  });

  it('should colour section and task labels with the sectionColours the user set', () => {
    initialize({ sectionColours: ['red'] });

    // Two sections and two tasks, each an HTML label with an SVG text fallback
    expect(styles('div.label', 'color')).toEqual(['red', 'red', 'red', 'red']);
    expect(styles('switch text', 'fill')).toEqual(['red', 'red', 'red', 'red']);
  });

  it('should leave the theme in charge of label colours when sectionColours is not set', () => {
    expect(styles('div.label', 'color')).toEqual(['', '', '', '']);
  });
});
