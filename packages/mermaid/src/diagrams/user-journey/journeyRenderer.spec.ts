import { select } from 'd3';
import * as configApi from '../../config.js';
import { bounds, drawTasks } from './journeyRenderer.js';

describe('journey renderer', () => {
  afterEach(() => {
    configApi.reset();
  });

  it('should fill sections with the sectionFills configured at draw time', () => {
    const config = configApi.getConfig();
    configApi.reset({
      ...config,
      journey: { ...config.journey, sectionFills: ['#ff0000', '#00ff00'] },
    });

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

    const fills = diagram
      .selectAll('rect.journey-section')
      .nodes()
      .map((rect) => (rect as Element).getAttribute('fill'));
    expect(fills).toEqual(['#ff0000', '#00ff00']);
  });
});
