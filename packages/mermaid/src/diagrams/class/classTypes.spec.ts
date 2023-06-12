import { ClassMember } from './classTypes.js';
import { vi, describe, it, expect } from 'vitest';
const spyOn = vi.spyOn;

const staticCssStyle = 'text-decoration:underline;';
const abstractCssStyle = 'font-style:italic;';

describe('given text representing a method, ', function () {
  describe('when method has no parameters', function () {
    it('should parse correctly', function () {
      const str = `getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should handle public visibility', function () {
      const str = `+getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTime()');
    });

    it('should handle private visibility', function () {
      const str = `-getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTime()');
    });

    it('should handle protected visibility', function () {
      const str = `#getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTime()');
    });

    it('should handle internal visibility', function () {
      const str = `~getTime()`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTime()');
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
  });

  describe('when method has single parameter value', function () {
    it('should parse correctly', function () {
      const str = `getTime(int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should handle public visibility', function () {
      const str = `+getTime(int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTime(int)');
    });

    it('should handle private visibility', function () {
      const str = `-getTime(int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTime(int)');
    });

    it('should handle protected visibility', function () {
      const str = `#getTime(int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTime(int)');
    });

    it('should handle internal visibility', function () {
      const str = `~getTime(int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTime(int)');
    });

    it('should return correct css for static classifier', function () {
      const str = `getTime(int)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(int)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTime(int)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(int)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method has single parameter type and name (type first)', function () {
    it('should parse correctly', function () {
      const str = `getTime(int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should handle public visibility', function () {
      const str = `+getTime(int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTime(int count)');
    });

    it('should handle private visibility', function () {
      const str = `-getTime(int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTime(int count)');
    });

    it('should handle protected visibility', function () {
      const str = `#getTime(int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTime(int count)');
    });

    it('should handle internal visibility', function () {
      const str = `~getTime(int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTime(int count)');
    });

    it('should return correct css for static classifier', function () {
      const str = `getTime(int count)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(int count)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTime(int count)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(int count)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method has single parameter type and name (name first)', function () {
    it('should parse correctly', function () {
      const str = `getTime(count int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should handle public visibility', function () {
      const str = `+getTime(count int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTime(count int)');
    });

    it('should handle private visibility', function () {
      const str = `-getTime(count int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTime(count int)');
    });

    it('should handle protected visibility', function () {
      const str = `#getTime(count int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTime(count int)');
    });

    it('should handle internal visibility', function () {
      const str = `~getTime(count int)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTime(count int)');
    });

    it('should return correct css for static classifier', function () {
      const str = `getTime(count int)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(count int)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTime(count int)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(count int)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method has multiple parameters', function () {
    it('should parse correctly', function () {
      const str = `getTime(string text, int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should handle public visibility', function () {
      const str = `+getTime(string text, int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should handle private visibility', function () {
      const str = `-getTime(string text, int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should handle protected visibility', function () {
      const str = `#getTime(string text, int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should handle internal visibility', function () {
      const str = `~getTime(string text, int count)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(str);
    });

    it('should return correct css for static classifier', function () {
      const str = `getTime(string text, int count)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(string text, int count)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTime(string text, int count)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime(string text, int count)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method has return type', function () {
    it('should parse correctly', function () {
      const str = `getTime() DateTime`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime() : DateTime');
    });

    it('should handle public visibility', function () {
      const str = `+getTime() DateTime`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTime() : DateTime');
    });

    it('should handle private visibility', function () {
      const str = `-getTime() DateTime`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTime() : DateTime');
    });

    it('should handle protected visibility', function () {
      const str = `#getTime() DateTime`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTime() : DateTime');
    });

    it('should handle internal visibility', function () {
      const str = `~getTime() DateTime`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTime() : DateTime');
    });

    it('should return correct css for static classifier', function () {
      const str = `getTime() DateTime$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime() : DateTime');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTime()  DateTime*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTime() : DateTime');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method parameter is generic', function () {
    it('should parse correctly', function () {
      const str = `getTimes(List~T~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes(List<T>)');
    });

    it('should handle public visibility', function () {
      const str = `+getTimes(List~T~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTimes(List<T>)');
    });

    it('should handle private visibility', function () {
      const str = `-getTimes(List~T~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTimes(List<T>)');
    });

    it('should handle protected visibility', function () {
      const str = `#getTimes(List~T~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTimes(List<T>)');
    });

    it('should handle internal visibility', function () {
      const str = `~getTimes(List~T~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTimes(List<T>)');
    });

    it('should return correct css for static classifier', function () {
      const str = `getTimes(List~T~)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes(List<T>)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTimes(List~T~)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes(List>List<T>>)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method parameter is a nested generic', function () {
    it('should parse correctly', function () {
      const str = `getTimetableList(List~List~T~~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimetableList(List<List<T>>)');
    });

    it('should handle public visibility', function () {
      const str = `+getTimetableList(List~List~T~~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTimetableList(List<List<T>>)');
    });

    it('should handle private visibility', function () {
      const str = `-getTimetableList(List~List~T~~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTimetableList(List<List<T>>)');
    });

    it('should handle protected visibility', function () {
      const str = `#getTimetableList(List~List~T~~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTimetableList(List<List<T>>)');
    });

    it('should handle internal visibility', function () {
      const str = `~getTimetableList(List~List~T~~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTimetableList(List<List<T>>)');
    });

    it('should return correct css for static classifier', function () {
      const str = `getTimetableList(List~List~T~~)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimetableList(List<List<T>>)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTimetableList(List~List~T~~)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimetableList(List<List<T>>)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method parameter is a composite generic', function () {
    const methodNameAndParameters = 'getTimes(List~K, V~)';
    const expectedMethodNameAndParameters = 'getTimes(List<K, V>)';
    it('should parse correctly', function () {
      const str = methodNameAndParameters;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(expectedMethodNameAndParameters);
    });

    it('should handle public visibility', function () {
      const str = '+' + methodNameAndParameters;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        '+' + expectedMethodNameAndParameters
      );
    });

    it('should handle private visibility', function () {
      const str = '-' + methodNameAndParameters;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        '-' + expectedMethodNameAndParameters
      );
    });

    it('should handle protected visibility', function () {
      const str = '#' + methodNameAndParameters;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        '#' + expectedMethodNameAndParameters
      );
    });

    it('should handle internal visibility', function () {
      const str = '~' + methodNameAndParameters;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        '~' + expectedMethodNameAndParameters
      );
    });

    it('should return correct css for static classifier', function () {
      const str = methodNameAndParameters + '$';
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(expectedMethodNameAndParameters);
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = methodNameAndParameters + '*';
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(expectedMethodNameAndParameters);
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method return type is generic', function () {
    it('should parse correctly', function () {
      const str = `getTimes() List~T~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes() : List<T>');
    });

    it('should handle public visibility', function () {
      const str = `+getTimes() List~T~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTimes() : List<T>');
    });

    it('should handle private visibility', function () {
      const str = `-getTimes() List~T~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTimes() : List<T>');
    });

    it('should handle protected visibility', function () {
      const str = `#getTimes() List~T~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTimes() : List<T>');
    });

    it('should handle internal visibility', function () {
      const str = `~getTimes() List~T~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTimes() : List<T>');
    });

    it('should return correct css for static classifier', function () {
      const str = `getTimes() List~T~$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes() : List<T>');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTimes() List~T~*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes() : List<T>)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method return type is a nested generic', function () {
    it('should parse correctly', function () {
      const str = `getTimetableList() List~List~T~~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        'getTimetableList() : List<List<T>>'
      );
    });

    it('should handle public visibility', function () {
      const str = `+getTimetableList() List~List~T~~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        '+getTimetableList() : List<List<T>>'
      );
    });

    it('should handle private visibility', function () {
      const str = `-getTimetableList() List~List~T~~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        '-getTimetableList() : List<List<T>>'
      );
    });

    it('should handle protected visibility', function () {
      const str = `#getTimetableList() List~List~T~~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        '#getTimetableList() : List<List<T>>'
      );
    });

    it('should handle internal visibility', function () {
      const str = `~getTimetableList() List~List~T~~`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        '~getTimetableList() : List<List<T>>'
      );
    });

    it('should return correct css for static classifier', function () {
      const str = `getTimetableList() List~List~T~~$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        'getTimetableList() : List<List<T>>'
      );
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTimetableList() List~List~T~~*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        'getTimetableList() : List<List<T>>'
      );
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });
});
