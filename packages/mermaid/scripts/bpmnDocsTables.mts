/**
 * The BPMN documentation tables, built from the source they describe.
 *
 * A table written by hand drifts from what it documents without anything noticing: the
 * spacing defaults on the syntax page read 50 and 60 while the schema and the renderer
 * both said 35 and 40. Generated here, a change to the grammar or the schema leaves
 * `docs/` stale instead, which `docs:verify` already fails on.
 */
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import type { PhrasingContent } from 'mdast';

import { EVENT_TRIGGERS, TASK_TYPES, TRIGGERS_BY_POSITION } from '../src/diagrams/bpmn/types.js';

const text = (value: string): PhrasingContent[] => (value ? [{ type: 'text', value }] : []);
const code = (value: string): PhrasingContent[] => [{ type: 'inlineCode', value }];

/** A GFM table. Its pipes need no aligning: the docs pipeline formats it afterwards. */
function table(headers: string[], rows: PhrasingContent[][][]): string {
  return remark()
    .use(remarkGfm)
    .stringify({
      type: 'root',
      children: [
        {
          type: 'table',
          children: [
            headers.map((heading): PhrasingContent[] => [
              { type: 'strong', children: [{ type: 'text', value: heading }] },
            ]),
            ...rows,
          ].map((row) => ({
            type: 'tableRow',
            children: row.map((cell) => ({ type: 'tableCell', children: cell })),
          })),
        },
      ],
    })
    .toString();
}

const POSITIONS = Object.keys(TRIGGERS_BY_POSITION);

/**
 * Which trigger each event position accepts.
 *
 * The parser refuses every pair left blank here, so this is the table to read before
 * writing an event rather than after the diagram fails to draw.
 */
export function buildBpmnEventMatrix(): string {
  const rows = EVENT_TRIGGERS.map((trigger) => [
    trigger === 'none' ? text('none, or omitted') : code(trigger),
    ...POSITIONS.map((position) =>
      (
        TRIGGERS_BY_POSITION[position as keyof typeof TRIGGERS_BY_POSITION] as readonly string[]
      ).includes(trigger)
        ? text('yes')
        : text('')
    ),
  ]);
  return table(['Trigger', ...POSITIONS], rows);
}

/** What the notation calls each task keyword. An unnamed one falls back to its keyword. */
const TASK_NOTATION: Record<string, string> = {
  user: 'User task',
  service: 'Service task',
  receive: 'Receive task',
  send: 'Send task',
  manual: 'Manual task',
  script: 'Script task',
  rule: 'Business rule task',
};

export function buildBpmnTaskTypes(): string {
  const rows = TASK_TYPES.map((type) => [
    code(`${type} task`),
    text(TASK_NOTATION[type] ?? `${type} task`),
  ]);
  return table(['Written', 'Notation'], rows);
}

interface SchemaProperty {
  type?: string;
  $ref?: string;
  default?: unknown;
  description?: string;
}

/** A default worth printing. Anything structured is left out rather than stringified. */
const defaultText = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : '';

/** Follows an internal `#/a/b/c` reference, so a key described elsewhere still reads. */
function resolveRef(schema: unknown, ref: string): SchemaProperty | undefined {
  if (!ref.startsWith('#/')) {
    return undefined;
  }
  let at: unknown = schema;
  for (const step of ref.slice(2).split('/')) {
    at = (at as Record<string, unknown> | undefined)?.[step];
    if (at === undefined) {
      return undefined;
    }
  }
  return at as SchemaProperty;
}

/**
 * The `bpmn` configuration keys, read from the schema that declares them.
 *
 * The renderer repeats these defaults as its own fallbacks, deliberately, so a fallback
 * disagreeing with the schema would make a diagram draw differently than it documents.
 */
export function buildBpmnConfig(): string {
  const schema = load(
    readFileSync(new URL('../src/schemas/config.schema.yaml', import.meta.url), 'utf8')
  ) as { $defs?: { BpmnDiagramConfig?: { properties?: Record<string, SchemaProperty> } } };

  const properties = schema.$defs?.BpmnDiagramConfig?.properties ?? {};
  const rows = Object.entries(properties).map(([key, property]) => {
    const referenced = property.$ref ? resolveRef(schema, property.$ref) : undefined;
    const type = property.type ?? referenced?.type ?? '';
    const description = property.description ?? referenced?.description ?? '';
    const shown = defaultText(property.default);
    return [
      code(key),
      text(type),
      shown ? code(shown) : text(''),
      text(description.trim().replace(/\s+/g, ' ')),
    ];
  });
  return table(['Key', 'Type', 'Default', 'Description'], rows);
}
