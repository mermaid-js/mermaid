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
import type {
  Weekday,
  Weekend,
  WeekendStartMap,
  Task,
  RawTask,
  GanttState,
  TaskInfo,
} from './gantt.type.js';
import { tagTypes } from './gantt.type.js';
dayjs.extend(dayjsIsoWeek);
dayjs.extend(dayjsCustomParseFormat);
dayjs.extend(dayjsAdvancedFormat);

const WEEKEND_START_DAY: WeekendStartMap = { friday: 5, saturday: 6 };

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
  taskCount: 0,
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

export const getLinks = function (): Map<string, string> {
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
  log.info('Tasks:', state.records.tasks);
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
  task: Task | RawTask,
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

const parseId = function (idStr: string | undefined): string {
  if (idStr === undefined) {
    state.records.taskCount = state.records.taskCount + 1;
    return 'task' + state.records.taskCount;
  }
  return idStr;
};

const compileData = function (prevTask: Task, dataStr: string) {
  let ds;

  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  const data = ds.split(',');

  const task: Task = {
    renderEndTime: null,
    classes: [],
    id: '',
    section: state.records.currentSection,
    type: state.records.currentSection,
    description: '',
    task: '',
    startTime: null,
    endTime: null,
    active: false,
    done: false,
    crit: false,
    milestone: false,
    links: [],
  };

  // Get tags like active, done, crit and milestone
  getTaskTags(data, task, state.records.tags);

  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  let endTimeData = '';
  switch (data.length) {
    case 1:
      task.id = parseId(undefined);
      task.startTime = prevTask.endTime;
      endTimeData = data[0];
      break;
    case 2:
      task.id = parseId(undefined);
      task.startTime = getStartDate(undefined, state.records.dateFormat, data[0]);
      endTimeData = data[1];
      break;
    case 3:
      task.id = parseId(data[0]);
      task.startTime = getStartDate(undefined, state.records.dateFormat, data[1]);
      endTimeData = data[2];
      break;
    default:
  }

  if (endTimeData) {
    task.endTime = getEndDate(
      task.startTime!,
      state.records.dateFormat,
      endTimeData,
      state.records.inclusiveEndDates
    );
    task.manualEndTime = dayjs(endTimeData, 'YYYY-MM-DD', true).isValid();

    checkTaskDates(task, state.records.dateFormat, state.records.excludes, state.records.includes);
  }

  return task;
};

// TODO: This process of having start and end time be either an object or a string is confusing. We can add a separate variable into task info for this I think

const parseData = function (prevTaskId: string, dataStr: string) {
  let ds;
  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  const data = ds.split(',');

  const task: TaskInfo = {
    id: '',
    section: state.records.currentSection,
    type: state.records.currentSection,
    description: '',
    task: '',
    renderEndTime: null,
    classes: [],
    manualEndTime: false,
    active: false,
    done: false,
    crit: false,
    milestone: false,
    prevTaskId: null,
    startTime: {
      type: 'prevTaskEnd',
      id: prevTaskId,
    },
    endTime: {
      data: '',
    },
  };

  // Get tags like active, done, crit and milestone
  getTaskTags(data, task, state.records.tags);

  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  switch (data.length) {
    case 1:
      task.id = parseId(undefined);

      task.startTime = {
        type: 'prevTaskEnd',
        id: prevTaskId,
      };

      task.endTime = {
        data: data[0],
      };
      break;
    case 2:
      task.id = parseId(undefined);

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

  const taskInfo = parseData(state.records.lastTaskID!, data);

  rawTask.raw.startTime = taskInfo.startTime;

  rawTask.raw.endTime = taskInfo.endTime;

  rawTask.id = taskInfo.id;
  rawTask.prevTaskId = state.records.lastTaskID;

  rawTask.active = taskInfo.active;

  rawTask.done = taskInfo.done;

  rawTask.crit = taskInfo.crit;

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
  const newTask: Task = {
    id: '',
    renderEndTime: null,
    section: state.records.currentSection,
    type: state.records.currentSection,
    description: descr,
    task: descr,
    classes: [],
    active: false,
    done: false,
    crit: false,
    milestone: false,
    startTime: null,
    endTime: null,
    links: [],
  };
  const taskInfo = compileData(state.records.lastTask!, data);

  newTask.startTime = taskInfo.startTime;
  newTask.endTime = taskInfo.endTime;
  newTask.id = taskInfo.id;
  newTask.active = taskInfo.active;
  newTask.done = taskInfo.done;
  newTask.crit = taskInfo.crit;
  newTask.milestone = taskInfo.milestone;
  state.records.lastTask = newTask;
  state.records.tasks.push(newTask);
};

const compileTasks = function () {
  const compileTask = function (pos: number) {
    const task = state.records.rawTasks[pos];
    let startTime: Date | null | Dayjs = null;
    switch (state.records.rawTasks[pos].raw.startTime.type) {
      case 'prevTaskEnd': {
        const prevTask = findTaskById(task.prevTaskId!);

        task.startTime = prevTask.endTime;
        break;
      }
      case 'getStartDate':
        startTime = getStartDate(
          undefined,
          state.records.dateFormat,

          state.records.rawTasks[pos].raw.startTime.startData!
        );
        if (startTime) {
          state.records.rawTasks[pos].startTime = startTime;
        }
        break;
    }

    if (state.records.rawTasks[pos].startTime) {
      state.records.rawTasks[pos].endTime = getEndDate(
        state.records.rawTasks[pos].startTime,
        state.records.dateFormat,
        state.records.rawTasks[pos].raw.endTime.data,
        state.records.inclusiveEndDates
      );

      if (state.records.rawTasks[pos].endTime) {
        state.records.rawTasks[pos].processed = true;
        state.records.rawTasks[pos].manualEndTime = dayjs(
          state.records.rawTasks[pos].raw.endTime.data,
          'YYYY-MM-DD',
          true
        ).isValid();

        checkTaskDates(
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
      state.records.links.set(id, linkStr);
    }
  });
  setClass(ids, 'clickable');
};

export const setClass = function (ids: string, className: string) {
  ids.split(',').forEach(function (id) {
    const rawTask = findTaskById(id);
    if (rawTask !== undefined) {
      rawTask.classes.push(className);
    }
  });
};

const setClickFun = function (id: string, functionName: string, functionArgs: string) {
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

const pushFun = function (id: string, callbackFunction: any) {
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

export const setClickEvent = function (ids: string, functionName: string, functionArgs: string) {
  ids.split(',').forEach(function (id) {
    setClickFun(id, functionName, functionArgs);
  });
  setClass(ids, 'clickable');
};

export const bindFunctions = function (element: any) {
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
