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
  // Use a forward paren-counting scanner instead of `[^)]*` so that `)` inside
  // quoted arg values (e.g. label="click (me)") does not prematurely close the
  // arg list.
  const useHeadRe = /^[\t ]*use\s+(\w+)\s*\(/gm;
  let m: RegExpExecArray | null;
  const parts: string[] = [];
  let lastIndex = 0;

  while ((m = useHeadRe.exec(source)) !== null) {
    const lineStart = m.index;
    const name = m[1];
    const parenOpen = m.index + m[0].length;

    // Walk forward counting parens to find the matching ')'
    let depth = 1;
    let pos = parenOpen;
    while (pos < source.length && depth > 0) {
      if (source[pos] === '(') {
        depth++;
      } else if (source[pos] === ')') {
        depth--;
      }
      pos++;
    }
    // pos is now one past the closing ')'

    // Only treat as a `use` statement when nothing but whitespace/tabs follows
    // on the same line (mirrors the original `$` anchor).
    const nlPos = source.indexOf('\n', pos);
    const tail = nlPos === -1 ? source.slice(pos) : source.slice(pos, nlPos);
    if (tail.trimEnd() !== '') {
      // Not a standalone use line — skip and continue
      useHeadRe.lastIndex = lineStart + 1;
      continue;
    }

    const argsRaw = source.slice(parenOpen, pos - 1);
    const template = templates.get(name);
    const replacement = template
      ? expandBody(template.body, template.params, parseUseArgs(argsRaw)).trim()
      : `%% [ERROR] Unknown template: ${name}`;

    parts.push(source.slice(lastIndex, lineStart));
    parts.push(replacement);
    lastIndex = nlPos === -1 ? source.length : nlPos + 1;
    useHeadRe.lastIndex = lastIndex;
  }

  parts.push(source.slice(lastIndex));
  return parts.join('');
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
      // Strip surrounding quotes; bare numeric literals are coerced to numbers.
      const unquoted = val.replace(/^"|"$/g, '');
      const num = Number(unquoted);
      props[key] = unquoted !== '' && !Number.isNaN(num) ? num : unquoted;
    }
  }
  return props;
}

/**
 * Extract all `interaction <nodeId> { ... }` blocks from source.
 * Encodes each as a `%% @interact` comment in the returned diagram text.
 *
 * Uses a brace-counting scanner (same approach as extractTemplates) so that
 * `}` inside property string values does not prematurely close the block.
 */
function extractInteractions(source: string): { diagram: string; interactions: InteractionDef[] } {
  const interactions: InteractionDef[] = [];
  const headRe = /^[\t ]*interaction\s+(\w+)\s*{/gm;
  let m: RegExpExecArray | null;
  const parts: string[] = [];
  let lastIndex = 0;

  while ((m = headRe.exec(source)) !== null) {
    const matchStart = m.index;
    const nodeId = m[1];
    const bodyStart = m.index + m[0].length;

    // Walk forward counting braces to find the matching '}'
    let depth = 1;
    let pos = bodyStart;
    while (pos < source.length && depth > 0) {
      if (source[pos] === '{') {
        depth++;
      } else if (source[pos] === '}') {
        depth--;
      }
      pos++;
    }
    // pos is now one past the closing '}'

    const propsRaw = source.slice(bodyStart, pos - 1);
    const props = parseInteractionProps(propsRaw);
    interactions.push({ nodeId, props });

    parts.push(source.slice(lastIndex, matchStart));
    parts.push(`%% @interact ${nodeId} ${JSON.stringify(props)}`);
    lastIndex = pos;
    headRe.lastIndex = lastIndex;
  }

  parts.push(source.slice(lastIndex));
  return { diagram: parts.join(''), interactions };
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
