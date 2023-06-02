import svgDraw from './svgDraw.js';

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
        type: 'T~TT~',
        label: 'Car',
      };

      let actual = svgDraw.getClassTitleString(classDef);
      expect(actual).toBe('Car<T<T>>');
    });
  });
  describe('when class has no members, ', function () {
    it('should have no members', function () {
      const str = 'class Class10';
      let actual = svgDraw.drawClass(str);

      expect(actual.displayText).toBe('');
    });
  });
});
