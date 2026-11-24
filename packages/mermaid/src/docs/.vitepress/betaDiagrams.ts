/**
 * Syntax pages for diagrams whose keyword must end in `-beta`.
 * Shown with a Beta badge in the sidebar; `betaDiagrams.spec.ts` checks this against the pages.
 */
export const betaSyntaxPages = new Set([
  'agentflow',
  'architecture',
  'cynefin',
  'radar',
  'railroad',
  'swimlanes',
  'treeView',
  'usecase',
  'venn',
  'wardley',
]);

/** Syntax pages whose examples use the `-beta` keyword, although the plain keyword works too. */
export const optionalBetaKeywordPages = new Set(['ishikawa', 'treemap']);
