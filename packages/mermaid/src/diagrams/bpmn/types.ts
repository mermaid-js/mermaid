/** The vocabulary the grammar accepts, shared between the tokens and the db. */

export const BPMN_DIRECTIONS = ['LR', 'RL', 'TB', 'TD', 'BT'] as const;

/** Event triggers, as the notation names them. `none` is the plain circle. */
export const EVENT_TRIGGERS = [
  'message',
  'timer',
  'signal',
  'conditional',
  'escalation',
  'terminate',
  'error',
  'link',
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
