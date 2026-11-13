import svgDraw from './svgDraw.js';
import { JSDOM } from 'jsdom';

describe('given a string representing a class, ', function () {
  describe('when class name includes generic, ', function () {
    it('should return correct text for generic', function () {
      const classDef = {
        id: 'Car',
        type: 'T',
        label: 'Car',
      };

      let actual = svgDraw.getClassTitleString(classDef);
      expect(actual).toBe('Car<T>');
    });
    it('should return correct text for nested generics', function () {
      const classDef = {
        id: 'Car',
        type: 'T~T~',
        label: 'Car',
      };

      let actual = svgDraw.getClassTitleString(classDef);
      expect(actual).toBe('Car<T<T>>');
    });
  });
});
