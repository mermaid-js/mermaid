import { select } from 'd3';
import * as configApi from '../../config.js';
import { bounds, drawTasks } from './journeyRenderer.js';

describe('journey renderer', () => {
  afterEach(() => {
    configApi.reset();
    configApi.setSiteConfig({});
    configApi.saveConfigFromInitialize({});
  });

  const drawnFills = (selector: string) => {
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

    return diagram
      .selectAll(selector)
      .nodes()
      .map((rect) => ({
        attr: (rect as SVGElement).getAttribute('fill'),
        style: (rect as SVGElement).style.getPropertyValue('fill'),
      }));
  };

  it('should fill sections and tasks with the sectionFills the user set, also as a style', () => {
    // What mermaid.initialize() does with the user's options
    const options = { journey: { sectionFills: ['#ff0000', '#00ff00'] } };
    configApi.saveConfigFromInitialize(options);
    configApi.setSiteConfig(options);

    const expected = [
      { attr: '#ff0000', style: '#ff0000' },
      { attr: '#00ff00', style: '#00ff00' },
    ];
    expect(drawnFills('rect.journey-section')).toEqual(expected);
    expect(drawnFills('rect.task')).toEqual(expected);
  });

  it('should leave the theme in charge of the fill when sectionFills is not set', () => {
    const styles = drawnFills('rect.journey-section').map(({ style }) => style);
    expect(styles).toEqual(['', '']);
  });
});
