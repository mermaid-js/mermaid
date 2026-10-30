import type { HeadConfig, PageData } from 'vitepress';
import { getPageUrl } from './siteUrl.js';

const SITE_NAME = 'Mermaid';
const MAX_DESCRIPTION_LENGTH = 160;
const MIN_DESCRIPTION_LENGTH = 40;

/** Paragraphs starting with these are not prose: headings, lists, tables, HTML, images. */
const nonProseStart = /^(#|\||[*+-]\s|\d+\.\s|<|!\[|\[!)/;

/** Notices such as `Note: ...` or `Mindmap: This is an experimental diagram`. */
const notice = /^(\*\*)?[\w ]+:(\*\*)?\s/;

/** Unwraps a blockquote, dropping attribution lines such as `> -Wikipedia`. */
const unquote = (paragraph: string): string =>
  paragraph
    .split('\n')
    .map((line) => line.replace(/^>\s?/, ''))
    .filter((line) => !/^\s*[—-]\s?\w+\s*$/.test(line))
    .join('\n');

const toPlainText = (paragraph: string): string =>
  paragraph
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|\W)[*_](.+?)[*_](?=\W|$)/g, '$1$2')
    .replace(/\\(.)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^"([^"]+)".*$/, '$1');

const truncate = (text: string): string => {
  if (text.length <= MAX_DESCRIPTION_LENGTH) {
    return text;
  }
  const cut = text.slice(0, MAX_DESCRIPTION_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.:;]+$/, '')}…`;
};

/**
 * The first prose paragraph of a markdown page, as plain text short enough for a meta description.
 */
export const getPageDescription = (markdown: string): string | undefined => {
  const body = markdown
    .replace(/^---\n[\S\s]*?\n---\n/, '')
    .replace(/^(`{3,}|~{3,})[^\n]*\n[\S\s]*?^\1\s*$/gm, '')
    .replace(/^:::[^\n]*\n[\S\s]*?^:::\s*$/gm, '')
    .replace(/<!--[\S\s]*?-->/g, '');

  for (const paragraph of body.split(/\n\s*\n/)) {
    const trimmed = unquote(paragraph.trim()).trim();
    if (!trimmed || nonProseStart.test(trimmed) || notice.test(trimmed)) {
      continue;
    }
    const text = toPlainText(trimmed);
    if (text.length >= MIN_DESCRIPTION_LENGTH) {
      return truncate(text);
    }
  }
};

/**
 * VitePress transformPageData hook: fills in the page description from its first paragraph
 * (unless set in frontmatter) and adds per-page Open Graph title, description and URL.
 */
export const addPageMetadata = (
  pageData: PageData,
  markdown: string,
  siteDescription: string,
  siteUrl: string
): void => {
  pageData.description ||= getPageDescription(markdown) ?? '';

  const title =
    pageData.title && pageData.title !== SITE_NAME ? `${pageData.title} | ${SITE_NAME}` : SITE_NAME;
  const head: HeadConfig[] = [
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: pageData.description || siteDescription }],
    ['meta', { property: 'og:url', content: getPageUrl(pageData.relativePath, siteUrl) }],
  ];
  pageData.frontmatter.head = [...(pageData.frontmatter.head ?? []), ...head];
};
