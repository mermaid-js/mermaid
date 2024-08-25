import { sanitizeUrl } from '@braintree/sanitize-url';
import dayjs from 'dayjs';
import type { Dayjs, ManipulateType } from 'dayjs';
import dayjsIsoWeek from 'dayjs/plugin/isoWeek.js';
import dayjsCustomParseFormat from 'dayjs/plugin/customParseFormat.js';
import dayjsAdvancedFormat from 'dayjs/plugin/advancedFormat.js';
import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import utils from '../../utils.js';

import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';
import { ImperativeState } from '../../utils/imperativeState.js';
import type { Weekday, Weekend, WeekendStartMap, Task, ValidTag, RawTask } from './ganttTypes.js';
dayjs.extend(dayjsIsoWeek);
dayjs.extend(dayjsCustomParseFormat);
dayjs.extend(dayjsAdvancedFormat);

export const tagTypes: ValidTag[] = ['active', 'done', 'crit', 'milestone'];

const WEEKEND_START_DAY: WeekendStartMap = { friday: 5, saturday: 6 };

interface GanttState {
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
}

const state = new ImperativeState<GanttState>(() => ({
  dateFormat: '',
  axisFormat: '',
  tickInterval: '',
  todayMarker: '',
  includes: [],
  excludes: [],
  links: new Map(),
  sections: [],
  tasks: [],
  currentSection: '',
  displayMode: '',
  tags: tagTypes,
  funs: [],
  inclusiveEndDates: false,
  topAxis: false,
  weekday: 'sunday',
  weekend: 'saturday',
  weekdayStart: 'saturday',
  lastOrder: 0,
  rawTasks: [],
  lastTask: null,
  lastTaskID: null,
  taskDbPositionMap: new Map(),
  taskDb: {},
}));

export const clear = function () {
  state.reset();
  commonClear();
};

export const setAxisFormat = function (txt: string) {
  state.records.axisFormat = txt;
};

export const getAxisFormat = function (): string {
  return state.records.axisFormat;
};

export const setTickInterval = function (txt: string) {
  state.records.axisFormat = txt;
};

export const getTickInterval = function (): string {
  return state.records.tickInterval;
};

export const setTodayMarker = function (txt: string) {
  state.records.todayMarker = txt;
};

export const getTodayMarker = function (): string {
  return state.records.todayMarker;
};

export const setDateFormat = function (txt: string) {
  state.records.dateFormat = txt;
};

export const enableInclusiveEndDates = function () {
  state.records.inclusiveEndDates = true;
};

export const endDatesAreInclusive = function (): boolean {
  return state.records.inclusiveEndDates;
};

export const enableTopAxis = function () {
  state.records.topAxis = true;
};

export const topAxisEnabled = function (): boolean {
  return state.records.topAxis;
};

export const setDisplayMode = function (txt: string) {
  state.records.displayMode = txt;
};

export const getDisplayMode = function (): string {
  return state.records.displayMode;
};

export const getDateFormat = function (): string {
  return state.records.dateFormat;
};

export const setIncludes = function (txt: string) {
  state.records.includes = txt.toLowerCase().split(/[\s,]+/);
};

export const getIncludes = function (): string[] {
  return state.records.includes;
};
export const setExcludes = function (txt: string) {
  state.records.excludes = txt.toLowerCase().split(/[\s,]+/);
};

export const getExcludes = function (): string[] {
  return state.records.excludes;
};

export const getLinks = function (): Map<string, URL> {
  return state.records.links;
};

export const addSection = function (txt: string) {
  state.records.currentSection = txt;
  state.records.sections.push(txt);
};

export const getSections = function (): string[] {
  return state.records.sections;
};

export const getTasks = function () {
  let allItemsProcessed = compileTasks();
  const maxDepth = 10;
  let iterationCount = 0;
  while (!allItemsProcessed && iterationCount < maxDepth) {
    allItemsProcessed = compileTasks();
    iterationCount++;
  }

  // @ts-ignore TODO: Fix type
  state.records.tasks = state.records.rawTasks;

  return state.records.tasks;
};

export const isInvalidDate = function (
  date: Dayjs,
  dateFormat: string,
  excludes: string[],
  includes: string[]
): boolean {
  if (includes.includes(date.format(dateFormat.trim()))) {
    return false;
  }

  if (
    excludes.includes('weekends') &&
    (date.isoWeekday() === WEEKEND_START_DAY[state.records.weekend] ||
      date.isoWeekday() === WEEKEND_START_DAY[state.records.weekend] + 1)
  ) {
    return true;
  }

  if (excludes.includes(date.format('dddd').toLowerCase())) {
    return true;
  }
  return excludes.includes(date.format(dateFormat.trim()));
};

