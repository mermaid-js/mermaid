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
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes(List<T>)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('when method parameter contains two generic', function () {
    it('should parse correctly', function () {
      const str = `getTimes(List~T~, List~OT~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes(List<T>, List<OT>)');
    });

    it('should handle public visibility', function () {
      const str = `+getTimes(List~T~, List~OT~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('+getTimes(List<T>, List<OT>)');
    });

    it('should handle private visibility', function () {
      const str = `-getTimes(List~T~, List~OT~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('-getTimes(List<T>, List<OT>)');
    });

    it('should handle protected visibility', function () {
      const str = `#getTimes(List~T~, List~OT~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('#getTimes(List<T>, List<OT>)');
    });

    it('should handle internal visibility', function () {
      const str = `~getTimes(List~T~, List~OT~)`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('~getTimes(List<T>, List<OT>)');
    });

    it('should return correct css for static classifier', function () {
      const str = `getTimes(List~T~, List~OT~)$`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes(List<T>, List<OT>)');
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should return correct css for abstract classifier', function () {
      const str = `getTimes(List~T~, List~OT~)*`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes(List<T>, List<OT>)');
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
      expect(classMember.getDisplayDetails().displayText).toBe('getTimes() : List<T>');
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

  describe('--uncategorized tests--', function () {
    it('member name should handle double colons', function () {
      const str = `std::map ~int,string~ pMap;`;

      const classMember = new ClassMember(str, 'attribute');
      expect(classMember.getDisplayDetails().displayText).toBe('std::map <int,string> pMap;');
    });

    it('member name should handle generic type', function () {
      const str = `getTime~T~(this T, int seconds)$ DateTime`;

      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe(
        'getTime<T>(this T, int seconds) : DateTime'
      );
      expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });
  });
});

describe('given text representing an attribute', () => {
  describe('when the attribute has no modifiers', () => {
    it('should parse the display text correctly', () => {
      const str = 'name String';

      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('name String');
      expect(displayDetails.cssStyle).toBe('');
    });
  });

  describe('when the attribute has public "+" modifier', () => {
    it('should parse the display text correctly', () => {
      const str = '+name String';

      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+name String');
      expect(displayDetails.cssStyle).toBe('');
    });
  });

  describe('when the attribute has protected "#" modifier', () => {
    it('should parse the display text correctly', () => {
      const str = '#name String';

      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('#name String');
      expect(displayDetails.cssStyle).toBe('');
    });
  });

  describe('when the attribute has private "-" modifier', () => {
    it('should parse the display text correctly', () => {
      const str = '-name String';

      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('-name String');
      expect(displayDetails.cssStyle).toBe('');
    });
  });

  describe('when the attribute has internal "~" modifier', () => {
    it('should parse the display text correctly', () => {
      const str = '~name String';

      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('~name String');
      expect(displayDetails.cssStyle).toBe('');
    });
  });

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
});

describe('given a member containing a literal \\n line break (#6160), ', function () {
  it('should turn the line break into a real newline in a method member text', function () {
    const str = '+ Method(arg1:Arg1, \\n arg2:Arg2)';

    const classMember = new ClassMember(str, 'method');

    // The display text used by the renderer must carry a real newline so the
    // markdown pipeline renders a line break instead of the literal "\n".
    expect(classMember.text).toBe('\\+ Method(arg1:Arg1, \n arg2:Arg2)');
    expect(classMember.text).not.toContain('\\n');
  });

  it('should turn the line break into a real newline in an attribute member text', function () {
    const str = '+longFieldName \\n continued';

    const classMember = new ClassMember(str, 'attribute');

    expect(classMember.text).toBe('\\+longFieldName \n continued');
    expect(classMember.text).not.toContain('\\n');
  });

  it('should turn every literal \\n into a real newline', function () {
    const str = '+ Method(\\n arg1:Arg1, \\n arg2:Arg2)';

    const classMember = new ClassMember(str, 'method');

    expect(classMember.text).toBe('\\+ Method(\n arg1:Arg1, \n arg2:Arg2)');
  });

  it('should not turn an escaped backslash into a line break', function () {
    // Input carries two backslashes followed by "n": no real newline may appear.
    const str = '+ Method(a\\\\n b)';

    const classMember = new ClassMember(str, 'method');

    expect(classMember.text).not.toContain('\n');
    expect(classMember.text).toContain('\\\\n');
  });

  it('should leave KaTeX commands inside $$...$$ spans untouched', function () {
    // "\nabla" starts with a literal "\n" sequence, but it is a KaTeX command,
    // not a line break: converting it would insert a real newline that
    // katexRegex cannot span, so KaTeX rendering would be lost.
    const str = '+field $$\\nabla f$$';

    const classMember = new ClassMember(str, 'attribute');

    expect(classMember.text).toContain('$$\\nabla f$$');
    expect(classMember.text).not.toContain('\n');
  });

  it('should still convert a literal \\n outside a $$...$$ span', function () {
    const str = '+field $$\\nabla f$$ \\n continued';

    const classMember = new ClassMember(str, 'attribute');

    expect(classMember.text).toContain('$$\\nabla f$$');
    expect(classMember.text).toContain('\n');
  });
});
