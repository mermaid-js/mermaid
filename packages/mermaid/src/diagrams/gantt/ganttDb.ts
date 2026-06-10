import { sanitizeUrl } from '@braintree/sanitize-url';
import dayjs from 'dayjs';
import dayjsIsoWeek from 'dayjs/plugin/isoWeek.js';
import dayjsCustomParseFormat from 'dayjs/plugin/customParseFormat.js';
import dayjsAdvancedFormat from 'dayjs/plugin/advancedFormat.js';
import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import utils from '../../utils.js';
import type { GanttDiagramConfig } from '../../config.type.js';

import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';

dayjs.extend(dayjsIsoWeek);
dayjs.extend(dayjsCustomParseFormat);
dayjs.extend(dayjsAdvancedFormat);

/**
 * A gantt diagram task, as returned by {@link getTasks}.
 */
export interface Task {
  id: string;
  section: string;
  type: string;
  /** The label of the task (the text rendered next to the task bar). */
  task: string;
  /** Only set by the legacy {@link addTaskOrg} flow. */
  description?: string;
  startTime: Date;
  endTime: Date;
  /**
   * The end time to render. May differ from `endTime` when dates are excluded
   * via `excludes`. `null` when the end time is a manually fixed date.
   */
  renderEndTime?: Date | null;
  /** `true` if the end date was set manually (a fixed `YYYY-MM-DD` date). */
  manualEndTime?: boolean;
  processed?: boolean;
  /** The id of the task that came before this one in the diagram source. */
  prevTaskId?: string;
  /** CSS classes added via `setClass` (e.g. `clickable` for click bindings). */
  classes: string[];
  /** The serial order of the task in the script (`-1` for `vert` tasks). */
  order: number;
  active?: boolean;
  done?: boolean;
  crit?: boolean;
  milestone?: boolean;
  vert?: boolean;
}

/**
 * The unprocessed start time of a task, as produced by the parser.
 *
 * Either the end time of the previous task (`prevTaskEnd`), or a date string
 * that still needs to be parsed (`getStartDate`).
 */
export type RawTaskStartTime =
  | {
      type: 'prevTaskEnd';
      /** The id of the previous task. */
      id?: string;
    }
  | {
      type: 'getStartDate';
      /** The date string to parse. */
      startData: string;
    };

/** The unprocessed end time of a task, as produced by the parser. */
export interface RawTaskEndTime {
  /** The end date string or duration string to parse. */
  data: string;
}

/**
 * A task as stored internally before (and while) being compiled by
 * {@link getTasks}. `id`, `order`, `startTime` and `endTime` are filled in
 * during parsing/compilation.
 */
export interface RawTask
  extends Omit<Task, 'id' | 'order' | 'startTime' | 'endTime' | 'processed'> {
  id?: string;
  order?: number;
  startTime?: Date;
  endTime?: Date;
  processed: boolean;
  raw: {
    data: string;
    startTime?: RawTaskStartTime;
    endTime?: RawTaskEndTime;
  };
}

const tags = ['active', 'done', 'crit', 'milestone', 'vert'] as const;
type TaskTag = (typeof tags)[number];
type TaskTags = Partial<Record<TaskTag, boolean>>;

/** The task data produced by the parser, before compilation. */
interface ParsedTaskInfo extends TaskTags {
  id?: string;
  startTime?: RawTaskStartTime;
  endTime?: RawTaskEndTime;
}

/** The task data produced by the legacy {@link addTaskOrg} flow. */
interface CompiledTaskInfo extends TaskTags {
  id?: string;
  startTime?: Date;
  endTime?: Date;
  manualEndTime?: boolean;
  renderEndTime?: Date | null;
}

export type Weekday = Exclude<GanttDiagramConfig['weekday'], undefined>;

const WEEKEND_START_DAY = { friday: 5, saturday: 6 } as const;
export type Weekend = keyof typeof WEEKEND_START_DAY;

