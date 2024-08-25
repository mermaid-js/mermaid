import type { Dayjs } from 'dayjs';

export interface GanttState {
  dateFormat: string;
  axisFormat: string;
  tickInterval: string;
  todayMarker: string;
  includes: string[];
  excludes: string[];
  links: Map<string, URL>;
  sections: string[];
  tasks: Task[];
  currentSection: string;
  displayMode: string;
  tags: ValidTag[];
  funs: CallableFunction[];
  inclusiveEndDates: boolean;
  topAxis: boolean;
  weekday: Weekday;
  weekend: Weekend;
  lastOrder: number;
  rawTasks: RawTask[];
  lastTask: Task | null;
  lastTaskID: string | null;
  taskDbPositionMap: Map<string, number>;
  taskDb: any;
  taskCount: number;
}

export type Weekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';
export type Weekend = 'saturday' | 'friday';

export type WeekendStartMap = {
  [key in Weekend]: number;
};

interface BaseTask {
  id: string;
  section: string;
  type: string;
  description: string;
  task: string;
  renderEndTime: Date | Dayjs | null;
  classes: string[];
  manualEndTime?: boolean;
  active?: boolean;
  done?: boolean;
  crit?: boolean;
  milestone?: boolean;
}

export interface Task extends BaseTask {
  startTime: Date | Dayjs | null;
  endTime: Date | Dayjs | null;
  links: string[];
}

export interface RawTask extends BaseTask {
  order: number;
  processed: boolean;
  prevTaskId: string | null;
  raw: RawData;
}

export interface TaskInfo extends BaseTask {
  prevTaskId: string | null;
  startTime: Date | Dayjs | null;
  endTime: Date | Dayjs | null;
}

interface StartTime {
  type: 'prevTaskEnd' | 'getStartDate';
  id?: string | null;
  startData?: string;
}

interface EndTime {
  endData: string;
}

export interface RawData {
  startTime: StartTime;
  endTime: EndTime;
}

export type ValidTag = 'active' | 'done' | 'crit' | 'milestone';

export const tagTypes: ValidTag[] = ['active', 'done', 'crit', 'milestone'];

export interface TaskTime {
  startTime: Date | string;
  endTime: Date | string;
}

export interface Link {
  id: string;
  url: URL;
}
