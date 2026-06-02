import { describe, expect, it } from 'vitest';
import { resolveIcon, getIconPath, ICON_PATHS } from './icons.js';

describe('icons', () => {
  describe('resolveIcon', () => {
    // ------------------------------------------------------------------
    // Resolution priority (the interesting logic)
    // ------------------------------------------------------------------
    describe('resolution priority', () => {
      it('directory type always wins — even if the name matches a known file', () => {
        // package.json would be "json" as a file, but directories must always be "folder"
        expect(resolveIcon('package.json', 'directory')).toBe('folder');
        expect(resolveIcon('Dockerfile', 'directory')).toBe('folder');
        expect(resolveIcon('main.py', 'directory')).toBe('folder');
      });

      it('exact filename beats extension match', () => {
        // tsconfig.json: filename→typescript, extension→json  →  filename wins
        expect(resolveIcon('tsconfig.json', 'file')).toBe('typescript');
        // .eslintrc.js: filename→config, extension→javascript  →  filename wins
        expect(resolveIcon('.eslintrc.js', 'file')).toBe('config');
        // .prettierrc.json: filename→config, extension→json  →  filename wins
        expect(resolveIcon('.prettierrc.json', 'file')).toBe('config');
      });

      it('falls back to extension when filename is not in the known list', () => {
        expect(resolveIcon('utils.ts', 'file')).toBe('typescript');
        expect(resolveIcon('App.tsx', 'file')).toBe('react');
        expect(resolveIcon('main.py', 'file')).toBe('python');
      });

      it('falls back to "file" when nothing matches', () => {
        expect(resolveIcon('data.xyz', 'file')).toBe('file');
        expect(resolveIcon('noext', 'file')).toBe('file');
      });
    });

    // ------------------------------------------------------------------
    // Case sensitivity behaviour
    // ------------------------------------------------------------------
    describe('case sensitivity', () => {
      it('extension matching is case-insensitive', () => {
        expect(resolveIcon('APP.TS', 'file')).toBe('typescript');
        expect(resolveIcon('styles.CSS', 'file')).toBe('css');
        expect(resolveIcon('Main.PY', 'file')).toBe('python');
      });

      it('filename matching is case-sensitive', () => {
        // "Dockerfile" is in the table, but "dockerfile" is not
        expect(resolveIcon('Dockerfile', 'file')).toBe('docker');
        expect(resolveIcon('dockerfile', 'file')).toBe('file'); // falls through to no-extension fallback
        // "Makefile" vs "makefile"
        expect(resolveIcon('Makefile', 'file')).toBe('terminal');
        expect(resolveIcon('makefile', 'file')).toBe('file');
      });
    });

    // ------------------------------------------------------------------
    // Filename lookups (spot-check representative samples, not every row)
    // ------------------------------------------------------------------
    describe('known filenames', () => {
      it.each([
        ['.gitignore', 'git'],
        ['Dockerfile', 'docker'],
        ['docker-compose.yml', 'docker'],
        ['Makefile', 'terminal'],
        ['LICENSE', 'license'],
        ['.env', 'env'],
        ['.env.local', 'env'],
        ['tsconfig.json', 'typescript'],
        ['package.json', 'json'],
        ['package-lock.json', 'lock'],
        ['yarn.lock', 'lock'],
        ['pnpm-lock.yaml', 'lock'],
      ] as const)('%s → %s', (filename, expectedIcon) => {
        expect(resolveIcon(filename, 'file')).toBe(expectedIcon);
      });
    });

    // ------------------------------------------------------------------
    // Extension lookups (one representative per icon category)
    // ------------------------------------------------------------------
    describe('extension mapping', () => {
      it.each([
        ['app.js', 'javascript'],
        ['App.tsx', 'react'],
        ['utils.ts', 'typescript'],
        ['main.py', 'python'],
        ['app.rb', 'ruby'],
        ['main.rs', 'rust'],
        ['main.go', 'go'],
        ['App.java', 'java'],
        ['Prog.cs', 'csharp'],
        ['main.cpp', 'cpp'],
        ['main.c', 'c'],
        ['data.json', 'json'],
        ['conf.yaml', 'yaml'],
        ['conf.toml', 'config'],
        ['data.xml', 'xml'],
        ['index.html', 'html'],
        ['styles.css', 'css'],
        ['notes.md', 'markdown'],
        ['build.sh', 'terminal'],
        ['logo.svg', 'image'],
        ['query.sql', 'database'],
        ['some.lock', 'lock'],
        ['config.env', 'env'],
        ['App.vue', 'vue'],
        ['App.svelte', 'svelte'],
      ] as const)('%s → %s', (filename, expectedIcon) => {
        expect(resolveIcon(filename, 'file')).toBe(expectedIcon);
      });
    });

    // ------------------------------------------------------------------
    // Edge cases
    // ------------------------------------------------------------------
    describe('edge cases', () => {
      it('dotfiles without an extension match by exact filename', () => {
        expect(resolveIcon('.gitignore', 'file')).toBe('git');
        expect(resolveIcon('.eslintrc', 'file')).toBe('config');
        expect(resolveIcon('.prettierrc', 'file')).toBe('config');
      });

      it('dotfiles not in the known list fall back correctly', () => {
        // .bashrc has no extension (dot is at index 0, so dotIdx=0 which fails the >0 check)
        expect(resolveIcon('.bashrc', 'file')).toBe('file');
      });

      it('files with multiple dots use the last extension', () => {
        // "component.spec.ts" → last ext is .ts → typescript
        expect(resolveIcon('component.spec.ts', 'file')).toBe('typescript');
        // "archive.tar.gz" → last ext is .gz → unknown → file
        expect(resolveIcon('archive.tar.gz', 'file')).toBe('file');
      });

      it('directory type overrides even for trailing-slash labels', () => {
        expect(resolveIcon('src/', 'directory')).toBe('folder');
      });
    });
  });

  describe('getIconPath', () => {
    it('returns the SVG path for a known icon', () => {
      expect(getIconPath('folder')).toBe(ICON_PATHS.folder);
      expect(getIconPath('typescript')).toBe(ICON_PATHS.typescript);
    });

    it('falls back to the "file" SVG path for unknown icon IDs', () => {
      expect(getIconPath('nonexistent')).toBe(ICON_PATHS.file);
      expect(getIconPath('')).toBe(ICON_PATHS.file);
    });

    it('every icon ID that resolveIcon can return has a corresponding SVG path', () => {
      // Collect all icon IDs that resolveIcon can produce
      const resolvableIds = new Set<string>();
      // From directories
      resolvableIds.add('folder');
      // From fallback
      resolvableIds.add('file');
      // Sample of extensions/filenames — all icon IDs that appear in the mappings
      const testFiles = [
        'app.js',
        'App.tsx',
        'utils.ts',
        'main.py',
        'app.rb',
        'main.rs',
        'main.go',
        'App.java',
        'Prog.cs',
        'main.cpp',
        'main.c',
        'data.json',
        'conf.yaml',
        'conf.toml',
        'data.xml',
        'index.html',
        'styles.css',
        'notes.md',
        'build.sh',
        'logo.svg',
        'query.sql',
        'some.lock',
        'config.env',
        'App.vue',
        'App.svelte',
        '.gitignore',
        'Dockerfile',
        'LICENSE',
      ];
      for (const f of testFiles) {
        resolvableIds.add(resolveIcon(f, 'file'));
      }

      for (const iconId of resolvableIds) {
        const path = getIconPath(iconId);
        expect(path, `icon "${iconId}" should have its own SVG path, not the fallback`).toBe(
          ICON_PATHS[iconId]
        );
      }
    });
  });

  describe('ICON_PATHS', () => {
    it('includes at minimum the two mandatory icons (file and folder)', () => {
      expect(ICON_PATHS.file).toBeDefined();
      expect(ICON_PATHS.folder).toBeDefined();
    });

    it('every entry is a non-empty SVG path string', () => {
      for (const [key, value] of Object.entries(ICON_PATHS)) {
        expect(typeof value, `${key} should be a string`).toBe('string');
        expect(value.length, `${key} should have a non-empty path`).toBeGreaterThan(0);
      }
    });
  });
});