let dateFormat = '';
let axisFormat = '';
let tickInterval: string | undefined = undefined;
let todayMarker = '';
let includes: string[] = [];
let excludes: string[] = [];
let links = new Map<string, string>();
let sections: string[] = [];
let tasks: Task[] = [];
let currentSection = '';
let displayMode = '';
let funs: ((element: Element) => void)[] = [];
let diagramId = '';
let inclusiveEndDates = false;
let topAxis = false;
let weekday: Weekday = 'sunday';
let weekend: Weekend = 'saturday';

// The serial order of the task in the script
let lastOrder = 0;

export const clear = function () {
  sections = [];
  tasks = [];
  currentSection = '';
  funs = [];
  taskCnt = 0;
  lastTask = undefined;
  lastTaskID = undefined;
  rawTasks = [];
  dateFormat = '';
  axisFormat = '';
  displayMode = '';
  tickInterval = undefined;
  todayMarker = '';
  includes = [];
  excludes = [];
  inclusiveEndDates = false;
  topAxis = false;
  lastOrder = 0;
  links = new Map();
  diagramId = '';
  commonClear();
  weekday = 'sunday';
  weekend = 'saturday';
};

export const setDiagramId = function (id: string) {
  diagramId = id;
};

export const setAxisFormat = function (txt: string) {
  axisFormat = txt;
};

export const getAxisFormat = function () {
  return axisFormat;
};

export const setTickInterval = function (txt: string) {
  tickInterval = txt;
};

export const getTickInterval = function () {
  return tickInterval;
};

export const setTodayMarker = function (txt: string) {
  todayMarker = txt;
};

export const getTodayMarker = function () {
  return todayMarker;
};

export const setDateFormat = function (txt: string) {
  dateFormat = txt;
};

export const enableInclusiveEndDates = function () {
  inclusiveEndDates = true;
};

export const endDatesAreInclusive = function () {
  return inclusiveEndDates;
};

export const enableTopAxis = function () {
  topAxis = true;
};

export const topAxisEnabled = function () {
  return topAxis;
};

export const setDisplayMode = function (txt: string) {
  displayMode = txt;
};

export const getDisplayMode = function () {
  return displayMode;
};

export const getDateFormat = function () {
  return dateFormat;
};

const mergeTokens = (existing: string[], txt: string) => {
  const tokens = txt
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t !== '');
  return [...new Set([...existing, ...tokens])];
};

export const setIncludes = function (txt: string) {
  includes = mergeTokens(includes, txt);
};

export const getIncludes = function () {
  return includes;
};
export const setExcludes = function (txt: string) {
  excludes = mergeTokens(excludes, txt);
};

export const getExcludes = function () {
  return excludes;
};

export const getLinks = function () {
  return links;
};

export const addSection = function (txt: string) {
  currentSection = txt;
  sections.push(txt);
};

export const getSections = function () {
  return sections;
};

export const getTasks = function () {
  let allItemsProcessed = compileTasks();
  const maxDepth = 10;
  let iterationCount = 0;
  while (!allItemsProcessed && iterationCount < maxDepth) {
    allItemsProcessed = compileTasks();
    iterationCount++;
  }

  tasks = rawTasks as unknown as Task[];

  return tasks;
};

export const isInvalidDate = function (
  date: dayjs.Dayjs,
  dateFormat: string,
  excludes: string[],
  includes: string[]
): boolean {
  const formattedDate = date.format(dateFormat.trim());
  const dateOnly = date.format('YYYY-MM-DD');

  if (includes.includes(formattedDate) || includes.includes(dateOnly)) {
    return false;
  }
  if (
    excludes.includes('weekends') &&
    (date.isoWeekday() === WEEKEND_START_DAY[weekend] ||
      date.isoWeekday() === WEEKEND_START_DAY[weekend] + 1)
  ) {
    return true;
  }
  if (excludes.includes(date.format('dddd').toLowerCase())) {
    return true;
  }
  return excludes.includes(formattedDate) || excludes.includes(dateOnly);
};

export const setWeekday = function (txt: Weekday) {
  weekday = txt;
};

export const getWeekday = function () {
  return weekday;
};

