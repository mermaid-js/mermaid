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

export type BpmnDirection = (typeof BPMN_DIRECTIONS)[number];
export type EventTrigger = (typeof EVENT_TRIGGERS)[number];
export type TaskType = (typeof TASK_TYPES)[number];
