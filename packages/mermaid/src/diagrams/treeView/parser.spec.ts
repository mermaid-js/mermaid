import { describe, expect, it } from 'vitest';
import { parseNodeContent } from './parser.js';

describe('parseNodeContent', () => {
  describe('bare labels', () => {
    it('should parse a simple filename', () => {
      const result = parseNodeContent('index.js');
      expect(result.name).toBe('index.js');
      expect(result.nodeType).toBe('file');
    });

    it('should detect directory from trailing slash', () => {
      const result = parseNodeContent('src/');
      expect(result.name).toBe('src');
      expect(result.nodeType).toBe('directory');
      expect(result.iconId).toBe('folder');
    });

    it('should parse dotfiles', () => {
      const result = parseNodeContent('.gitignore');
      expect(result.name).toBe('.gitignore');
      expect(result.nodeType).toBe('file');
      expect(result.iconId).toBe('git');
    });

    it('should parse filenames with hyphens', () => {
      const result = parseNodeContent('docker-compose.yml');
      expect(result.name).toBe('docker-compose.yml');
      expect(result.iconId).toBe('docker');
    });
  });

  describe('quoted labels', () => {
    it('should strip double quotes', () => {
      const result = parseNodeContent('"my file.js"');
      expect(result.name).toBe('my file.js');
      expect(result.nodeType).toBe('file');
    });

    it('should strip single quotes', () => {
      const result = parseNodeContent("'my folder/'");
      expect(result.name).toBe('my folder');
      expect(result.nodeType).toBe('directory');
    });

    it('should handle empty quoted string', () => {
      const result = parseNodeContent('""');
      expect(result.name).toBe('');
    });
  });

  describe(':::class annotation', () => {
    it('should extract class from bare label', () => {
      const result = parseNodeContent('index.js :::highlight');
      expect(result.name).toBe('index.js');
      expect(result.cssClass).toBe('highlight');
    });

    it('should extract class from quoted label', () => {
      const result = parseNodeContent('"my file.js" :::important');
      expect(result.name).toBe('my file.js');
      expect(result.cssClass).toBe('important');
    });

    it('should handle class with hyphens', () => {
      const result = parseNodeContent('file.ts :::my-class');
      expect(result.cssClass).toBe('my-class');
    });
  });

  describe('icon() annotation', () => {
    it('should extract icon override', () => {
      const result = parseNodeContent('data.bin icon(database)');
      expect(result.name).toBe('data.bin');
      expect(result.iconId).toBe('database');
    });

    it('should override auto-detected icon', () => {
      const result = parseNodeContent('config.json icon(config)');
      expect(result.name).toBe('config.json');
      expect(result.iconId).toBe('config');
    });
  });

  describe('## description', () => {
    it('should extract description from bare label', () => {
      const result = parseNodeContent('index.js ## entry point');
      expect(result.name).toBe('index.js');
      expect(result.description).toBe('entry point');
    });

    it('should extract description from quoted label', () => {
      const result = parseNodeContent('"my file.js" ## the main file');
      expect(result.name).toBe('my file.js');
      expect(result.description).toBe('the main file');
    });

    it('should handle description with no text after ##', () => {
      const result = parseNodeContent('file.txt ##');
      expect(result.name).toBe('file.txt');
      expect(result.description).toBeUndefined();
    });
  });

  describe('combined annotations', () => {
    it('should handle all annotations together', () => {
      const result = parseNodeContent('App.tsx :::highlight icon(react) ## main component');
      expect(result.name).toBe('App.tsx');
      expect(result.cssClass).toBe('highlight');
      expect(result.iconId).toBe('react');
      expect(result.description).toBe('main component');
    });

    it('should handle quoted label with all annotations', () => {
      const result = parseNodeContent('"my app.tsx" :::highlight icon(react) ## main component');
      expect(result.name).toBe('my app.tsx');
      expect(result.cssClass).toBe('highlight');
      expect(result.iconId).toBe('react');
      expect(result.description).toBe('main component');
    });

    it('should handle directory with class', () => {
      const result = parseNodeContent('src/ :::highlight');
      expect(result.name).toBe('src');
      expect(result.nodeType).toBe('directory');
      expect(result.cssClass).toBe('highlight');
      expect(result.iconId).toBe('folder');
    });
  });

  describe('bare labels with spaces', () => {
    it('should handle folder names with spaces', () => {
      const result = parseNodeContent('My Documents/');
      expect(result.name).toBe('My Documents');
      expect(result.nodeType).toBe('directory');
      expect(result.iconId).toBe('folder');
    });

    it('should handle folder names with spaces and annotations', () => {
      const result = parseNodeContent('My Documents/ :::highlight');
      expect(result.name).toBe('My Documents');
      expect(result.nodeType).toBe('directory');
      expect(result.cssClass).toBe('highlight');
    });

    it('should handle file names with spaces', () => {
      const result = parseNodeContent('my file.ts ## some description');
      expect(result.name).toBe('my file.ts');
      expect(result.nodeType).toBe('file');
      expect(result.iconId).toBe('typescript');
      expect(result.description).toBe('some description');
    });
  });

  describe('icon auto-detection', () => {
    it('should auto-detect TypeScript icon', () => {
      const result = parseNodeContent('utils.ts');
      expect(result.iconId).toBe('typescript');
    });

    it('should auto-detect Python icon', () => {
      const result = parseNodeContent('main.py');
      expect(result.iconId).toBe('python');
    });

    it('should auto-detect Markdown icon', () => {
      const result = parseNodeContent('README.md');
      expect(result.iconId).toBe('markdown');
    });

    it('should fall back to generic file icon', () => {
      const result = parseNodeContent('unknown.xyz');
      expect(result.iconId).toBe('file');
    });

    it('should use folder icon for directories', () => {
      const result = parseNodeContent('components/');
      expect(result.iconId).toBe('folder');
    });
  });

  describe('icon suppression', () => {
    it('should set iconId to none for icon(none)', () => {
      const result = parseNodeContent('index.js icon(none)');
      expect(result.name).toBe('index.js');
      expect(result.iconId).toBe('none');
    });

    it('should set iconId to none for empty icon()', () => {
      const result = parseNodeContent('index.js icon()');
      expect(result.name).toBe('index.js');
      expect(result.iconId).toBe('none');
    });

    it('should suppress icon on a directory', () => {
      const result = parseNodeContent('src/ icon(none)');
      expect(result.name).toBe('src');
      expect(result.nodeType).toBe('directory');
      expect(result.iconId).toBe('none');
    });

    it('should combine icon(none) with other annotations', () => {
      const result = parseNodeContent('app.ts icon(none) :::highlight ## entry point');
      expect(result.name).toBe('app.ts');
      expect(result.iconId).toBe('none');
      expect(result.cssClass).toBe('highlight');
      expect(result.description).toBe('entry point');
    });
  });
});
