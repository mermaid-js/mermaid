import { ClassMember } from './classTypes.js';
import { vi, describe, it, expect } from 'vitest';
const spyOn = vi.spyOn;

describe('given text representing member declaration, ', function () {
  describe('when text is a method with no parameters', function () {
    it('should parse simple method', function () {
      const str = `getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should parse public visibiity', function () {
      const str = `+getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTime()');
    });

    it('should parse private visibiity', function () {
      const str = `-getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTime()');
    });

    it('should parse protected visibiity', function () {
      const str = `#getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTime()');
    });

    it('should parse internal visibiity', function () {
      const str = `~getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTime()');
    });

    it('should return correct css for static classifier', function () {
      const str = `getTime()$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
      expect(classMember.getDisplayDetails().cssStyle).toBe('text-decoration:underline;');
    });

    it('should return correct css for abstrtact', function () {
      const str = `getTime()*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
      expect(classMember.getDisplayDetails().cssStyle).toBe('font-style:italic;');
    });
  });

  describe('when text is a method with parameters', function () {
    it('should parse method with parameter type, as provided', function () {
      const str = `getTime(String)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should parse method with parameter type and name, as provided', function () {
      const str = `getTime(String time)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should parse method with parameters, as provided', function () {
      const str = `getTime(String time, date Date)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should return correct css for static method with parameter type, as provided', function () {
      const str = `getTime(String)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(String)');
      expect(classMember.getDisplayDetails().cssStyle).toBe('text-decoration:underline;');
    });

    it('should return correct css for static method with parameter type and name, as provided', function () {
      const str = `getTime(String time)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time)');
      expect(classMember.getDisplayDetails().cssStyle).toBe('text-decoration:underline;');
    });

    it('should return correct css for static method with parameters, as provided', function () {
      const str = `getTime(String time, date Date)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time, date Date)');
      expect(classMember.getDisplayDetails().cssStyle).toBe('text-decoration:underline;');
    });

    it('should return correct css for abstract method with parameter type, as provided', function () {
      const str = `getTime(String)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(String)');
      expect(classMember.getDisplayDetails().cssStyle).toBe('font-style:italic;');
    });

    it('should return correct css for abstract method with parameter type and name, as provided', function () {
      const str = `getTime(String time)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time)');
      expect(classMember.getDisplayDetails().cssStyle).toBe('font-style:italic;');
    });

    it('should return correct css for abstract method with parameters, as provided', function () {
      const str = `getTime(String time, date Date)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time, date Date)');
      expect(classMember.getDisplayDetails().cssStyle).toBe('font-style:italic;');
    });
  });

  describe('when text is a method with return type', function () {
    it('should parse simple method with no parameter', function () {
      const str = `getTime() String`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should parse method with parameter type, as provided', function () {
      const str = `getTime(String) String`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should parse method with parameter type and name, as provided', function () {
      const str = `getTime(String time) String`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should parse method with parameters, as provided', function () {
      const str = `getTime(String time, date Date) String`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should return correct css for static method with no parameter', function () {
      const str = `getTime() String$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime() String');
      expect(classMember.getDisplayDetails().cssStyle).toBe('text-decoration:underline;');
    });

    it('should return correct css for static method with parameter type and name, as provided', function () {
      const str = `getTime(String time) String$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time) String');
      expect(classMember.getDisplayDetails().cssStyle).toBe('text-decoration:underline;');
    });

    it('should return correct css for static method with parameters, as provided', function () {
      const str = `getTime(String time, date Date)$ String`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        'getTime(String time, date Date) String'
      );
      expect(classMember.getDisplayDetails().cssStyle).toBe('text-decoration:underline;');
    });

    it('should return correct css for abstract method with parameter type, as provided', function () {
      const str = `getTime(String) String*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(String) String');
      expect(classMember.getDisplayDetails().cssStyle).toBe('font-style:italic;');
    });

    it('should return correct css for abstract method with parameter type and name, as provided', function () {
      const str = `getTime(String time) String*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time) String');
      expect(classMember.getDisplayDetails().cssStyle).toBe('font-style:italic;');
    });

    it('should return correct css for abstract method with parameters, as provided', function () {
      const str = `getTime(String time, date Date) String*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        'getTime(String time, date Date) String'
      );
      expect(classMember.getDisplayDetails().cssStyle).toBe('font-style:italic;');
    });
  });
});
