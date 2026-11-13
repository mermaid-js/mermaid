export const BPMN_DIRECTIONS = ['LR', 'RL', 'TB', 'TD', 'BT'] as const;

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

export const TASK_TYPES = [
  'user',
  'service',
  'receive',
  'send',
  'manual',
  'script',
  'rule',
] as const;

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

export const positionsFor = (trigger: string): string[] =>
  Object.entries(TRIGGERS_BY_POSITION)
    .filter(([, triggers]) => (triggers as readonly string[]).includes(trigger))
    .map(([position]) => position);

export type BpmnDirection = (typeof BPMN_DIRECTIONS)[number];
export type EventTrigger = (typeof EVENT_TRIGGERS)[number];
export type TaskType = (typeof TASK_TYPES)[number];
