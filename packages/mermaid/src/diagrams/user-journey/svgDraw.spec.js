import { select } from 'd3';
import { drawTask } from './svgDraw.js';

describe('journey svgDraw', () => {
  describe('drawTask', () => {
    const conf = { width: 150, height: 50, textPlacement: 'old' };

    const drawFaceForScore = (score) => {
      document.body.innerHTML = '<svg id="journey"></svg>';
      const task = { x: 0, y: 60, score, people: [], actors: {}, task: 'Task', num: 0 };
      drawTask(select('#journey'), task, conf, 'journey');
      return Number(document.querySelector('circle.face').getAttribute('cy'));
    };

    it.each([1, 2, 3, 4, 5])('should place a face with score %i on the score axis', (score) => {
      expect(drawFaceForScore(score)).toBe(300 + (5 - score) * 30);
    });

    it.each([6, 8, 13])('should place a face with score %i at the score 5 position', (score) => {
      expect(drawFaceForScore(score)).toBe(drawFaceForScore(5));
    });

    it.each([0, -2])('should place a face with score %i at the score 1 position', (score) => {
      expect(drawFaceForScore(score)).toBe(drawFaceForScore(1));
    });
  });
});
