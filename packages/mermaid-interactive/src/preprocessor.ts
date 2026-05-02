import type {
  InteractionDef,
  InteractionProps,
  ParamDef,
  PreprocessResult,
  Template,
} from './types.js';

// ---------------------------------------------------------------------------
// Template extraction
// ---------------------------------------------------------------------------

/** Parse parameter definitions from a template signature string, e.g. "name, services[]" */
function parseParamDefs(raw: string): ParamDef[] {
  return raw
    .split(',')
    .map((p) => {
      const trimmed = p.trim();
      const isArray = trimmed.endsWith('[]');
      return { name: isArray ? trimmed.slice(0, -2).trim() : trimmed, isArray };
    })
    .filter((p) => p.name.length > 0);
}

/**
 * Extract all `template NAME(params) { body }` blocks from source.
 * Returns the parsed templates and the source with template blocks removed.
 */
function extractTemplates(source: string): { templates: Map<string, Template>; remaining: string } {
  const templates = new Map<string, Template>();
  let remaining = source;

  // Process templates one at a time since we mutate `remaining`
  const startRe = /^[\t ]*template\s+(\w+)\s*\(([^)]*)\)\s*{/m;
  let match: RegExpExecArray | null;

  while ((match = startRe.exec(remaining)) !== null) {
    const [fullMatch, name, paramStr] = match;
    const params = parseParamDefs(paramStr);
    const bodyStart = match.index + fullMatch.length;

    // Walk forward tracking brace depth to find matching close
    let depth = 1;
    let pos = bodyStart;
    while (pos < remaining.length && depth > 0) {
      if (remaining[pos] === '{') {
        depth++;
      } else if (remaining[pos] === '}') {
        depth--;
      }
      pos++;
    }

    const body = remaining.slice(bodyStart, pos - 1);
    templates.set(name, { name, params, body });

    // Remove the full template block from remaining source
    remaining = remaining.slice(0, match.index) + remaining.slice(pos);
  }

  return { templates, remaining };
}

// ---------------------------------------------------------------------------
// Template invocation expansion
// ---------------------------------------------------------------------------

/** Parse `use` invocation arguments into a key→value(s) map. */
function parseUseArgs(raw: string): Map<string, string | string[]> {
  const args = new Map<string, string | string[]>();
  // Matches:  key="value"  or  key=["a", "b", ...]
  const argRe = /(\w+)\s*=\s*(?:\[([^\]]*)]|"([^"]*)")/g;
  let m: RegExpExecArray | null;
  while ((m = argRe.exec(raw)) !== null) {
    const key = m[1];
    if (m[2] !== undefined) {
      // Array literal: split on commas, strip quotes
      const items = m[2].split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
      args.set(key, items);
    } else {
      args.set(key, m[3]);
    }
  }
  return args;
}

/** Substitute all template parameters into the body text. */
function expandBody(
  body: string,
  params: ParamDef[],
  args: Map<string, string | string[]>
): string {
  let result = body;
  for (const param of params) {
    const value = args.get(param.name);
    if (value === undefined) {
      continue;
    }

    if (param.isArray && Array.isArray(value)) {
      // Replace `paramName[N]` with the Nth value
      value.forEach((v, idx) => {
        const pattern = new RegExp(`${escapeRegex(param.name)}\\[${idx}\\]`, 'g');
        result = result.replace(pattern, v);
      });
    } else if (!param.isArray && typeof value === 'string') {
      // Replace whole-word occurrences of paramName
      const pattern = new RegExp(`\\b${escapeRegex(param.name)}\\b`, 'g');
      result = result.replace(pattern, value);
    }
  }
  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
}

/** Expand all `use NAME(...)` invocations using the provided template map. */
function expandUse(source: string, templates: Map<string, Template>): string {
  return source.replace(
    /^[\t ]*use\s+(\w+)\s*\(([^)]*)\)[\t ]*$/gm,
    (_match, name: string, argsRaw: string) => {
      const template = templates.get(name);
      if (!template) {
        return `%% [ERROR] Unknown template: ${name}`;
      }
      const args = parseUseArgs(argsRaw);
      return expandBody(template.body, template.params, args).trim();
    }
  );
}

// ---------------------------------------------------------------------------
// Interaction block extraction
// ---------------------------------------------------------------------------

/** Parse key-value pairs from an interaction block body. */
function parseInteractionProps(raw: string): InteractionProps {
  const props: InteractionProps = {};
  for (const line of raw.split('\n')) {
    const m = /^\s*(\w+)\s*:\s*(.+?)\s*$/.exec(line);
    if (!m) {
      continue;
    }
    const [, key, val] = m;
    if (val === 'true') {
      props[key] = true;
    } else if (val === 'false') {
      props[key] = false;
    } else {
      // Strip surrounding quotes if present
      props[key] = val.replace(/^"|"$/g, '');
    }
  }
  return props;
}

/**
 * Extract all `interaction <nodeId> { ... }` blocks from source.
 * Encodes each as a `%% @interact` comment in the returned diagram text.
 */
function extractInteractions(source: string): { diagram: string; interactions: InteractionDef[] } {
  const interactions: InteractionDef[] = [];

  const diagram = source.replace(
    /^[\t ]*interaction\s+(\w+)\s*{([^}]*)}/gm,
    (_match, nodeId: string, propsRaw: string) => {
      const props = parseInteractionProps(propsRaw);
      interactions.push({ nodeId, props });
      return `%% @interact ${nodeId} ${JSON.stringify(props)}`;
    }
  );

  return { diagram, interactions };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Preprocess extended Mermaid syntax into standard Mermaid.
 *
 * Handles:
 * - `template NAME(params) { ... }` definitions
 * - `use NAME(key=value)` invocations
 * - `interaction <nodeId> { ... }` blocks (encoded as %% comments)
 *
 * @param source - Extended Mermaid source text
 * @returns PreprocessResult with standard Mermaid diagram and extracted interactions
 */
export function preprocess(source: string): PreprocessResult {
  const { templates, remaining } = extractTemplates(source);
  const expanded = expandUse(remaining, templates);
  const { diagram, interactions } = extractInteractions(expanded);
  return { diagram: diagram.trimStart(), interactions };
}
