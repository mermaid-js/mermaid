import type { SyntaxIdentifier } from './types.js';

export const collectIdentifiers = (
  text: string,
  patterns: readonly RegExp[]
): SyntaxIdentifier[] => {
  const found = new Map<string, SyntaxIdentifier>();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      for (const group of match.slice(1)) {
        const name = group?.trim().replaceAll(/^"|"$/g, '');
        if (name && /^[A-Z_a-z][\w.-]*$/.test(name) && !found.has(name)) {
          found.set(name, { name });
        }
      }
    }
  }
  return [...found.values()];
};

export const FLOWCHART_EDGE =
  '<?-\\.+->?|<?--+>|<?==+>|-\\.-|~~~|--[ox]|==[ox]|<-->|<==>|o--o|x--x|--+|==+';

export const FLOWCHART_IDENTIFIER_PATTERNS = [
  /^[\t ]*([A-Z_a-z][\w-]*)\s*[(>[{]/gm,
  /^[\t ]*subgraph\s+([A-Z_a-z][\w-]*)/gm,
  new RegExp(`([A-Z_a-z][\\w-]*)\\s*(?:${FLOWCHART_EDGE})\\s*([A-Z_a-z][\\w-]*)`, 'g'),
  new RegExp(`(?:${FLOWCHART_EDGE})\\s*(?:\\|[^|\\n]*\\|\\s*)?([A-Z_a-z][\\w-]*)`, 'g'),
  /^[\t ]*(?:style|class|click|linkStyle)\s+([A-Z_a-z][\w-]*)/gm,
  /&\s*([A-Z_a-z][\w-]*)/g,
];

export const flowchartIdentifiers = (text: string): SyntaxIdentifier[] => {
  const labels = new Map<string, string>();
  for (const match of text.matchAll(/([A-Z_a-z][\w-]*)\s*[(>[{]([^\n")\]}]+)/g)) {
    const [, id, rawLabel] = match;
    const label = rawLabel?.replaceAll(/^[^\dA-Za-z]+|[^\dA-Za-z]+$/g, '');
    if (id && label && !labels.has(id)) {
      labels.set(id, label);
    }
  }
  return collectIdentifiers(text, FLOWCHART_IDENTIFIER_PATTERNS).map((identifier) => {
    const detail = labels.get(identifier.name);
    return detail ? { detail, name: identifier.name } : identifier;
  });
};

export const SEQUENCE_IDENTIFIER_PATTERNS = [
  /^[\t ]*(?:create\s+)?(?:participant|actor)\s+([A-Z_a-z][\w.-]*)/gm,
  /([A-Z_a-z][\w.-]*)\s*(?:--?>>?|--?[)x])\s*([A-Z_a-z][\w.-]*)/g,
  /^[\t ]*(?:activate|deactivate)\s+([A-Z_a-z][\w.-]*)/gm,
  /(?:left of|right of|over)\s+([_a-z][\w.-]*)\s*,\s*([_a-z][\w.-]*)?/gim,
];

export const CLASS_IDENTIFIER_PATTERNS = [
  /^[\t ]*(?:class|namespace)\s+([A-Z_a-z][\w-]*)/gm,
  /^[\t ]*([A-Z_a-z][\w-]*)\s*:/gm,
  /([A-Z_a-z][\w-]*)\s*(?:<\|--|\|>--|--\|>|<\|\.\.|\.\.\|>|\*--|--\*|o--|--o|-->|<--|\.\.>|<\.\.|--|\.\.)\s*([A-Z_a-z][\w-]*)/g,
];

export const STATE_IDENTIFIER_PATTERNS = [
  /^[\t ]*state\s+"[^"]*"\s+as\s+([A-Z_a-z][\w-]*)/gm,
  /^[\t ]*state\s+([A-Z_a-z][\w-]*)/gm,
  /([A-Z_a-z][\w-]*|\[\*])\s*-->\s*([A-Z_a-z][\w-]*|\[\*])/g,
];

export const ER_IDENTIFIER_PATTERNS = [
  /([A-Z_a-z][\w-]*)\s*(?:\|\||\|o|o\||}o|o{|}\||\|{)(?:--|\.\.)(?:\|\||\|o|o\||}o|o{|}\||\|{)\s*([A-Z_a-z][\w-]*)/g,
  /^[\t ]*([A-Z_a-z][\w-]*)\s*{/gm,
];

export const REQUIREMENT_IDENTIFIER_PATTERNS = [
  /^[\t ]*(?:element|requirement|functionalRequirement|interfaceRequirement|performanceRequirement|physicalRequirement|designConstraint)\s+([A-Z_a-z][\w-]*)/gm,
  /([A-Z_a-z][\w-]*)\s*-\s*(?:contains|copies|derives|satisfies|verifies|refines|traces)\s*->\s*([A-Z_a-z][\w-]*)/g,
];

export const C4_IDENTIFIER_PATTERNS = [
  /\b(?:Person|System|Container|Component|Deployment_Node|Node|Boundary|Enterprise_Boundary|System_Boundary|Container_Boundary)(?:Queue|Db)?(?:_Ext)?(?:_L|_R)?\s*\(\s*([A-Z_a-z][\w-]*)/g,
];

export const GIT_GRAPH_IDENTIFIER_PATTERNS = [
  /^[\t ]*(?:branch|checkout|merge|reset)\s+([A-Z_a-z][\w./-]*)/gm,
  /(?:commit|cherry-pick)\s+id:\s*"?([A-Z_a-z][\w.-]*)"?/g,
  /commit\s+tag:\s*"?([A-Z_a-z][\w.-]*)"?/g,
];
