import { describe, it, expect } from 'vitest';
import { ClassMember } from './classTypes.js';

describe('ClassTypes - Enhanced Abstract and Static Combinations', () => {
  // Test constants to match original test structure
  const staticCssStyle = 'text-decoration:underline;';
  const abstractCssStyle = 'font-style:italic;';
  const abstractStaticCssStyle = 'text-decoration:underline;font-style:italic;';

  describe('Enhanced parseClassifier functionality', () => {
    describe('when the attribute has static "$" modifier', () => {
      it('should parse the display text correctly and apply static css style', () => {
        const str = 'name String$';

        const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

        expect(displayDetails.displayText).toBe('name String');
        expect(displayDetails.cssStyle).toBe(staticCssStyle);
      });
    });

    describe('when the attribute has abstract "*" modifier', () => {
      it('should parse the display text correctly and apply abstract css style', () => {
        const str = 'name String*';

        const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

        expect(displayDetails.displayText).toBe('name String');
        expect(displayDetails.cssStyle).toBe(abstractCssStyle);
      });
    });

    describe('when the attribute has abstract static "*$" modifier', () => {
      it('should parse the display text correctly and apply abstract static css style', () => {
        const str = 'name String*$';

        const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

        expect(displayDetails.displayText).toBe('name String');
        expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
      });
    });

    describe('when the attribute has static abstract "$*" modifier', () => {
      it('should parse the display text correctly and apply abstract static css style', () => {
        const str = 'name String$*';

        const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

        expect(displayDetails.displayText).toBe('name String');
        expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
      });

      it('should handle abstract and static combined (*$) on methods', () => {
        const str = 'getTime()*$';
        const classMember = new ClassMember(str, 'method');
        const details = classMember.getDisplayDetails();

        expect(details.displayText).toBe('getTime()');
        expect(details.cssStyle).toBe(abstractStaticCssStyle);
      });

      it('should handle static and abstract combined ($*) on methods', () => {
        const str = 'getTime()$*';
        const classMember = new ClassMember(str, 'method');
        const details = classMember.getDisplayDetails();

        expect(details.displayText).toBe('getTime()');
        expect(details.cssStyle).toBe(abstractStaticCssStyle);
      });

      it('should handle abstract and static combined (*$) on attributes', () => {
        const str = 'data String*$';
        const classMember = new ClassMember(str, 'attribute');
        const details = classMember.getDisplayDetails();

        expect(details.displayText).toBe('data String');
        expect(details.cssStyle).toBe(abstractStaticCssStyle);
      });

      it('should handle static and abstract combined ($*) on attributes', () => {
        const str = 'data String$*';
        const classMember = new ClassMember(str, 'attribute');
        const details = classMember.getDisplayDetails();

        expect(details.displayText).toBe('data String');
        expect(details.cssStyle).toBe(abstractStaticCssStyle);
      });

      it('should handle complex method with abstract static combination', () => {
        const str = '+processData(Map~String, List~Integer~~) Optional~Result~*$';
        const classMember = new ClassMember(str, 'method');
        const details = classMember.getDisplayDetails();

        expect(details.displayText).toBe(
          '+processData(Map~String, List<Integer~>) : Optional<Result>'
        );
        expect(details.cssStyle).toBe(abstractStaticCssStyle);
      });

      it('should handle attribute with visibility and abstract static combination', () => {
        const str = '#config Settings$*';
        const classMember = new ClassMember(str, 'attribute');
        const details = classMember.getDisplayDetails();

        expect(details.displayText).toBe('#config Settings');
        expect(details.cssStyle).toBe(abstractStaticCssStyle);
      });

      // Verify existing classifier functionality still works
      it('should still handle single static classifier correctly', () => {
        const str = 'getName()$';
        const classMember = new ClassMember(str, 'method');
        const details = classMember.getDisplayDetails();

        expect(details.displayText).toBe('getName()');
        expect(details.cssStyle).toBe(staticCssStyle);
      });

      it('should still handle single abstract classifier correctly', () => {
        const str = 'name String*';
        const classMember = new ClassMember(str, 'attribute');
        const details = classMember.getDisplayDetails();

        expect(details.displayText).toBe('name String');
        expect(details.cssStyle).toBe(abstractCssStyle);
      });

      it('should handle empty classifier correctly', () => {
        const str = 'getValue()';
        const classMember = new ClassMember(str, 'method');
        const details = classMember.getDisplayDetails();

        expect(details.displayText).toBe('getValue()');
        expect(details.cssStyle).toBe('');
      });
    });
    it('should return correct css for static classifier', function () {
      const str = `getTime()$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTime()*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });

    it('should return correct css for abstract static classifier', function () {
      const str = `getTime()*$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should return correct css for static abstract classifier', function () {
      const str = `getTime()$*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractStaticCssStyle);
    });
  });
});
