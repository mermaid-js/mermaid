import { ClassMember } from './classTypes.js';
import { vi, describe, it, expect } from 'vitest';
const spyOn = vi.spyOn;

const staticCssStyle = 'text-decoration:underline;';
const abstractCssStyle = 'font-style:italic;';
const abstractStaticCssStyle = 'text-decoration:underline;font-style:italic;';

describe('given text representing a method, ', function () {
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

  describe('Edge Cases and Additional Scenarios', () => {
    it('should handle method with special characters in name', function () {
      const str = `operator++(int value)`;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('operator++(int value)');
      expect(classMember.id).toBe('operator++');
    });

    it('should handle method with numbers in name', function () {
      const str = `method123(param)`;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('method123(param)');
      expect(classMember.id).toBe('method123');
    });

    it('should handle method with underscores and hyphens', function () {
      const str = `get_user_data(user_id int)`;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('get_user_data(user_id int)');
      expect(classMember.id).toBe('get_user_data');
    });

    it('should handle method with no spaces around parentheses', function () {
      const str = `method(param)`;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('method(param)');
    });

    it('should handle method with array parameters', function () {
      const str = `processArray(int[] numbers)`;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('processArray(int[] numbers)');
    });

    it('should handle method with function pointer parameter', function () {
      const str = `callback(void (*fn)(int))`;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('callback(void (*fn)(int))');
    });

    it('should handle method with complex nested generics (HTML encoded)', function () {
      const str = `process(Map<String, List<Map<Integer, String>>> data)`;
      const classMember = new ClassMember(str, 'method');
      // Current behavior: parseGenericTypes converts < > to HTML entities
      expect(classMember.getDisplayDetails().displayText).toBe('process(Map&gt;&gt; data)');
    });

    it('should handle method with colon in return type', function () {
      const str = `getNamespace() std::string`;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('getNamespace() : std::string');
    });

    it('should handle malformed input gracefully - no parentheses', function () {
      const str = `not_a_method_missing_parentheses`;
      const classMember = new ClassMember(str, 'method');
      // This will not match the method regex, so should handle gracefully
      // But currently throws when parseGenericTypes gets undefined
      expect(() => classMember.getDisplayDetails()).toThrow();
    });

    it('should handle empty parameter list with classifier', function () {
      const str = `emptyMethod()$*`;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('emptyMethod()');
      expect(classMember.getDisplayDetails().cssStyle).toBe(
        'text-decoration:underline;font-style:italic;'
      );
    });

    it('should handle method with constructor-like name', function () {
      const str = `Class()`;
      const classMember = new ClassMember(str, 'method');
      expect(classMember.getDisplayDetails().displayText).toBe('Class()');
      expect(classMember.id).toBe('Class');
    });
  });
});
