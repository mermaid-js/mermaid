import { describe, expect, it } from 'vitest';

import { treeViewParse as parse } from './test-util.js';

describe('treeView', () => {
  describe('Parsing with Accessibility Titles and Descriptions', () => {
    it('should parse accessibility titles', () => {
      const result = parse(`treeView\n  accTitle: Accessible Graph\n  item\n`);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.accTitle).toBe('Accessible Graph');
    });

    it('should parse multiline accessibility descriptions', () => {
      const result = parse(
        `treeView\n  accDescr {\n    Detailed description\n    across multiple lines\n  }\n  item\n`
      );
      expect(result.value.accDescr).toBe('Detailed description\nacross multiple lines');
    });
  });
});
