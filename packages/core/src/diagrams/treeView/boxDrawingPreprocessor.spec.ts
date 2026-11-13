import { describe, expect, it } from 'vitest';
import {
  isBoxDrawingFormat,
  preprocessBoxDrawing,
  remapErrorLines,
} from './boxDrawingPreprocessor.js';

describe('boxDrawingPreprocessor', () => {
  describe('isBoxDrawingFormat', () => {
    it('should detect standard box-drawing characters', () => {
      expect(isBoxDrawingFormat(['├── file.txt', '└── other.txt'])).toBe(true);
    });

    it('should detect heavy box-drawing characters', () => {
      expect(isBoxDrawingFormat(['┣━━ file.txt', '┗━━ other.txt'])).toBe(true);
    });

    it('should detect vertical continuation character', () => {
      expect(isBoxDrawingFormat(['│   └── file.txt'])).toBe(true);
    });

    it('should return false for indent-only lines', () => {
      expect(isBoxDrawingFormat(['    file.txt', '        nested.txt'])).toBe(false);
    });

    it('should return false for empty lines', () => {
      expect(isBoxDrawingFormat(['', '   '])).toBe(false);
    });

    it('should return false for plain text', () => {
      expect(isBoxDrawingFormat(['root/', 'file.txt'])).toBe(false);
    });
  });

  describe('preprocessBoxDrawing', () => {
    describe('indent format passthrough', () => {
      it('should return indent-based input unchanged', () => {
        const input = 'treeView-beta\nroot/\n    src/\n        index.js';
        const result = preprocessBoxDrawing(input);
        expect(result.text).toBe(input);
        expect(result.lineMap.size).toBe(0);
      });

      it('should return input without keyword unchanged', () => {
        const input = 'not-a-keyword\nsome text';
        const result = preprocessBoxDrawing(input);
        expect(result.text).toBe(input);
        expect(result.lineMap.size).toBe(0);
      });
    });

    describe('standard tree output', () => {
      it('should convert a simple tree', () => {
        const input = [
          'treeView-beta',
          'root/',
          '├── src/',
          '│   └── index.js',
          '└── README.md',
        ].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[0]).toBe('treeView-beta');
        expect(lines[1]).toBe('root/');
        expect(lines[2]).toBe('    src/');
        expect(lines[3]).toBe('        index.js');
        expect(lines[4]).toBe('    README.md');
      });

      it('should handle a deeply nested tree', () => {
        const input = [
          'treeView-beta',
          'root/',
          '├── a/',
          '│   ├── b/',
          '│   │   ├── c/',
          '│   │   │   └── deep.txt',
          '│   │   └── d.txt',
          '│   └── e.txt',
          '└── f.txt',
        ].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[0]).toBe('treeView-beta');
        expect(lines[1]).toBe('root/');
        expect(lines[2]).toBe('    a/');
        expect(lines[3]).toBe('        b/');
        expect(lines[4]).toBe('            c/');
        expect(lines[5]).toBe('                deep.txt');
        expect(lines[6]).toBe('            d.txt');
        expect(lines[7]).toBe('        e.txt');
        expect(lines[8]).toBe('    f.txt');
      });

      it('should handle a flat list (all at depth 1)', () => {
        const input = [
          'treeView-beta',
          'root/',
          '├── file1.txt',
          '├── file2.txt',
          '└── file3.txt',
        ].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('root/');
        expect(lines[2]).toBe('    file1.txt');
        expect(lines[3]).toBe('    file2.txt');
        expect(lines[4]).toBe('    file3.txt');
      });

      it('should handle no root line (all box-drawing)', () => {
        const input = ['treeView-beta', '├── file1.txt', '└── file2.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[0]).toBe('treeView-beta');
        expect(lines[1]).toBe('    file1.txt');
        expect(lines[2]).toBe('    file2.txt');
      });
    });

    describe('space continuation after └── (last child)', () => {
      it('should handle space continuation correctly', () => {
        const input = [
          'treeView-beta',
          'root/',
          '├── a/',
          '│   └── b.txt',
          '└── c/',
          '    └── d.txt',
        ].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        // '    └── d.txt' → └ at col 4, segmentWidth=4, depth = 4/4 + 1 = 2
        expect(lines[1]).toBe('root/');
        expect(lines[2]).toBe('    a/');
        expect(lines[3]).toBe('        b.txt');
        expect(lines[4]).toBe('    c/');
        expect(lines[5]).toBe('        d.txt');
      });
    });

    describe('flexible prefix widths', () => {
      it('should handle ├─── (extra dash)', () => {
        const input = ['treeView-beta', 'root/', '├─── file.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[2]).toBe('    file.txt');
      });

      it('should handle ├── with no trailing space', () => {
        const input = ['treeView-beta', 'root/', '├──file.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[2]).toBe('    file.txt');
      });

      it('should handle ├───── (many dashes)', () => {
        const input = ['treeView-beta', 'root/', '├───── file.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[2]).toBe('    file.txt');
      });

      it('should handle └─ (minimal dash)', () => {
        const input = ['treeView-beta', 'root/', '└─ file.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[2]).toBe('    file.txt');
      });
    });

    describe('heavy Unicode variants', () => {
      it('should handle heavy box-drawing characters', () => {
        const input = [
          'treeView-beta',
          'root/',
          '┣━━ src/',
          '┃   ┗━━ index.js',
          '┗━━ README.md',
        ].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[0]).toBe('treeView-beta');
        expect(lines[1]).toBe('root/');
        expect(lines[2]).toBe('    src/');
        expect(lines[3]).toBe('        index.js');
        expect(lines[4]).toBe('    README.md');
      });

      it('should handle heavy variants with extra dashes', () => {
        const input = ['treeView-beta', 'root/', '┣━━━ file.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[2]).toBe('    file.txt');
      });
    });

    describe('annotations', () => {
      it('should preserve :::class annotation', () => {
        const input = ['treeView-beta', '├── file.txt :::highlight'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('    file.txt :::highlight');
      });

      it('should preserve icon() annotation', () => {
        const input = ['treeView-beta', '├── data.bin icon(database)'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('    data.bin icon(database)');
      });

      it('should preserve ## description annotation', () => {
        const input = ['treeView-beta', '├── index.js ## entry point'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('    index.js ## entry point');
      });

      it('should preserve all annotations combined', () => {
        const input = [
          'treeView-beta',
          '├── App.tsx :::highlight icon(react) ## main component',
        ].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('    App.tsx :::highlight icon(react) ## main component');
      });
    });

    describe('comments and blank lines', () => {
      it('should preserve %% comments', () => {
        const input = [
          'treeView-beta',
          '%% a comment',
          '├── file.txt',
          '%% another comment',
          '└── other.txt',
        ].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('%% a comment');
        expect(lines[2]).toBe('    file.txt');
        expect(lines[3]).toBe('%% another comment');
        expect(lines[4]).toBe('    other.txt');
      });

      it('should preserve blank lines', () => {
        const input = ['treeView-beta', '', '├── file.txt', '', '└── other.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('');
        expect(lines[2]).toBe('    file.txt');
        expect(lines[3]).toBe('');
        expect(lines[4]).toBe('    other.txt');
      });
    });

    describe('metadata lines', () => {
      it('should pass through title line', () => {
        const input = ['treeView-beta', 'title My Tree', '├── file.txt', '└── other.txt'].join(
          '\n'
        );

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('title My Tree');
        expect(lines[2]).toBe('    file.txt');
      });

      it('should pass through accTitle line', () => {
        const input = ['treeView-beta', 'accTitle: Accessible Title', '├── file.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('accTitle: Accessible Title');
        expect(lines[2]).toBe('    file.txt');
      });

      it('should pass through accDescr line', () => {
        const input = ['treeView-beta', 'accDescr: A description', '├── file.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[1]).toBe('accDescr: A description');
        expect(lines[2]).toBe('    file.txt');
      });
    });

    describe('decoration-only lines', () => {
      it('should skip lines with only │ characters', () => {
        const input = ['treeView-beta', 'root/', '├── a.txt', '│', '└── b.txt'].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        // The │-only line should be skipped
        expect(lines).toHaveLength(4);
        expect(lines[0]).toBe('treeView-beta');
        expect(lines[1]).toBe('root/');
        expect(lines[2]).toBe('    a.txt');
        expect(lines[3]).toBe('    b.txt');
      });
    });

    describe('line mapping', () => {
      it('should map output lines to original line numbers', () => {
        const input = [
          'treeView-beta', // line 1
          'root/', // line 2
          '├── src/', // line 3
          '│   └── index.js', // line 4
          '└── README.md', // line 5
        ].join('\n');

        const result = preprocessBoxDrawing(input);

        expect(result.lineMap.get(1)).toBe(1); // keyword
        expect(result.lineMap.get(2)).toBe(2); // root/
        expect(result.lineMap.get(3)).toBe(3); // src/
        expect(result.lineMap.get(4)).toBe(4); // index.js
        expect(result.lineMap.get(5)).toBe(5); // README.md
      });

      it('should handle skipped decoration lines in mapping', () => {
        const input = [
          'treeView-beta', // line 1
          '├── a.txt', // line 2
          '│', // line 3 (decoration, skipped)
          '└── b.txt', // line 4
        ].join('\n');

        const result = preprocessBoxDrawing(input);

        expect(result.lineMap.get(1)).toBe(1); // keyword
        expect(result.lineMap.get(2)).toBe(2); // a.txt
        expect(result.lineMap.get(3)).toBe(4); // b.txt (line 3 in output → line 4 in original)
      });
    });

    describe('error cases', () => {
      it('should throw on empty content after prefix', () => {
        const input = ['treeView-beta', '├── '].join('\n');

        expect(() => preprocessBoxDrawing(input)).toThrow(
          'Line 2: Empty node — expected a filename or directory name after the box-drawing prefix'
        );
      });

      it('should normalize tabs to spaces', () => {
        const input = ['treeView-beta', '├──\tfile.txt'].join('\n');
        const { text } = preprocessBoxDrawing(input);
        const lines = text.split('\n');
        expect(lines[1]).toBe('    file.txt');
      });

      it('should handle tab-indented box-drawing lines', () => {
        // Tab expands to 4 spaces, so `\t├──` puts the branch at column 4 → depth 2
        const input = ['treeView-beta', '├── src/', '\t├── index.ts', '\t└── utils.ts'].join('\n');
        const { text } = preprocessBoxDrawing(input);
        const lines = text.split('\n');
        expect(lines[1]).toBe('    src/');
        // depth 2 = 8 spaces of indent
        expect(lines[2]).toBe('        index.ts');
        expect(lines[3]).toBe('        utils.ts');
      });

      it('should throw on indented line without box chars in box mode', () => {
        const input = [
          'treeView-beta',
          '├── src/',
          '    index.js', // indent without box chars
          '└── README.md',
        ].join('\n');

        expect(() => preprocessBoxDrawing(input)).toThrow(
          'Line 3: Unexpected indentation without box-drawing characters'
        );
      });

      it('should include line number in empty-content error', () => {
        const input = ['treeView-beta', 'root/', '├── src/', '│   └── '].join('\n');

        expect(() => preprocessBoxDrawing(input)).toThrow('Line 4:');
      });
    });

    describe('real-world tree command output', () => {
      it('should handle typical Linux tree output', () => {
        const input = [
          'treeView-beta',
          'my-project/',
          '├── src/',
          '│   ├── components/',
          '│   │   └── MyComponent.js',
          '│   ├── index.css',
          '│   └── index.js',
          '├── package.json',
          '└── README.md',
        ].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[0]).toBe('treeView-beta');
        expect(lines[1]).toBe('my-project/');
        expect(lines[2]).toBe('    src/');
        expect(lines[3]).toBe('        components/');
        expect(lines[4]).toBe('            MyComponent.js');
        expect(lines[5]).toBe('        index.css');
        expect(lines[6]).toBe('        index.js');
        expect(lines[7]).toBe('    package.json');
        expect(lines[8]).toBe('    README.md');
      });

      it('should handle tree output with annotations', () => {
        const input = [
          'treeView-beta',
          'my-project/',
          '├── src/ :::highlight',
          '│   ├── App.tsx :::highlight icon(react) ## main component',
          '│   └── index.ts ## entry point',
          '├── package.json',
          '└── README.md ## project docs',
        ].join('\n');

        const result = preprocessBoxDrawing(input);
        const lines = result.text.split('\n');

        expect(lines[2]).toBe('    src/ :::highlight');
        expect(lines[3]).toBe('        App.tsx :::highlight icon(react) ## main component');
        expect(lines[4]).toBe('        index.ts ## entry point');
        expect(lines[5]).toBe('    package.json');
        expect(lines[6]).toBe('    README.md ## project docs');
      });
    });
  });

  describe('remapErrorLines', () => {
    it('should remap line numbers found in the map', () => {
      const lineMap = new Map<number, number>([
        [1, 1],
        [2, 3],
        [3, 5],
      ]);

      expect(remapErrorLines('Error at line 2: bad syntax', lineMap)).toBe(
        'Error at line 3: bad syntax'
      );
    });

    it('should leave unmapped line numbers unchanged', () => {
      const lineMap = new Map<number, number>([[1, 1]]);

      expect(remapErrorLines('Error at line 99: bad syntax', lineMap)).toBe(
        'Error at line 99: bad syntax'
      );
    });

    it('should handle multiple line references', () => {
      const lineMap = new Map<number, number>([
        [2, 4],
        [5, 10],
      ]);

      expect(remapErrorLines('Errors at line 2 and line 5', lineMap)).toBe(
        'Errors at line 4 and line 10'
      );
    });

    it('should be case-insensitive', () => {
      const lineMap = new Map<number, number>([[3, 7]]);

      expect(remapErrorLines('Error at Line 3: bad', lineMap)).toBe('Error at line 7: bad');
    });
  });
});
