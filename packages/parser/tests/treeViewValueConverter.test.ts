import type { CstNode, GrammarAST } from 'langium';
import { describe, expect, it } from 'vitest';
import { TreeViewValueConverter } from '../src/language/treeView/valueConverter.js';

/**
 * Subclass that exposes the protected runCustomConverter for testing.
 */
class TestableTreeViewValueConverter extends TreeViewValueConverter {
  public runCustomConverter(rule: GrammarAST.AbstractRule, input: string, cstNode: CstNode) {
    return super.runCustomConverter(rule, input, cstNode);
  }
}

function convert(converter: TestableTreeViewValueConverter, ruleName: string, input: string) {
  const fakeRule = { name: ruleName } as unknown as GrammarAST.AbstractRule;
  const fakeCstNode = {} as unknown as CstNode;
  return converter.runCustomConverter(fakeRule, input, fakeCstNode);
}

describe('TreeViewValueConverter', () => {
  const converter = new TestableTreeViewValueConverter();

  describe('INDENTATION', () => {
    it('should return the length of whitespace', () => {
      expect(convert(converter, 'INDENTATION', '    ')).toBe(4);
    });

    it('should return 0 for empty string', () => {
      expect(convert(converter, 'INDENTATION', '')).toBe(0);
    });

    it('should return 8 for 8 spaces', () => {
      expect(convert(converter, 'INDENTATION', '        ')).toBe(8);
    });
  });

  describe('QUOTED_NAME', () => {
    it('should strip double quotes', () => {
      expect(convert(converter, 'QUOTED_NAME', '"my file.js"')).toBe('my file.js');
    });

    it('should strip single quotes', () => {
      expect(convert(converter, 'QUOTED_NAME', "'my folder/'")).toBe('my folder/');
    });

    it('should handle empty quoted string', () => {
      expect(convert(converter, 'QUOTED_NAME', '""')).toBe('');
    });
  });

  describe('CLASS_ANNOTATION', () => {
    it('should extract class name', () => {
      expect(convert(converter, 'CLASS_ANNOTATION', ' :::highlight')).toBe('highlight');
    });

    it('should handle class with hyphens', () => {
      expect(convert(converter, 'CLASS_ANNOTATION', ' :::my-class')).toBe('my-class');
    });

    it('should trim surrounding whitespace', () => {
      expect(convert(converter, 'CLASS_ANNOTATION', '  :::highlight  ')).toBe('highlight');
    });
  });

  describe('ICON_ANNOTATION', () => {
    it('should extract icon name', () => {
      expect(convert(converter, 'ICON_ANNOTATION', ' icon(database)')).toBe('database');
    });

    it('should return empty string for icon()', () => {
      expect(convert(converter, 'ICON_ANNOTATION', ' icon()')).toBe('');
    });

    it('should handle icon(none)', () => {
      expect(convert(converter, 'ICON_ANNOTATION', ' icon(none)')).toBe('none');
    });
  });

  describe('DESC_ANNOTATION', () => {
    it('should extract description text', () => {
      expect(convert(converter, 'DESC_ANNOTATION', ' ## entry point')).toBe('entry point');
    });

    it('should trim whitespace', () => {
      expect(convert(converter, 'DESC_ANNOTATION', '  ## my description  ')).toBe('my description');
    });

    it('should handle ## with no trailing text', () => {
      expect(convert(converter, 'DESC_ANNOTATION', ' ##')).toBe('');
    });
  });

  describe('unknown rules', () => {
    it('should return undefined for unrecognized rule names', () => {
      expect(convert(converter, 'UNKNOWN_RULE', 'anything')).toBeUndefined();
    });
  });
});
