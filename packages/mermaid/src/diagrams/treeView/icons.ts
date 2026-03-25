import type { NodeType } from './types.js';

/**
 * Icon resolution for treeView nodes.
 *
 * Priority:
 *  1. Explicit icon() annotation (handled in parser.ts before calling resolveIcon)
 *  2. Exact filename match (e.g. Dockerfile → docker)
 *  3. Extension match (e.g. .ts → typescript)
 *  4. Directory → folder
 *  5. Fallback → file
 */

// Known filenames → icon ID
const FILENAME_ICONS: Record<string, string> = {
  '.gitignore': 'git',
  '.eslintrc': 'config',
  '.eslintrc.js': 'config',
  '.eslintrc.json': 'config',
  '.prettierrc': 'config',
  '.prettierrc.json': 'config',
  Dockerfile: 'docker',
  'docker-compose.yml': 'docker',
  'docker-compose.yaml': 'docker',
  Makefile: 'terminal',
  LICENSE: 'license',
  'README.md': 'markdown',
  '.env': 'env',
  '.env.local': 'env',
  '.env.production': 'env',
  'tsconfig.json': 'typescript',
  'package.json': 'json',
  'package-lock.json': 'lock',
  'yarn.lock': 'lock',
  'pnpm-lock.yaml': 'lock',
};

// Extension → icon ID
const EXTENSION_ICONS: Record<string, string> = {
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'react',
  '.ts': 'typescript',
  '.tsx': 'react',
  '.py': 'python',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.go': 'go',
  '.java': 'java',
  '.cs': 'csharp',
  '.cpp': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'config',
  '.xml': 'xml',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'css',
  '.less': 'css',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.txt': 'file',
  '.sh': 'terminal',
  '.bash': 'terminal',
  '.zsh': 'terminal',
  '.ps1': 'terminal',
  '.bat': 'terminal',
  '.svg': 'image',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.ico': 'image',
  '.webp': 'image',
  '.sql': 'database',
  '.db': 'database',
  '.lock': 'lock',
  '.env': 'env',
  '.vue': 'vue',
  '.svelte': 'svelte',
};

/**
 * Resolve an icon ID for a given label and node type.
 * Returns the icon ID string (not the SVG path).
 */
export function resolveIcon(label: string, nodeType: NodeType): string {
  if (nodeType === 'directory') {
    return 'folder';
  }

  // Strip trailing / for lookup (directories handled above)
  const name = label.endsWith('/') ? label.slice(0, -1) : label;

  // 1. Exact filename
  if (name in FILENAME_ICONS) {
    return FILENAME_ICONS[name];
  }

  // 2. Extension
  const dotIdx = name.lastIndexOf('.');
  if (dotIdx > 0) {
    const ext = name.substring(dotIdx).toLowerCase();
    if (ext in EXTENSION_ICONS) {
      return EXTENSION_ICONS[ext];
    }
  }

  return 'file';
}

/**
 * Inline SVG icon paths, keyed by icon ID.
 * Each value is an SVG path `d` attribute for a 16x16 viewBox.
 * Paths are based on generic file-type iconography (not copied from any icon set).
 */