export const setWeekend = function (startDay: Weekend) {
  weekend = startDay;
};

/**
 * TODO: fully document what this function does and what types it accepts
 *
 * @param task - The task to check. `task.startTime` and `task.endTime` might
 * be a `Date` or a `string`. TODO: are they always a Date?
 * @param dateFormat - Dayjs date format string.
 * @param excludes - Dates or days to exclude.
 * @param includes - Dates to always include, even if they match the excludes.
 */
const checkTaskDates = function (
  task: Pick<RawTask, 'startTime' | 'endTime' | 'manualEndTime' | 'renderEndTime'>,
  dateFormat: string,
  excludes: string[],
  includes: string[]
) {
  if (!excludes.length || task.manualEndTime) {
    return;
  }
  let startTime;
  if (task.startTime instanceof Date) {
    startTime = dayjs(task.startTime);
  } else {
    startTime = dayjs(task.startTime, dateFormat, true);
  }
  startTime = startTime.add(1, 'd');

  let originalEndTime;
  if (task.endTime instanceof Date) {
    originalEndTime = dayjs(task.endTime);
  } else {
    originalEndTime = dayjs(task.endTime, dateFormat, true);
  }
  const [fixedEndTime, renderEndTime] = fixTaskDates(
    startTime,
    originalEndTime,
    dateFormat,
    excludes,
    includes
  );
  task.endTime = fixedEndTime.toDate();
  task.renderEndTime = renderEndTime;
};

/**
 * TODO: what does this function do?
 *
 * @param startTime - The start time.
 * @param endTime - The original end time (will return a different end time if it's invalid).
 * @param dateFormat - Dayjs date format string.
 * @param excludes - Dates or days to exclude.
 * @param includes - Dates to always include, even if they match the excludes.
 * @returns The new `endTime`, and the end time to render.
 * `renderEndTime` may be `null` if `startTime` is newer than `endTime`.
 * @throws Error if a valid end time cannot be found after 10,000 iterations.
 */
const fixTaskDates = function (
  startTime: dayjs.Dayjs,
  endTime: dayjs.Dayjs,
  dateFormat: string,
  excludes: string[],
  includes: string[]
): [endTime: dayjs.Dayjs, renderEndTime: Date | null] {
  let invalid = false;
  let renderEndTime: Date | null = null;
  const maxEndTime = endTime.add(10000, 'd');
  while (startTime <= endTime) {
    if (!invalid) {
      renderEndTime = endTime.toDate();
    }
    invalid = isInvalidDate(startTime, dateFormat, excludes, includes);
    if (invalid) {
      endTime = endTime.add(1, 'd');
      if (endTime > maxEndTime) {
        throw new Error(
          'Failed to find a valid date that was not excluded by `excludes` after 10,000 iterations.'
        );
      }
    }
    startTime = startTime.add(1, 'd');
  }
  return [endTime, renderEndTime];
};