export const setWeekday = function (weekday: Weekday) {
  state.records.weekday = weekday;
};

export const getWeekday = (): Weekday => {
  return state.records.weekday;
};

export const setWeekend = function (startDay: Weekend) {
  state.records.weekend = startDay;
};

const checkTaskDates = function (
  task: Task,
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

const fixTaskDates = (
  startTime: Dayjs,
  endTime: Dayjs,
  dateFormat: string,
  excludes: string[],
  includes: string[]
): [Dayjs, Date | null] => {
  let invalid = false;
  let renderEndTime = null;
  while (startTime <= endTime) {
    if (!invalid) {
      renderEndTime = endTime.toDate();
    }
    invalid = isInvalidDate(startTime, dateFormat, excludes, includes);
    if (invalid) {
      endTime = endTime.add(1, 'd');
    }
    startTime = startTime.add(1, 'd');
  }
  return [endTime, renderEndTime];
};

const getStartDate = function (prevTime: Date | undefined, dateFormat: string, str: string) {
  str = str.trim();

  const afterRePattern = /^after\s+(?<ids>[\d\w- ]+)/;
  const afterStatement = afterRePattern.exec(str);

  if (afterStatement?.groups !== undefined) {
    // check all after ids and take the latest
    let latestTask = null;
    for (const id of afterStatement.groups.ids.split(' ')) {
      const task = findTaskById(id);
      // @ts-ignore TODO: Fix type
      if (task !== undefined && (!latestTask || task.endTime > latestTask.endTime)) {
        latestTask = task;
      }
    }

    if (latestTask) {
      // @ts-ignore TODO: Fix type
      return latestTask.endTime;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  // Check for actual date set
  const mDate = dayjs(str, dateFormat.trim(), true);
  if (mDate.isValid()) {
    return mDate.toDate();
  } else {
    log.debug('Invalid date:' + str);
    log.debug('With date format:' + dateFormat.trim());
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

const parseDuration = function (str: string): [number, ManipulateType] {
  // cspell:disable-next-line
  const statement = /^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(str.trim());
  if (statement !== null) {
    return [Number.parseFloat(statement[1]), statement[2] as ManipulateType];
  }
  // NaN means an invalid duration
  return [NaN, 'ms'];
};

const getEndDate = function (
  prevTime: Date | Dayjs,
  dateFormat: string,
  str: string,
  inclusive = false
) {
  str = str.trim();

  // test for until
  const untilRePattern = /^until\s+(?<ids>[\d\w- ]+)/;
  const untilStatement = untilRePattern.exec(str);

  if (untilStatement?.groups !== undefined) {
    // check all until ids and take the earliest
    let earliestTask = null;
    for (const id of untilStatement.groups.ids.split(' ')) {
      const task = findTaskById(id);
      // @ts-ignore TODO: Fix type
      if (task !== undefined && (!earliestTask || task.startTime < earliestTask.startTime)) {
        earliestTask = task;
      }
    }

    if (earliestTask) {
      // @ts-ignore TODO: Fix type
      return earliestTask.startTime;
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
const parseId = function (idStr: string | undefined): string {
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

const compileData = function (prevTask: any, dataStr: any) {
  let ds;

  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  const data = ds.split(',');

  const task = {};

  // Get tags like active, done, crit and milestone
  getTaskTags(data, task, state.records.tags);

  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  let endTimeData = '';
  switch (data.length) {
    case 1:
      // @ts-ignore TODO: Fix type
      task.id = parseId();
      // @ts-ignore TODO: Fix type
      task.startTime = prevTask.endTime;
      endTimeData = data[0];
      break;
    case 2:
      // @ts-ignore TODO: Fix type
      task.id = parseId();
      // @ts-ignore TODO: Fix type
      task.startTime = getStartDate(undefined, state.records.dateFormat, data[0]);
      endTimeData = data[1];
      break;
    case 3:
      // @ts-ignore TODO: Fix type
      task.id = parseId(data[0]);
      // @ts-ignore TODO: Fix type
      task.startTime = getStartDate(undefined, state.records.dateFormat, data[1]);
      endTimeData = data[2];
      break;
    default:
  }

  if (endTimeData) {
    // @ts-ignore TODO: Fix type
    task.endTime = getEndDate(
      task.startTime,
      state.records.dateFormat,
      endTimeData,
      inclusiveEndDates
    );
    // @ts-ignore TODO: Fix type
    task.manualEndTime = dayjs(endTimeData, 'YYYY-MM-DD', true).isValid();
    // @ts-ignore TODO: Fix type
    checkTaskDates(task, state.records.dateFormat, excludes, includes);
  }

  return task;
};

const parseData = function (prevTaskId: any, dataStr: any) {
  let ds;
  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  const data = ds.split(',');

  const task = {};

  // Get tags like active, done, crit and milestone
  getTaskTags(data, task, state.records.tags);

  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  switch (data.length) {
    case 1:
      // @ts-ignore TODO: Fix type
      task.id = parseId();
      // @ts-ignore TODO: Fix type
      task.startTime = {
        type: 'prevTaskEnd',
        id: prevTaskId,
      };
      // @ts-ignore TODO: Fix type
      task.endTime = {
        data: data[0],
      };
      break;
    case 2:
      // @ts-ignore TODO: Fix type
      task.id = parseId();
      // @ts-ignore TODO: Fix type
      task.startTime = {
        type: 'getStartDate',
        startData: data[0],
      };
      // @ts-ignore TODO: Fix type
      task.endTime = {
        data: data[1],
      };
      break;
    case 3:
      // @ts-ignore TODO: Fix type
      task.id = parseId(data[0]);
      // @ts-ignore TODO: Fix type
      task.startTime = {
        type: 'getStartDate',
        startData: data[1],
      };
      // @ts-ignore TODO: Fix type
      task.endTime = {
        data: data[2],
      };
      break;
    default:
  }

  return task;
};

export const addTask = function (descr: string, data: string) {
  const rawTask: RawTask = {
    id: '',
    section: state.records.currentSection,
    type: state.records.currentSection,
    processed: false,
    manualEndTime: false,
    renderEndTime: null,
    // @ts-ignore TODO: Fix type
    raw: { data: data },
    task: descr,
    classes: [],
    active: false,
    done: false,
    crit: false,
    milestone: false,
    order: 0,
    prevTaskId: null,
    description: descr,
  };
  const taskInfo = parseData(state.records.lastTaskID, data);
  // @ts-ignore TODO: Fix type
  rawTask.raw.startTime = taskInfo.startTime;
  // @ts-ignore TODO: Fix type
  rawTask.raw.endTime = taskInfo.endTime;
  // @ts-ignore TODO: Fix type
  rawTask.id = taskInfo.id;
  rawTask.prevTaskId = state.records.lastTaskID;
  // @ts-ignore TODO: Fix type
  rawTask.active = taskInfo.active;
  // @ts-ignore TODO: Fix type
  rawTask.done = taskInfo.done;
  // @ts-ignore TODO: Fix type
  rawTask.crit = taskInfo.crit;
  // @ts-ignore TODO: Fix type
  rawTask.milestone = taskInfo.milestone;
  rawTask.order = state.records.lastOrder;

  state.records.lastOrder++;
  const pos = state.records.rawTasks.push(rawTask);

  state.records.lastTaskID = rawTask.id;
  // Store cross ref
  state.records.taskDb[rawTask.id] = pos - 1;
};

export const findTaskById = function (id: string) {
  const pos = state.records.taskDb[id];
  return state.records.rawTasks[pos];
};

export const addTaskOrg = function (descr: string, data: string) {
  const newTask = {
    section: state.records.currentSection,
    type: state.records.currentSection,
    description: descr,
    task: descr,
    classes: [],
  };
  const taskInfo = compileData(state.records.lastTask, data);
  // @ts-ignore TODO: Fix type
  newTask.startTime = taskInfo.startTime;
  // @ts-ignore TODO: Fix type
  newTask.endTime = taskInfo.endTime;
  // @ts-ignore TODO: Fix type
  newTask.id = taskInfo.id;
  // @ts-ignore TODO: Fix type
  newTask.active = taskInfo.active;
  // @ts-ignore TODO: Fix type
  newTask.done = taskInfo.done;
  // @ts-ignore TODO: Fix type
  newTask.crit = taskInfo.crit;
  // @ts-ignore TODO: Fix type
  newTask.milestone = taskInfo.milestone;
  // @ts-ignore TODO: Fix type
  state.records.lastTask = newTask;
  // @ts-ignore TODO: Fix type
  state.records.tasks.push(newTask);
};

const compileTasks = function () {
  // @ts-ignore TODO: Fix type
  const compileTask = function (pos) {
    const task = state.records.rawTasks[pos];
    let startTime = '';
    switch (state.records.rawTasks[pos].raw.startTime.type) {
      case 'prevTaskEnd': {
        // @ts-ignore TODO: Fix type
        const prevTask = findTaskById(task.prevTaskId);
        // @ts-ignore TODO: Fix type
        task.startTime = prevTask.endTime;
        break;
      }
      case 'getStartDate':
        // @ts-ignore TODO: Fix type
        startTime = getStartDate(
          undefined,
          state.records.dateFormat,
          // @ts-ignore TODO: Fix type
          state.records.rawTasks[pos].raw.startTime.startData
        );
        if (startTime) {
          // @ts-ignore TODO: Fix type
          state.records.rawTasks[pos].startTime = startTime;
        }
        break;
    }
    // @ts-ignore TODO: Fix type
    if (state.records.rawTasks[pos].startTime) {
      // @ts-ignore TODO: Fix type
      state.records.rawTasks[pos].endTime = getEndDate(
        // @ts-ignore TODO: Fix type
        state.records.rawTasks[pos].startTime,
        state.records.dateFormat,
        // @ts-ignore TODO: Fix type
        state.records.rawTasks[pos].raw.endTime.data,
        state.records.inclusiveEndDates
      );
      // @ts-ignore TODO: Fix type
      if (state.records.rawTasks[pos].endTime) {
        state.records.rawTasks[pos].processed = true;
        state.records.rawTasks[pos].manualEndTime = dayjs(
          // @ts-ignore TODO: Fix type
          state.records.rawTasks[pos].raw.endTime.data,
          'YYYY-MM-DD',
          true
        ).isValid();
        // @ts-ignore TODO: Fix type
        checkTaskDates(
          // @ts-ignore TODO: Fix type
          state.records.rawTasks[pos],
          state.records.dateFormat,
          state.records.excludes,
          state.records.includes
        );
      }
    }

    return state.records.rawTasks[pos].processed;
  };

  let allProcessed = true;
  for (const [i, rawTask] of state.records.rawTasks.entries()) {
    compileTask(i);

    allProcessed = allProcessed && rawTask.processed;
  }
  return allProcessed;
};

export const setLink = function (ids: any, _linkStr: any) {
  let linkStr = _linkStr;
  if (getConfig().securityLevel !== 'loose') {
    linkStr = sanitizeUrl(_linkStr);
  }
  // @ts-ignore TODO: Fix type
  ids.split(',').forEach(function (id) {
    const rawTask = findTaskById(id);
    if (rawTask !== undefined) {
      pushFun(id, () => {
        window.open(linkStr, '_self');
      });
      state.records.links.set(id, linkStr);
    }
  });
  setClass(ids, 'clickable');
};

export const setClass = function (ids: any, className: any) {
  // @ts-ignore TODO: Fix type
  ids.split(',').forEach(function (id) {
    const rawTask = findTaskById(id);
    if (rawTask !== undefined) {
      rawTask.classes.push(className);
    }
  });
};
// @ts-ignore TODO: Fix type
const setClickFun = function (id, functionName, functionArgs) {
  if (getConfig().securityLevel !== 'loose') {
    return;
  }
  if (functionName === undefined) {
    return;
  }

  let argList: any = [];
  if (typeof functionArgs === 'string') {
    /* Splits functionArgs by ',', ignoring all ',' in double quoted strings */
    // @ts-ignore TODO: Fix type
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

// @ts-ignore TODO: Fix type
const pushFun = function (id, callbackFunction) {
  // @ts-ignore TODO: Fix type
  state.records.funs.push(
    function () {
      // const elem = d3.select(element).select(`[id="${id}"]`)
      const elem = document.querySelector(`[id="${id}"]`);
      if (elem !== null) {
        elem.addEventListener('click', function () {
          callbackFunction();
        });
      }
    },
    function () {
      // const elem = d3.select(element).select(`[id="${id}-text"]`)
      const elem = document.querySelector(`[id="${id}-text"]`);
      if (elem !== null) {
        elem.addEventListener('click', function () {
          callbackFunction();
        });
      }
    }
  );
};

// @ts-ignore TODO: Fix type
export const setClickEvent = function (ids, functionName, functionArgs) {
  // @ts-ignore TODO: Fix type
  ids.split(',').forEach(function (id) {
    setClickFun(id, functionName, functionArgs);
  });
  setClass(ids, 'clickable');
};

// @ts-ignore TODO: Fix type
export const bindFunctions = function (element) {
  // @ts-ignore TODO: Fix type
  state.records.funs.forEach(function (fun) {
    fun(element);
  });
};

export default {
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

// @ts-ignore TODO: Fix type
function getTaskTags(data, task, tags) {
  let matchFound = true;
  while (matchFound) {
    matchFound = false;
    // @ts-ignore TODO: Fix type
    tags.forEach(function (t) {
      const pattern = '^\\s*' + t + '\\s*$';
      const regex = new RegExp(pattern);
      if (data[0].match(regex)) {
        task[t] = true;
        data.shift(1);
        matchFound = true;
      }
    });
  }
}
