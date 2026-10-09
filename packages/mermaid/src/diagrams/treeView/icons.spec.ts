import { describe, expect, it } from 'vitest';
import { detectIcon, getNodeIcon, treeViewIcons } from './icons.js';

const config = (
  overrides: Partial<{
    showIcons: boolean;
    defaultIconPack: string;
    filenameIcons: Record<string, string>;
    extensionIcons: Record<string, string>;
  }> = {}
) => ({
  showIcons: false,
  defaultIconPack: '',
  filenameIcons: {},
  extensionIcons: {},
  ...overrides,
});

describe('icons', () => {
  describe('treeViewIcons pack', () => {
    it('uses the mermaid-treeview prefix', () => {
      expect(treeViewIcons.prefix).toBe('mermaid-treeview');
    });

    it('contains exactly the built-in file and folder icons', () => {
      expect(Object.keys(treeViewIcons.icons).sort()).toEqual(['file', 'folder']);
    });

    it('every icon has a non-empty body that inherits color via currentColor', () => {
      for (const [name, icon] of Object.entries(treeViewIcons.icons)) {
        expect(icon.body.length, `icon "${name}" should have a non-empty body`).toBeGreaterThan(0);
        expect(icon.body, `icon "${name}" should use currentColor`).toContain('currentColor');
      }
    });
  });

  describe('detectIcon', () => {
    it('has no built-in mapping — returns undefined without configured maps', () => {
      expect(detectIcon('utils.ts')).toBeUndefined();
      expect(detectIcon('Dockerfile')).toBeUndefined();
      expect(detectIcon('package.json', config())).toBeUndefined();
    });

    it('matches exact filenames from filenameIcons', () => {
      expect(detectIcon('Dockerfile', config({ filenameIcons: { Dockerfile: 'docker' } }))).toBe(
        'docker'
      );
    });

    it('matches extensions from extensionIcons, with or without the leading dot', () => {
      expect(detectIcon('utils.ts', config({ extensionIcons: { '.ts': 'typescript' } }))).toBe(
        'typescript'
      );
      expect(detectIcon('utils.ts', config({ extensionIcons: { ts: 'typescript' } }))).toBe(
        'typescript'
      );
    });

    it('matches extensions case-insensitively', () => {
      expect(detectIcon('APP.TS', config({ extensionIcons: { '.ts': 'typescript' } }))).toBe(
        'typescript'
      );
    });

    it('filename matches beat extension matches', () => {
      expect(
        detectIcon(
          'tsconfig.json',
          config({
            filenameIcons: { 'tsconfig.json': 'tsconfig' },
            extensionIcons: { '.json': 'json' },
          })
        )
      ).toBe('tsconfig');
    });

    it('uses the last extension for multi-dot names', () => {
      expect(
        detectIcon('component.spec.ts', config({ extensionIcons: { '.ts': 'typescript' } }))
      ).toBe('typescript');
    });

    it('does not extension-match dotfiles', () => {
      expect(
        detectIcon('.bashrc', config({ extensionIcons: { bashrc: 'console' } }))
      ).toBeUndefined();
    });
  });

  describe('getNodeIcon', () => {
    const file = (name: string, icon?: string) => ({ name, icon, nodeType: 'file' as const });
    const dir = (name: string, icon?: string) => ({ name, icon, nodeType: 'directory' as const });

    it('returns undefined for none regardless of config', () => {
      expect(getNodeIcon(file('a.ts', 'none'), config())).toBeUndefined();
      expect(
        getNodeIcon(dir('src', 'none'), config({ showIcons: true, defaultIconPack: 'logos' }))
      ).toBeUndefined();
    });

    it('returns prefixed explicit icons as-is, regardless of showIcons', () => {
      expect(getNodeIcon(file('a.ts', 'logos:react'), config())).toBe('logos:react');
      expect(getNodeIcon(file('a.ts', 'logos:react'), config({ showIcons: true }))).toBe(
        'logos:react'
      );
    });

    it('qualifies built-in names with the built-in pack, even when defaultIconPack is set', () => {
      expect(getNodeIcon(file('a.ts', 'file'), config({ defaultIconPack: 'logos' }))).toBe(
        'mermaid-treeview:file'
      );
      expect(getNodeIcon(file('a.ts', 'folder'), config())).toBe('mermaid-treeview:folder');
    });

    it('qualifies unprefixed explicit icons with the defaultIconPack', () => {
      expect(getNodeIcon(file('a.ts', 'react'), config({ defaultIconPack: 'logos' }))).toBe(
        'logos:react'
      );
    });

    it('qualifies unprefixed explicit icons with the built-in pack when no defaultIconPack is set', () => {
      // resolves to the unknown-icon fallback at fetch time
      expect(getNodeIcon(file('a.ts', 'react'), config())).toBe('mermaid-treeview:react');
    });

    it('returns undefined without an explicit icon when showIcons is off', () => {
      expect(getNodeIcon(file('utils.ts'), config())).toBeUndefined();
      expect(getNodeIcon(dir('src'), config({ defaultIconPack: 'logos' }))).toBeUndefined();
    });

    it('uses the built-in icons by node type when showIcons is on', () => {
      expect(getNodeIcon(file('utils.ts'), config({ showIcons: true }))).toBe(
        'mermaid-treeview:file'
      );
      expect(getNodeIcon(dir('src'), config({ showIcons: true }))).toBe('mermaid-treeview:folder');
      // defaultIconPack only affects explicit icon() references, not the defaults
      expect(
        getNodeIcon(file('utils.ts'), config({ showIcons: true, defaultIconPack: 'logos' }))
      ).toBe('mermaid-treeview:file');
    });

    describe('configured detection maps', () => {
      it('picks file icons from extensionIcons when showIcons is on', () => {
        expect(
          getNodeIcon(
            file('utils.ts'),
            config({
              showIcons: true,
              defaultIconPack: 'material-icon-theme',
              extensionIcons: { '.ts': 'typescript' },
            })
          )
        ).toBe('material-icon-theme:typescript');
      });

      it('uses prefixed map values as-is, even without a defaultIconPack', () => {
        expect(
          getNodeIcon(
            file('utils.ts'),
            config({ showIcons: true, extensionIcons: { '.ts': 'logos:typescript-icon' } })
          )
        ).toBe('logos:typescript-icon');
      });

      it('ignores the maps when showIcons is off', () => {
        expect(
          getNodeIcon(
            file('utils.ts'),
            config({ extensionIcons: { '.ts': 'logos:typescript-icon' } })
          )
        ).toBeUndefined();
      });

      it('hides the icon for files mapped to none', () => {
        expect(
          getNodeIcon(
            file('notes.txt'),
            config({ showIcons: true, extensionIcons: { '.txt': 'none' } })
          )
        ).toBeUndefined();
      });

      it('allows map values to reference the built-in icons', () => {
        expect(
          getNodeIcon(
            file('notes.txt'),
            config({
              showIcons: true,
              defaultIconPack: 'material-icon-theme',
              filenameIcons: { 'notes.txt': 'folder' },
            })
          )
        ).toBe('mermaid-treeview:folder');
      });

      it('falls back to the built-in file icon when nothing matches', () => {
        expect(
          getNodeIcon(
            file('data.xyz'),
            config({ showIcons: true, extensionIcons: { '.ts': 'typescript' } })
          )
        ).toBe('mermaid-treeview:file');
      });
    });
  });
});