export const ICON_PATHS: Record<string, string> = {
  // Folder: simple folder shape
  folder: 'M1 3h5l2-2h7v1h-6.5L6.5 4H1V3zm0 2h14v9H1V5zm1 1v7h12V6H2z',
  // Generic file
  file: 'M3 1h7l4 4v10H3V1zm1 1v12h9V5.5L9.5 2H4zm6 0v4h4',
  // JavaScript
  javascript:
    'M0 2h16v12H0V2zm1 1v10h14V3H1zm4 3.5h1.5v4c0 .8-.4 1.2-1.2 1.2-.4 0-.7-.1-.9-.2l.2-1c.1.1.3.1.4.1.3 0 .4-.1.4-.5V6.5H5zm3 0h1.5v2.3c0 .2 0 .4.1.5.1.2.3.3.5.3.4 0 .6-.2.6-.8V6.5H12v2.7c0 1.2-.6 1.8-1.7 1.8-.5 0-.9-.1-1.2-.4l.2-1c.2.2.5.3.7.3.4 0 .6-.2.6-.7V6.5H8z',
  // TypeScript
  typescript:
    'M0 2h16v12H0V2zm1 1v10h14V3H1zm4.5 2.5h5v1.2H8.8V11H7.2V6.7H5.5V5.5zm5.3.1c.7 0 1.3.2 1.7.5l-.5.9c-.3-.2-.7-.3-1.1-.3-.5 0-.7.2-.7.4 0 .3.3.4.9.6.9.3 1.4.7 1.4 1.5 0 .9-.7 1.5-1.8 1.5-.8 0-1.4-.2-1.9-.7l.6-.9c.4.3.8.5 1.3.5.5 0 .7-.2.7-.5 0-.3-.2-.4-.8-.6-1-.3-1.5-.7-1.5-1.5 0-.8.7-1.4 1.7-1.4z',
  // Python
  python:
    'M8 1C5 1 5 2.5 5 2.5V4h3v1H4S2 4.5 2 8s1.5 3 1.5 3H5V9.5S5 8 6.5 8H10c1 0 1.5-.5 1.5-1.5V3S12 1 8 1zM6.5 2.5a.5.5 0 110 1 .5.5 0 010-1zM8 15c3 0 3-1.5 3-1.5V12H8v-1h4s2 .5 2-3-1.5-3-1.5-3H11v1.5s0 1.5-1.5 1.5H6c-1 0-1.5.5-1.5 1.5V13s-.5 2 3.5 2zm1.5-1.5a.5.5 0 110-1 .5.5 0 010 1z',
  // React (JSX/TSX)
  react:
    'M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0-7C5 2.5 2.5 4.5 2.5 5s2 3 5.5 3 5.5-2.5 5.5-3S11 2.5 8 2.5zm0 11c3 0 5.5-2 5.5-2.5s-2-3-5.5-3-5.5 2.5-5.5 3S5 13.5 8 13.5z',
  // JSON
  json: 'M4 2C3 2 2 3 2 4v3c0 1-1 1-1 1s1 0 1 1v3c0 1 1 2 2 2h1v-1H4c-.5 0-1-.5-1-1V9c0-1-.5-1.5-1-1.5.5 0 1-.5 1-1.5V3c0-.5.5-1 1-1h1V1H4zm8 0c1 0 2 1 2 2v3c0 1 1 1 1 1s-1 0-1 1v3c0 1-1 2-2 2h-1v-1h1c.5 0 1-.5 1-1V9c0-1 .5-1.5 1-1.5-.5 0-1-.5-1-1.5V3c0-.5-.5-1-1-1h-1V1h1z',
  // Markdown
  markdown:
    'M2 3h12v10H2V3zm1 1v8h10V4H3zm1.5 6V6.5l2 2.5 2-2.5V10h1V6h-1l-2 2.5L4.5 6h-1v4h1zm7-2l-1.5 2h1V10h1V8h1L11.5 6z',
  // HTML
  html: 'M2 1l1 14 5 1 5-1 1-14H2zm3 5h6l-.2 2H7l.2 2h3.4l-.3 3-2.3.7-2.3-.7-.1-1.5h1.5l.1.8 .8.2.8-.2.1-1.3H5.5L5 6z',
  // CSS
  css: 'M1 1h14l-1.3 12.5L8 15l-5.7-1.5L1 1zm2.2 1.8l1 9.2L8 13.2l3.8-1.2 1-9.2H3.2zm1.3 2h7l-.2 1.5H7l.2 1.5h4l-.4 3.5L8 11.5l-2.8-.8-.2-1.4h1.5l.1.7 1.4.4 1.4-.4.2-1.5H5.2l-.4-3',
  // Image
  image: 'M2 3h12v10H2V3zm1 1v6l3-3 2 2 2-3 3 4V4H3zm3 1.5a1 1 0 100 2 1 1 0 000-2z',
  // Config/gear
  config:
    'M7 1l-.5 2-.7.3-1.5-1.2-1.4 1.4 1.2 1.5-.3.7-2 .5v2l2 .5.3.7-1.2 1.5 1.4 1.4 1.5-1.2.7.3.5 2h2l.5-2 .7-.3 1.5 1.2 1.4-1.4-1.2-1.5.3-.7 2-.5V7l-2-.5-.3-.7 1.2-1.5-1.4-1.4-1.5 1.2-.7-.3L9 1H7zm1 5a2 2 0 110 4 2 2 0 010-4z',
  // Terminal/shell
  terminal: 'M2 3h12v10H2V3zm1 1v8h10V4H3zm1.5 1L7 7.5 4.5 10l1 1L9 7.5 5.5 4l-1 1zM9 10h3v1H9v-1z',
  // Git
  git: 'M15 7.5l-6.5-6.5a.7.7 0 00-1 0L6 2.5 7.5 4a1 1 0 011.2 1.2L10 6.5a1 1 0 11-.6.6L8 5.7V11a1 1 0 11-1 0V5.5a1 1 0 01-.5-1.3L5 2.6 1.5 6a.7.7 0 000 1L8 13.5a.7.7 0 001 0L15 7.5z',
  // Docker
  docker:
    'M9 3H7v2h2V3zM6 3H4v2h2V3zM6 6H4v2h2V6zM9 6H7v2h2V6zm3-3h-2v2h2V3zm-3-3H7v2h2V0zm3 6h-2v2h2V6zm3 1c-.5-.3-1.5-.4-2 0-.2-.8-.7-1.5-1.5-1.8l-.3-.2-.2.3c-.3.5-.4 1.2-.3 1.7-1-.5-2-.4-2-.4H1c-.2 1 0 3 1 4.5S4.5 14 7 14c4 0 7-2 8.5-5.5 1 0 2-.1 2.5-1l.2-.3-.5-.2z',
  // Database/SQL
  database:
    'M8 1C5 1 2 1.7 2 3v10c0 1.3 3 2 6 2s6-.7 6-2V3c0-1.3-3-2-6-2zm0 1c3 0 5 .7 5 1s-2 1-5 1S3 3.3 3 3s2-1 5-1zM3 5c1 .6 3 1 5 1s4-.4 5-1v2c0 .3-2 1-5 1s-5-.7-5-1V5zm0 4c1 .6 3 1 5 1s4-.4 5-1v2c0 .3-2 1-5 1s-5-.7-5-1V9zm0 4c1 .6 3 1 5 1s4-.4 5-1v0c0 .3-2 1-5 1s-5-.7-5-1v0z',
  // Lock
  lock: 'M5 7V5a3 3 0 016 0v2h1v7H4V7h1zm1 0h4V5a2 2 0 00-4 0v2zm2 2a1 1 0 00-.5 1.9V12h1v-1.1A1 1 0 008 9z',
  // Env/key
  env: 'M10 1a4 4 0 00-3.9 5L1 11v3h3v-2h2v-2h2l.6-.6A4 4 0 1010 1zm1 3a1 1 0 110-2 1 1 0 010 2z',
  // License
  license:
    'M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm0 2a2 2 0 100 4 2 2 0 000-4zm-3 6c0-1 1.5-1.5 3-1.5s3 .5 3 1.5v1H5v-1z',
  // Ruby
  ruby: 'M2 8l4-6h4l4 6-6 6-6-6zm3-1h6l-3 5-3-5z',
  // Rust
  rust: 'M8 2a6 6 0 100 12A6 6 0 008 2zm0 1a5 5 0 110 10A5 5 0 018 3zm-1 2v2H5v2h2v2h2V9h2V7H9V5H7z',
  // Go
  go: 'M3 7c0-3 2-5 5-5s5 2 5 5v2c0 3-2 5-5 5s-5-2-5-5V7zm2 0v2c0 2 1.5 3 3 3s3-1 3-3V7c0-2-1.5-3-3-3S5 5 5 7z',
  // Java
  java: 'M6 2s-.5 2 1.5 3C9 6 9 7 9 7s1-1 0-2.5C8 3 6 2 6 2zm-1 6s-2 .5 0 1.5c2 1 5 1 7 0 0 0 .5-.5-1-.5s-3 .5-6-1zm1 2s-3 .5 0 1.5c2.5.8 6 .5 7 0 0 0 .5-.5-1.5-.5s-3 .5-5.5-1zm2-5c-2 0-4 1-4 2s2 2 4 2 4-1 4-2-2-2-4-2z',
  // YAML
  yaml: 'M2 3h12v10H2V3zm1 1v8h10V4H3zm2 1l1.5 2L5 9h1l1-1.5L8 9h1L7.5 7 9 5H8L7 6.5 6 5H5z',
  // XML
  xml: 'M5 5L2 8l3 3 1-1-2-2 2-2-1-1zm6 0l-1 1 2 2-2 2 1 1 3-3-3-3zM7 12l2-8h-1l-2 8h1z',
  // Vue
  vue: 'M1 2h4l3 5 3-5h4L8 14 1 2zm2 1l5 9 5-9h-2l-3 5-3-5H3z',
  // Svelte
  svelte:
    'M12 2C10 .5 7 1 6 3L4 6c-.7 1-.8 2.5-.3 3.5-1 1-1.2 3-.5 4C5 15.5 8 15 9 13l2-3c.7-1 .8-2.5.3-3.5 1-1 1.2-3 .5-4zm-4 9l-2 3c-.5.5-1.5.5-2 0-.5-.5-.5-1.5 0-2l2-3 2 2zm2-4L8 10l-2-2 2-3c.5-.5 1.5-.5 2 0 .5.5.5 1.5 0 2z',
  // C#
  csharp:
    'M8 2a6 6 0 100 12A6 6 0 008 2zm-.5 3h1V6H10v1H8.5v2H10v1H8.5v1h-1v-1H6V9h1.5V7H6V6h1.5V5z',
  // C++
  cpp: 'M8 2a6 6 0 100 12A6 6 0 008 2zm-1 3h1V6.5h1.5v1H8V9h1.5v1H8v1.5H7V10H5.5V9H7V7.5H5.5v-1H7V5z',
  // C
  c: 'M8 2a6 6 0 100 12A6 6 0 008 2zm1 3c1.5 0 2.5 1 3 2l-1.5.5C10.3 7 9.7 6.5 9 6.5 7.5 6.5 7 7.5 7 8s.5 1.5 2 1.5c.7 0 1.3-.5 1.5-1L12 9c-.5 1-1.5 2-3 2-2 0-3.5-1.5-3.5-3S7 5 9 5z',
  // Kotlin
  kotlin: 'M2 2h12L8 8l6 6H2V2zm2 2v8h6l-4-4 4-4H4z',
};

/**
 * Return the SVG path for a given icon ID, falling back to 'file'.
 */
export function getIconPath(iconId: string): string {
  return ICON_PATHS[iconId] ?? ICON_PATHS.file;
}