const getStartDate = function (prevTime: Date | undefined, dateFormat: string, str: string): Date {
  str = str.trim();

  // Helper function to check if format is a timestamp format (x or X)
  const isTimestampFormat = (format: string) => {
    const trimmedFormat = format.trim();
    return trimmedFormat === 'x' || trimmedFormat === 'X';
  };

  // Handle timestamp formats (x, X) with numeric strings
  if (isTimestampFormat(dateFormat) && /^\d+$/.test(str)) {
    return new Date(Number(str));
  }
  // Test for after
  const afterRePattern = /^after\s+(?<ids>[\d\w- ]+)/;
  const afterStatement = afterRePattern.exec(str);

  if (afterStatement !== null) {
    // check all after ids and take the latest
    let latestTask: RawTask | null = null;
    // The `ids` named group always exists on a successful match.
    for (const id of afterStatement.groups!.ids.split(' ')) {
      const task = findTaskById(id);
      // The explicit `undefined` checks mirror the original comparison, where a
      // comparison against a not-yet-compiled (undefined) end time was false.
      if (
        task !== undefined &&
        (!latestTask ||
          (task.endTime !== undefined &&
            latestTask.endTime !== undefined &&
            task.endTime > latestTask.endTime))
      ) {
        latestTask = task;
      }
    }

    if (latestTask) {
      // The referenced task may not have been compiled yet, in which case the
      // original code returned `undefined` here (so the caller retries on the
      // next compile pass). The assertion preserves that behavior.
      return latestTask.endTime!;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  // Check for actual date set using dayjs strict parsing
  const mDate = dayjs(str, dateFormat.trim(), true);
  if (mDate.isValid()) {
    return mDate.toDate();
  } else {
    log.debug('Invalid date:' + str);
    log.debug('With date format:' + dateFormat.trim());

    // Timestamp formats can fall back to new Date()
    const d = new Date(str);
    if (
      d === undefined ||
      isNaN(d.getTime()) ||
      // WebKit browsers can mis-parse invalid dates to be ridiculously
      // huge numbers, e.g. new Date('202304') gets parsed as January 1, 202304.
      // This can cause virtually infinite loops while rendering, so for the
      // purposes of Gantt charts we'll just treat any date beyond 10,000 AD/BC as
      // invalid.
      d.getFullYear() < -10000 ||
      d.getFullYear() > 10000
    ) {
      throw new Error('Invalid date:' + str);
    }
    return d;
  }
};

/**
 * Parse a string into the args for `dayjs.add()`.
 *
 * The string have to be compound by a value and a shorthand duration unit. For example `5d`
 * represents 5 days.
 *
 * Please be aware that 1 day may be 23 or 25 hours, if the user lives in an area
 * that has daylight savings time (or even 23.5/24.5 hours in Lord Howe Island!)
 *
 * Shorthand unit supported are:
 *
 * - `y` for years
 * - `M` for months
 * - `w` for weeks
 * - `d` for days
 * - `h` for hours
 * - `s` for seconds
 * - `ms` for milliseconds
 *
 * @param str - A string representing the duration.
 * @returns Arguments to pass to `dayjs.add()`
 */
const parseDuration = function (str: string): [value: number, unit: dayjs.ManipulateType] {
  // cspell:disable-next-line
  const statement = /^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(str.trim());
  if (statement !== null) {
    return [Number.parseFloat(statement[1]), statement[2] as dayjs.ManipulateType];
  }
  // NaN means an invalid duration
  return [NaN, 'ms'];
};

const getEndDate = function (
  prevTime: Date | undefined,
  dateFormat: string,
  str: string,
  inclusive = false
): Date {
  str = str.trim();

  // test for until
  const untilRePattern = /^until\s+(?<ids>[\d\w- ]+)/;
  const untilStatement = untilRePattern.exec(str);

  if (untilStatement !== null) {
    // check all until ids and take the earliest
    let earliestTask: RawTask | null = null;
    // The `ids` named group always exists on a successful match.
    for (const id of untilStatement.groups!.ids.split(' ')) {
      const task = findTaskById(id);
      // The explicit `undefined` checks mirror the original comparison, where a
      // comparison against a not-yet-compiled (undefined) start time was false.
      if (
        task !== undefined &&
        (!earliestTask ||
          (task.startTime !== undefined &&
            earliestTask.startTime !== undefined &&
            task.startTime < earliestTask.startTime))
      ) {
        earliestTask = task;
      }
    }

    if (earliestTask) {
      // The referenced task may not have been compiled yet, in which case the
      // original code returned `undefined` here (so the caller retries on the
      // next compile pass). The assertion preserves that behavior.
      return earliestTask.startTime!;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  // check for actual date
  let parsedDate = dayjs(str, dateFormat.trim(), true);
  if (parsedDate.isValid()) {
    if (inclusive) {
      parsedDate = parsedDate.add(1, 'd');
    }
    return parsedDate.toDate();
  }

  let endTime = dayjs(prevTime);
  const [durationValue, durationUnit] = parseDuration(str);
  if (!Number.isNaN(durationValue)) {
    const newEndTime = endTime.add(durationValue, durationUnit);
    if (newEndTime.isValid()) {
      endTime = newEndTime;
    }
  }
  return endTime.toDate();
};

let taskCnt = 0;
const parseId = function (idStr?: string) {
  if (idStr === undefined) {
    taskCnt = taskCnt + 1;
    return 'task' + taskCnt;
  }
  return idStr;
};
// id, startDate, endDate
// id, startDate, length
// id, after x, endDate
// id, after x, length
// startDate, endDate
// startDate, length
// after x, endDate
// after x, length
// endDate
// length

const compileData = function (prevTask: Task, dataStr: string) {
  let ds;

  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  const data = ds.split(',');

  const task: CompiledTaskInfo = {};

  // Get tags like active, done, crit, milestone, and vert
  getTaskTags(data, task, tags);

  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  let endTimeData = '';
  switch (data.length) {
    case 1:
      task.id = parseId();
      task.startTime = prevTask.endTime;
      endTimeData = data[0];
      break;
    case 2:
      task.id = parseId();
      task.startTime = getStartDate(undefined, dateFormat, data[0]);
      endTimeData = data[1];
      break;
    case 3:
      task.id = parseId(data[0]);
      task.startTime = getStartDate(undefined, dateFormat, data[1]);
      endTimeData = data[2];
      break;
    default:
  }

  if (endTimeData) {
    task.endTime = getEndDate(task.startTime, dateFormat, endTimeData, inclusiveEndDates);
    task.manualEndTime = dayjs(endTimeData, 'YYYY-MM-DD', true).isValid();
    checkTaskDates(task, dateFormat, excludes, includes);
  }

  return task;
};

const parseData = function (prevTaskId: string | undefined, dataStr: string) {
  let ds;
  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  const data = ds.split(',');

  const task: ParsedTaskInfo = {};

  // Get tags like active, done, crit, milestone, and vert
  getTaskTags(data, task, tags);

  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  switch (data.length) {
    case 1:
      task.id = parseId();
      task.startTime = {
        type: 'prevTaskEnd',
        id: prevTaskId,
      };
      task.endTime = {
        data: data[0],
      };
      break;
    case 2:
      task.id = parseId();
      task.startTime = {
        type: 'getStartDate',
        startData: data[0],
      };
      task.endTime = {
        data: data[1],
      };
      break;
    case 3:
      task.id = parseId(data[0]);
      task.startTime = {
        type: 'getStartDate',
        startData: data[1],
      };
      task.endTime = {
        data: data[2],
      };
      break;
    default:
  }

  return task;
};

let lastTask: Task | undefined;
let lastTaskID: string | undefined;
let rawTasks: RawTask[] = [];
const taskDb: Record<string, number> = {};
export const addTask = function (descr: string, data: string) {
  const rawTask: RawTask = {
    section: currentSection,
    type: currentSection,
    processed: false,
    manualEndTime: false,
    renderEndTime: null,
    raw: { data: data },
    task: descr,
    classes: [],
  };
  const taskInfo = parseData(lastTaskID, data);
  rawTask.raw.startTime = taskInfo.startTime;
  rawTask.raw.endTime = taskInfo.endTime;
  rawTask.id = taskInfo.id;
  rawTask.prevTaskId = lastTaskID;
  rawTask.active = taskInfo.active;
  rawTask.done = taskInfo.done;
  rawTask.crit = taskInfo.crit;
  rawTask.milestone = taskInfo.milestone;
  rawTask.vert = taskInfo.vert;

  if (rawTask.vert) {
    rawTask.order = -1;
  } else {
    rawTask.order = lastOrder;
    lastOrder++;
  }

  const pos = rawTasks.push(rawTask);

  lastTaskID = rawTask.id;
  // Store cross ref (the id is only missing for unparsable task data)
  if (rawTask.id !== undefined) {
    taskDb[rawTask.id] = pos - 1;
  }
};

export const findTaskById = function (id: string): RawTask | undefined {
  const pos = taskDb[id];
  return rawTasks[pos];
};

export const addTaskOrg = function (descr: string, data: string) {
  const newTask: Partial<Task> = {
    section: currentSection,
    type: currentSection,
    description: descr,
    task: descr,
    classes: [],
  };
  // `lastTask` is undefined for the first task; the legacy flow assumes the
  // first task's data always contains an explicit start date (and crashed
  // otherwise), so the assertion preserves the original behavior.
  const taskInfo = compileData(lastTask!, data);
  newTask.startTime = taskInfo.startTime;
  newTask.endTime = taskInfo.endTime;
  newTask.id = taskInfo.id;
  newTask.active = taskInfo.active;
  newTask.done = taskInfo.done;
  newTask.crit = taskInfo.crit;
  newTask.milestone = taskInfo.milestone;
  newTask.vert = taskInfo.vert;
  lastTask = newTask as Task;
  tasks.push(newTask as Task);
};

const compileTasks = function () {
  const compileTask = function (pos: number) {
    const task = rawTasks[pos];
    const rawStartTime = task.raw.startTime;
    if (rawStartTime === undefined) {
      // Only happens for unparsable task data, which previously crashed here.
      throw new Error(`Gantt task "${task.task}" is missing its start time data`);
    }
    switch (rawStartTime.type) {
      case 'prevTaskEnd': {
        const prevTask = task.prevTaskId === undefined ? undefined : findTaskById(task.prevTaskId);
        if (prevTask === undefined) {
          // Previously crashed with a TypeError when there was no previous task.
          throw new Error(`Cannot find the previous task of gantt task "${task.task}"`);
        }
        task.startTime = prevTask.endTime;
        break;
      }
      case 'getStartDate': {
        const startTime = getStartDate(undefined, dateFormat, rawStartTime.startData);
        if (startTime) {
          task.startTime = startTime;
        }
        break;
      }
    }

    if (task.startTime) {
      const rawEndTime = task.raw.endTime;
      if (rawEndTime === undefined) {
        // The parser always sets the raw start and end time data together.
        throw new Error(`Gantt task "${task.task}" is missing its end time data`);
      }
      task.endTime = getEndDate(task.startTime, dateFormat, rawEndTime.data, inclusiveEndDates);
      if (task.endTime) {
        task.processed = true;
        task.manualEndTime = dayjs(rawEndTime.data, 'YYYY-MM-DD', true).isValid();
        checkTaskDates(task, dateFormat, excludes, includes);
      }
    }

    return task.processed;
  };

  let allProcessed = true;
  for (const [i, rawTask] of rawTasks.entries()) {
    compileTask(i);

    allProcessed = allProcessed && rawTask.processed;
  }
  return allProcessed;
};

/**
 * Called by parser when a link is found. Adds the URL to the vertex data.
 *
 * @param ids - Comma separated list of ids
 * @param _linkStr - URL to create a link for
 */
export const setLink = function (ids: string, _linkStr: string) {
  let linkStr = _linkStr;
  if (getConfig().securityLevel !== 'loose') {
    linkStr = sanitizeUrl(_linkStr);
  }
  ids.split(',').forEach(function (id) {
    const rawTask = findTaskById(id);
    if (rawTask !== undefined) {
      pushFun(id, () => {
        window.open(linkStr, '_self');
      });
      links.set(id, linkStr);
    }
  });
  setClass(ids, 'clickable');
};

/**
 * Called by parser when a special node is found, e.g. a clickable element.
 *
 * @param ids - Comma separated list of ids
 * @param className - Class to add
 */
export const setClass = function (ids: string, className: string) {
  ids.split(',').forEach(function (id) {
    const rawTask = findTaskById(id);
    if (rawTask !== undefined) {
      rawTask.classes.push(className);
    }
  });
};

const setClickFun = function (
  id: string,
  functionName: string | undefined,
  functionArgs: string | null
) {
  if (getConfig().securityLevel !== 'loose') {
    return;
  }
  if (functionName === undefined) {
    return;
  }

  let argList: string[] = [];
  if (typeof functionArgs === 'string') {
    /* Splits functionArgs by ',', ignoring all ',' in double quoted strings */
    argList = functionArgs.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    for (let i = 0; i < argList.length; i++) {
      let item = argList[i].trim();
      /* Removes all double quotes at the start and end of an argument */
      /* This preserves all starting and ending whitespace inside */
      if (item.startsWith('"') && item.endsWith('"')) {
        item = item.substr(1, item.length - 2);
      }
      argList[i] = item;
    }
  }

  /* if no arguments passed into callback, default to passing in id */
  if (argList.length === 0) {
    argList.push(id);
  }

  const rawTask = findTaskById(id);
  if (rawTask !== undefined) {
    pushFun(id, () => {
      utils.runFunc(functionName, ...argList);
    });
  }
};

/**
 * The callbackFunction is executed in a click event bound to the task with the specified id or the
 * task's assigned text
 *
 * @param id - The task's id
 * @param callbackFunction - A function to be executed when clicked on the task or the task's text
 */
const pushFun = function (id: string, callbackFunction: () => void) {
  funs.push(
    function () {
      const prefixedId = diagramId ? `${diagramId}-${id}` : id;
      const elem = document.querySelector(`[id="${prefixedId}"]`);
      if (elem !== null) {
        elem.addEventListener('click', function () {
          callbackFunction();
        });
      }
    },
    function () {
      const prefixedId = diagramId ? `${diagramId}-${id}` : id;
      const elem = document.querySelector(`[id="${prefixedId}-text"]`);
      if (elem !== null) {
        elem.addEventListener('click', function () {
          callbackFunction();
        });
      }
    }
  );
};

/**
 * Called by parser when a click definition is found. Registers an event handler.
 *
 * @param ids - Comma separated list of ids
 * @param functionName - Function to be called on click
 * @param functionArgs - Function args the function should be called with
 */
export const setClickEvent = function (
  ids: string,
  functionName: string,
  functionArgs: string | null
) {
  ids.split(',').forEach(function (id) {
    setClickFun(id, functionName, functionArgs);
  });
  setClass(ids, 'clickable');
};

/**
 * Binds all functions previously added to fun (specified through click) to the element
 *
 * @param element - The element to bind the click event listeners to
 */
export const bindFunctions = function (element: Element) {
  funs.forEach(function (fun) {
    fun(element);
  });
};

const db = {
  getConfig: () => getConfig().gantt,
  clear,
  setDateFormat,
  getDateFormat,
  enableInclusiveEndDates,
  endDatesAreInclusive,
  enableTopAxis,
  topAxisEnabled,
  setAxisFormat,
  getAxisFormat,
  setTickInterval,
  getTickInterval,
  setTodayMarker,
  getTodayMarker,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  setDiagramId,
  setDisplayMode,
  getDisplayMode,
  setAccDescription,
  getAccDescription,
  addSection,
  getSections,
  getTasks,
  addTask,
  findTaskById,
  addTaskOrg,
  setIncludes,
  getIncludes,
  setExcludes,
  getExcludes,
  setClickEvent,
  setLink,
  getLinks,
  bindFunctions,
  parseDuration,
  isInvalidDate,
  setWeekday,
  getWeekday,
  setWeekend,
};

export type GanttDB = typeof db;

export default db;

/**
 * Sets the tags (e.g. `active`, `done`, `crit`, `milestone` or `vert`) that
 * are found at the start of `data` on `task`, removing them from `data`.
 *
 * @param data - The comma-split task data.
 * @param task - The task to set the tags on.
 * @param tags - The tags to look for.
 */
function getTaskTags(data: string[], task: TaskTags, tags: readonly TaskTag[]) {
  let matchFound = true;
  while (matchFound) {
    matchFound = false;
    tags.forEach(function (t) {
      const pattern = '^\\s*' + t + '\\s*$';
      const regex = new RegExp(pattern);
      if (data[0].match(regex)) {
        task[t] = true;
        data.shift();
        matchFound = true;
      }
    });
  }
}
