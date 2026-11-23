import { readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import type { Font } from 'opentype.js';

const BUNDLED_DIR = join(dirname(fileURLToPath(import.meta.url)), '../fonts');
const BUNDLED = {
  regular: join(BUNDLED_DIR, 'LiberationSans-Regular.ttf'),
  bold: join(BUNDLED_DIR, 'LiberationSans-Bold.ttf'),
};

const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'emoji',
  'math',
]);

const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff']);
const MAX_SCAN_DEPTH = 3;

function systemFontDirs(): string[] {
  switch (process.platform) {
    case 'darwin':
      return [
        '/System/Library/Fonts',
        '/System/Library/Fonts/Supplemental',
        '/Library/Fonts',
        join(homedir(), 'Library/Fonts'),
      ];
    case 'win32':
      return [
        join(process.env.WINDIR ?? String.raw`C:\Windows`, 'Fonts'),
        join(process.env.LOCALAPPDATA ?? '', 'Microsoft/Windows/Fonts'),
      ];
    default:
      return [
        '/usr/share/fonts',
        '/usr/local/share/fonts',
        join(homedir(), '.fonts'),
        join(homedir(), '.local/share/fonts'),
      ];
  }
}

const normalize = (s: string): string => s.toLowerCase().replaceAll(/[\s_-]+/g, '');

let systemFontIndex: Map<string, string> | undefined;

function scanDir(dir: string, depth: number, out: Map<string, string>): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      if (depth < MAX_SCAN_DEPTH) {
        scanDir(full, depth + 1, out);
      }
    } else if (FONT_EXTENSIONS.has(extname(entry).toLowerCase())) {
      const stem = entry.slice(0, -extname(entry).length);
      out.set(normalize(stem), full);
    }
  }
}

function getSystemFontIndex(): Map<string, string> {
  if (!systemFontIndex) {
    systemFontIndex = new Map();
    for (const dir of systemFontDirs()) {
      scanDir(dir, 0, systemFontIndex);
    }
  }
  return systemFontIndex;
}

const fileCache = new Map<string, Font | null>();

function loadFontFile(path: string): Font | null {
  const cached = fileCache.get(path);
  if (cached !== undefined) {
    return cached;
  }
  let font: Font | null = null;
  try {
    const buf = readFileSync(path);
    font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  } catch {
    font = null;
  }
  fileCache.set(path, font);
  return font;
}

function fontFamilyNames(font: Font): string[] {
  const names = font.names as unknown as Record<string, Record<string, string> | undefined>;
  return [names.preferredFamily?.en, names.fontFamily?.en]
    .filter((n): n is string => typeof n === 'string')
    .map(normalize);
}

function findSystemFont(family: string, bold: boolean): Font | null {
  const wanted = normalize(family);
  const candidates: string[] = [];
  for (const [stem, path] of getSystemFontIndex()) {
    if (!stem.startsWith(wanted)) {
      continue;
    }
    const suffix = stem.slice(wanted.length);
    if (suffix.includes('italic') || suffix.includes('oblique') || suffix.includes('narrow')) {
      continue;
    }
    const isBold = suffix.includes('bold');
    if (isBold === bold && (bold || suffix === '' || suffix === 'regular')) {
      candidates.push(path);
    }
  }
  for (const path of candidates) {
    const font = loadFontFile(path);
    if (font && fontFamilyNames(font).some((n) => n.startsWith(wanted))) {
      return font;
    }
  }
  return null;
}

/** Split a CSS `font-family` list into individual family names. */
export function parseFontFamilies(fontFamily: string): string[] {
  return fontFamily
    .split(',')
    .map((f) =>
      f
        .trim()
        .replaceAll(/^["']|["']$/g, '')
        .trim()
    )
    .filter((f) => f.length > 0);
}

const resolvedCache = new Map<string, Font>();

/**
 * Resolve a CSS font-family list and weight to a loaded font.
 * System fonts are tried in list order; the bundled Liberation Sans is the fallback.
 */
export function resolveFont(fontFamily: string, fontWeight: number): Font {
  const bold = fontWeight >= 600;
  const key = `${fontFamily}#${bold ? 'b' : 'r'}`;
  const cached = resolvedCache.get(key);
  if (cached) {
    return cached;
  }
  let font: Font | null = null;
  for (const family of parseFontFamilies(fontFamily)) {
    if (GENERIC_FAMILIES.has(family.toLowerCase())) {
      break;
    }
    font = findSystemFont(family, bold);
    if (font) {
      break;
    }
  }
  font ??= loadFontFile(bold ? BUNDLED.bold : BUNDLED.regular);
  if (!font) {
    throw new Error(`Unable to load a font for "${fontFamily}"`);
  }
  resolvedCache.set(key, font);
  return font;
}
