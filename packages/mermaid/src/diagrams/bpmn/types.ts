/** The vocabulary the grammar accepts, shared between the tokens and the db. */

export const BPMN_DIRECTIONS = ['LR', 'RL', 'TB', 'TD', 'BT'] as const;

/**
 * Event triggers, as the notation names them. `none` is the plain circle.
 *
 * These are the thirteen types of Table 10.93 in BPMN 2.0.2. `parallel-multiple` precedes
 * `multiple` so the longer keyword is matched first.
 */
export const EVENT_TRIGGERS = [
  'message',
  'timer',
  'error',
  'escalation',
  'cancel',
  'compensation',
  'conditional',
  'link',
  'signal',
  'terminate',
  'parallel-multiple',
  'multiple',
  'none',
] as const;

/** Task types, each of which draws its own corner glyph. */
export const TASK_TYPES = [
  'user',
  'service',
  'receive',
  'send',
  'manual',
  'script',
  'rule',
] as const;

/**
 * The triggers each event position accepts, from the BPMN 2.0.2 table of event types.
 *
 * Two of these are wider than the notation, because the grammar cannot express the
 * context the notation reads them in. `error`, `escalation` and `compensation` start an
 * event sub-process rather than a process, and `cancel` belongs to a transaction; neither
 * containment can be written here, so both are accepted wherever the enclosing element
 * would decide it.
 */
export const TRIGGERS_BY_POSITION = {
  start: [
    'none',
    'message',
    'timer',
    'conditional',
    'signal',
    'multiple',
    'parallel-multiple',
    'error',
    'escalation',
    'compensation',
  ],
  intermediate: [
    'message',
    'timer',
    'conditional',
    'link',
    'signal',
    'multiple',
    'parallel-multiple',
  ],
  throw: ['none', 'message', 'escalation', 'compensation', 'link', 'signal', 'multiple'],
  boundary: [
    'message',
    'timer',
    'error',
    'escalation',
    'cancel',
    'compensation',
    'conditional',
    'signal',
    'multiple',
    'parallel-multiple',
  ],
  end: [
    'none',
    'message',
    'error',
    'escalation',
    'cancel',
    'compensation',
    'signal',
    'terminate',
    'multiple',
  ],
} as const satisfies Record<string, readonly EventTrigger[]>;

/** The positions an event carrying this trigger may be drawn at. */
export const positionsFor = (trigger: string): string[] =>
  Object.entries(TRIGGERS_BY_POSITION)
    .filter(([, triggers]) => (triggers as readonly string[]).includes(trigger))
    .map(([position]) => position);

export type BpmnDirection = (typeof BPMN_DIRECTIONS)[number];
export type EventTrigger = (typeof EVENT_TRIGGERS)[number];
export type TaskType = (typeof TASK_TYPES)[number];
