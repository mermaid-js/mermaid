import type { RawTask, Task } from './gantt.type.js';

export function transformRawToTask(raw: RawTask): Task {
  return {
    id: raw.id,
    section: raw.section,
    type: raw.type,
    description: raw.description,
    task: raw.task,
    renderEndTime: raw.renderEndTime,
    classes: [...raw.classes],
    manualEndTime: raw.manualEndTime,
    active: raw.active,
    done: raw.done,
    crit: raw.crit,
    milestone: raw.milestone,
    order: raw.order,
    prevTaskId: raw.prevTaskId,
    startTime: raw.startTime,
    endTime: raw.endTime,
    links: [],
  };
}
