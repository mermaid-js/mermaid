/**
 * The mermaid config the docs site renders its examples with.
 *
 * Extracted from `Mermaid.vue` so it can be tested: the swimlane branch here was dead for
 * as long as it existed, matching on `swimlanes` where the keyword is `swimlane-beta`, and
 * nothing noticed because the config was built inside the component.
 */

/**
 * Config keys of the diagram types that default to `redux-color`. Needed only for dark
 * mode, where the page picks the theme and so has to pick each one's dark counterpart;
 * `exampleConfig.spec.ts` checks this against the schema so it cannot drift.
 */
export const COLOR_THEME_DIAGRAMS = [
  'flowchart',
  'swimlane',
  'class',
  'er',
  'requirement',
  'sequence',
  'state',
  'usecase',
  'venn',
] as const;

/**
 * The diagram type keyword a source starts with, skipping optional YAML frontmatter and
 * `%%{init: ...}%%` directives.
 */
export const getDiagramType = (source: string): string => {
  const withoutFrontmatter = source.replace(/^\s*---[\S\s]*?---\s*/, '');
  const withoutDirectives = withoutFrontmatter.replace(/^\s*(?:%%{[\S\s]*?}%%\s*)*/, '');
  return withoutDirectives.trimStart().split(/\s|\n/, 1)[0] ?? '';
};

export const buildExampleConfig = (
  source: string,
  hasDarkClass: boolean
): Record<string, unknown> => {
  const config: Record<string, unknown> = {
    securityLevel: 'loose',
    startOnLoad: false,
  };

  // No theme in light mode: an example should show the default a reader actually gets.
  // Dark mode is the page's choice, so each redesigned type needs its dark counterpart --
  // `look` still comes from the defaults either way.
  if (hasDarkClass) {
    config.theme = 'dark';
    for (const key of COLOR_THEME_DIAGRAMS) {
      config[key] = { theme: 'redux-dark-color' };
    }
  }

  // Layout options the swimlanes syntax page should not have to repeat on every example.
  // Theme and look are left to the defaults.
  if (getDiagramType(source) === 'swimlane-beta') {
    config.flowchart = { titleTopMargin: 10 };
    config.swimlane = {
      ...(config.swimlane as Record<string, unknown> | undefined),
      ignoreCrossLaneEdges: true,
      optimizeRanksByCrossings: true,
    };
  }

  return config;
};
