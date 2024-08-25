import type { Dayjs } from 'dayjs';

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
  manualEndTime?: boolean;
  active?: boolean;
  done?: boolean;
  crit?: boolean;
  milestone?: boolean;
  classes: string[];
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
  startTime: StartTime;
  endTime: EndTime;
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
