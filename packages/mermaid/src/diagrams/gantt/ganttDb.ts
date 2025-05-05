import { sanitizeUrl } from '@braintree/sanitize-url';
import dayjs from 'dayjs';
import dayjsIsoWeek from 'dayjs/plugin/isoWeek.js';
import dayjsCustomParseFormat from 'dayjs/plugin/customParseFormat.js';
import dayjsAdvancedFormat from 'dayjs/plugin/advancedFormat.js';
import type { DiagramDB } from '../../diagram-api/types.js';
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

dayjs.extend(dayjsIsoWeek);
dayjs.extend(dayjsCustomParseFormat);
dayjs.extend(dayjsAdvancedFormat);

// eslint-disable-next-line no-restricted-syntax
enum WeekendStartDay {
  friday = 5,
  saturday = 6,
}

interface Task {
  section: string;
  id: string;
  type: string;
  startTime: Date | undefined;
  endTime: Date | undefined;
  manualEndTime: boolean;
  renderEndTime: Date | null;
  raw: RawTaskInfo | undefined;
  task: string;
  classes: string[];
  prevTaskId: string | undefined;
  active: boolean;
  done: boolean;
  crit: boolean;
  milestone: boolean;
  vert: boolean;
  order: number;
  description: string;
  processed: boolean;
}

interface ParserDateInfo {
  id: string | undefined;
  type: string | undefined;
  startData: string | undefined;
  data: string | undefined;
}

interface TaskInfo {
  id: string;
  startTime: ParserDateInfo;
  endTime: ParserDateInfo;
  manualEndTime: boolean;
  renderEndTime: boolean | null;
  active: boolean;
  done: boolean;
  crit: boolean;
  milestone: boolean;
  vert: boolean;
}

interface RawTaskInfo {
  data: string;
  startTime: ParserDateInfo | undefined;
  endTime: ParserDateInfo | undefined;
}

// We are using arrow functions assigned to class instance fields instead of methods as they are required by flow JISON
export default class GanttDb implements DiagramDB {
  private dateFormat = '';
  private axisFormat = '';
  private tickInterval: string | undefined = undefined;
  private todayMarker = '';
  private includes: string[] = [];
  private excludes: string[] = [];
  private links = new Map();
  private sections: string[] = [];
  private tasks: Task[] = [];
  private currentSection = '';
  private displayMode = '';
  private tags: string[] = ['active', 'done', 'crit', 'milestone', 'vert'] as const;
  private funs: ((element: Element) => void)[] = [];
  private inclusiveEndDates = false;
  private topAxis = false;
  private weekday = 'sunday';
  private weekend: keyof typeof WeekendStartDay = 'saturday';

  // The serial order of the task in the script
  private lastOrder = 0;

  constructor() {
    // Needed for JISON since it only supports direct properties
    this.setAxisFormat = this.setAxisFormat.bind(this);
    this.getAxisFormat = this.getAxisFormat.bind(this);
    this.setTickInterval = this.setTickInterval.bind(this);
    this.getTickInterval = this.getTickInterval.bind(this);
    this.setTodayMarker = this.setTodayMarker.bind(this);
    this.getTodayMarker = this.getTodayMarker.bind(this);
    this.setDateFormat = this.setDateFormat.bind(this);
    this.enableInclusiveEndDates = this.enableInclusiveEndDates.bind(this);
    this.endDatesAreInclusive = this.endDatesAreInclusive.bind(this);
    this.enableTopAxis = this.enableTopAxis.bind(this);
    this.topAxisEnabled = this.topAxisEnabled.bind(this);
    this.setDisplayMode = this.setDisplayMode.bind(this);
    this.getDisplayMode = this.getDisplayMode.bind(this);
    this.getDateFormat = this.getDateFormat.bind(this);
    this.setIncludes = this.setIncludes.bind(this);
    this.getIncludes = this.getIncludes.bind(this);
    this.setExcludes = this.setExcludes.bind(this);
    this.getExcludes = this.getExcludes.bind(this);
    this.getLinks = this.getLinks.bind(this);
    this.addSection = this.addSection.bind(this);
    this.getSections = this.getSections.bind(this);
    this.getTasks = this.getTasks.bind(this);
    this.isInvalidDate = this.isInvalidDate.bind(this);
    this.setWeekday = this.setWeekday.bind(this);
    this.getWeekday = this.getWeekday.bind(this);
    this.setWeekend = this.setWeekend.bind(this);
    this.addTask = this.addTask.bind(this);
    this.findTaskById = this.findTaskById.bind(this);
    this.addTaskOrg = this.addTaskOrg.bind(this);
    this.setLink = this.setLink.bind(this);
    this.setClass = this.setClass.bind(this);
    this.setClickEvent = this.setClickEvent.bind(this);
    this.bindFunctions = this.bindFunctions.bind(this);

    this.clear();
  }

  /**
   * Clears the internal graph db so that a new graph can be parsed.
   *
   */
  public clear() {
    this.sections = [];
    this.tasks = [];
    this.currentSection = '';
    this.funs = [];
    this.taskCnt = 0;
    this.lastTask = undefined;
    this.lastTaskID = undefined;
    this.rawTasks = [];
    this.dateFormat = '';
    this.axisFormat = '';
    this.displayMode = '';
    this.tickInterval = undefined;
    this.todayMarker = '';
    this.includes = [];
    this.excludes = [];
    this.inclusiveEndDates = false;
    this.topAxis = false;
    this.lastOrder = 0;
    this.links = new Map();
    commonClear();
    this.weekday = 'sunday';
    this.weekend = 'saturday';
  }

  public setAxisFormat(txt: string) {
    this.axisFormat = txt;
  }

  public getAxisFormat() {
    return this.axisFormat;
  }

  public setTickInterval(txt: string) {
    this.tickInterval = txt;
  }

  public getTickInterval() {
    return this.tickInterval;
  }

  public setTodayMarker(txt: string) {
    this.todayMarker = txt;
  }

  public getTodayMarker() {
    return this.todayMarker;
  }

  public setDateFormat(txt: string) {
    this.dateFormat = txt;
  }

  public enableInclusiveEndDates() {
    this.inclusiveEndDates = true;
  }

  public endDatesAreInclusive() {
    return this.inclusiveEndDates;
  }

  public enableTopAxis() {
    this.topAxis = true;
  }

  public topAxisEnabled() {
    return this.topAxis;
  }

  public setDisplayMode(txt: string) {
    this.displayMode = txt;
  }

  public getDisplayMode() {
    return this.displayMode;
  }

  public getDateFormat() {
    return this.dateFormat;
  }

  public setIncludes(txt: string) {
    this.includes = txt.toLowerCase().split(/[\s,]+/);
  }

  public getIncludes() {
    return this.includes;
  }

  public setExcludes(txt: string) {
    this.excludes = txt.toLowerCase().split(/[\s,]+/);
  }

  public getExcludes() {
    return this.excludes;
  }

  public getLinks() {
    return this.links;
  }

  public addSection(txt: string) {
    this.currentSection = txt;
    this.sections.push(txt);
  }

  public getSections() {
    return this.sections;
  }

  public getTasks() {
    let allItemsProcessed = this.compileTasks();
    const maxDepth = 10;
    let iterationCount = 0;
    while (!allItemsProcessed && iterationCount < maxDepth) {
      allItemsProcessed = this.compileTasks();
      iterationCount++;
    }

    this.tasks = this.rawTasks;

    return this.tasks;
  }

  public isInvalidDate(
    date: dayjs.Dayjs,
    dateFormat: string,
    excludes: string[],
    includes: string[]
  ) {
    if (includes.includes(date.format(dateFormat.trim()))) {
      return false;
    }
    if (
      excludes.includes('weekends') &&
      (date.isoWeekday() === WeekendStartDay[this.weekend].valueOf() ||
        date.isoWeekday() === WeekendStartDay[this.weekend].valueOf() + 1)
    ) {
      return true;
    }
    if (excludes.includes(date.format('dddd').toLowerCase())) {
      return true;
    }
    return excludes.includes(date.format(dateFormat.trim()));
  }

  public setWeekday(txt: string) {
    this.weekday = txt;
  }

  public getWeekday() {
    return this.weekday;
  }

  public setWeekend(startDay: keyof typeof WeekendStartDay) {
    this.weekend = startDay;
  }

  /**
   * TODO: fully document what this function does and what types it accepts
   *
   * @param task - The task to check.
   *      task.startTime - Might be a `Date` or a `string`.
   *      TODO: is this always a Date?
   *      task.endTime - Might be a `Date` or a `string`.
   * TODO: is this always a Date?
   * @param dateFormat - Dayjs date format string.
   * @param excludes - Array of strings to exclude.
   * @param includes - Array of strings to include.
   */
  private checkTaskDates(task: Task, dateFormat: string, excludes: string[], includes: string[]) {
    if (!excludes.length || task.manualEndTime) {
      return;
    }
    let startTime;
    startTime = dayjs(task.startTime);
    startTime = startTime.add(1, 'd');

    const originalEndTime = dayjs(task.endTime);
    const [fixedEndTime, renderEndTime] = this.fixTaskDates(
      startTime,
      originalEndTime,
      dateFormat,
      excludes,
      includes
    );
    task.endTime = fixedEndTime;
    task.renderEndTime = renderEndTime;
  }

  /**
   * TODO: what does this function do?
   *
   * @param startTime - The start time.
   * @param endTime - The original end time (will return a different end time if it's invalid).
   * @param dateFormat - Dayjs date format string.
   * @param excludes - Array of strings to exclude.
   * @param includes - Array of strings to include.
   * @returns The new `endTime`, and the end time to render.
   * `renderEndTime` may be `null` if `startTime` is newer than `endTime`.
   */
  private fixTaskDates(
    startTime: dayjs.Dayjs,
    endTime: dayjs.Dayjs,
    dateFormat: string,
    excludes: string[],
    includes: string[]
  ): [Date, Date] {
    let invalid = false;
    let renderEndTime: Date = endTime.toDate();
    while (startTime <= endTime) {
      if (!invalid) {
        renderEndTime = endTime.toDate();
      }
      invalid = this.isInvalidDate(startTime, dateFormat, excludes, includes);
      if (invalid) {
        endTime = endTime.add(1, 'd');
      }
      startTime = startTime.add(1, 'd');
    }
    return [endTime.toDate(), renderEndTime];
  }

  private getStartDate(dateFormat: string, str: string): Date {
    str = str.trim();

    // Test for after
    const afterRePattern = /^after\s+(?<ids>[\d\w- ]+)/;
    const afterStatement = afterRePattern.exec(str);

    if (afterStatement?.groups) {
      // check all after ids and take the latest
      let latestTask = null;
      for (const id of afterStatement.groups.ids.split(' ')) {
        const task = this.findTaskById(id);
        if (
          task !== undefined &&
          (!latestTask ||
            (latestTask?.endTime && task?.endTime && task.endTime > latestTask.endTime))
        ) {
          latestTask = task;
        }
      }

      if (latestTask?.endTime) {
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
  }

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
  private parseDuration(str: string): [number, string] {
    // cspell:disable-next-line
    const statement = /^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(str.trim());

    if (statement !== null) {
      return [Number.parseFloat(statement[1]), statement[2]];
    }
    // NaN means an invalid duration
    return [NaN, 'ms'];
  }

  private getEndDate(prevTime: Date, dateForma: string, str: string, inclusive = false): Date {
    str = str.trim();

    // test for until
    const untilRePattern = /^until\s+(?<ids>[\d\w- ]+)/;
    const untilStatement = untilRePattern.exec(str);

    if (untilStatement?.groups) {
      // check all until ids and take the earliest
      let earliestTask = null;
      for (const id of untilStatement.groups.ids.split(' ')) {
        const task = this.findTaskById(id);
        if (
          task?.startTime &&
          (!earliestTask || (earliestTask?.startTime && task.startTime < earliestTask.startTime))
        ) {
          earliestTask = task;
        }
      }

      if (earliestTask?.startTime) {
        return earliestTask.startTime;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }

    // check for actual date
    let parsedDate = dayjs(str, this.dateFormat.trim(), true);
    if (parsedDate.isValid()) {
      if (inclusive) {
        parsedDate = parsedDate.add(1, 'd');
      }
      return parsedDate.toDate();
    }

    let endTime = dayjs(prevTime);
    const [durationValue, durationUnit] = this.parseDuration(str);
    if (!Number.isNaN(durationValue)) {
      const newEndTime = endTime.add(durationValue, durationUnit as dayjs.ManipulateType);
      if (newEndTime.isValid()) {
        endTime = newEndTime;
      }
    }
    return endTime.toDate();
  }

  private taskCnt = 0;
  private parseId(idStr?: string): string {
    if (idStr === undefined) {
      this.taskCnt = this.taskCnt + 1;
      return 'task' + this.taskCnt;
    }
    return idStr;
  }

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

  private compileData(prevTask: Task, dataStr: string) {
    let ds;

    if (dataStr.substr(0, 1) === ':') {
      ds = dataStr.substr(1, dataStr.length);
    } else {
      ds = dataStr;
    }

    const data = ds.split(',');

    const task: Task = {
      id: this.parseId(),
      startTime: prevTask.endTime,
      endTime: prevTask.endTime,
      manualEndTime: false,
      renderEndTime: null,
      active: false,
      done: false,
      crit: false,
      milestone: false,
      vert: false,
      section: this.currentSection,
      type: this.currentSection,
      processed: false,
      raw: {
        data: dataStr,
        startTime: undefined,
        endTime: undefined,
      },
      task: prevTask.task,
      classes: [],
      prevTaskId: prevTask.id,
      order: prevTask.order,
      description: prevTask.description,
    };

    // Get tags like active, done, crit, milestone, and vert
    this.getTaskTags(data, task, this.tags);

    for (let i = 0; i < data.length; i++) {
      data[i] = data[i].trim();
    }

    let endTimeData = '';
    switch (data.length) {
      case 1:
        task.id = this.parseId();
        task.startTime = prevTask.endTime;
        endTimeData = data[0];
        break;
      case 2:
        task.id = this.parseId();
        task.startTime = this.getStartDate(this.dateFormat, data[0]);
        endTimeData = data[1];
        break;
      case 3:
        task.id = this.parseId(data[0]);
        task.startTime = this.getStartDate(this.dateFormat, data[1]);
        endTimeData = data[2];
        break;
      default:
    }

    if (endTimeData && task.startTime) {
      task.endTime = this.getEndDate(
        task.startTime,
        this.dateFormat,
        endTimeData,
        this.inclusiveEndDates
      );
      task.manualEndTime = dayjs(endTimeData, 'YYYY-MM-DD', true).isValid();
      this.checkTaskDates(task, this.dateFormat, this.excludes, this.includes);
    }

    return task;
  }

  private parseData(prevTaskId: string | undefined, dataStr: string): TaskInfo {
    let ds;
    if (dataStr.substr(0, 1) === ':') {
      ds = dataStr.substr(1, dataStr.length);
    } else {
      ds = dataStr;
    }

    const data = ds.split(',');

    const task: TaskInfo = {
      id: '',
      startTime: {
        type: 'prevTaskEnd',
        id: prevTaskId,
        startData: undefined,
        data: undefined,
      },
      endTime: {
        type: 'prevTaskEnd',
        id: prevTaskId,
        startData: undefined,
        data: undefined,
      },
      manualEndTime: false,
      renderEndTime: null,
      active: false,
      done: false,
      crit: false,
      milestone: false,
      vert: false,
    };

    // Get tags like active, done, crit, milestone, and vert
    this.getTaskTags(data, task, this.tags);

    for (let i = 0; i < data.length; i++) {
      data[i] = data[i].trim();
    }

    switch (data.length) {
      case 1:
        task.id = this.parseId();
        task.startTime = {
          type: 'prevTaskEnd',
          id: prevTaskId,
          startData: undefined,
          data: undefined,
        };
        task.endTime = {
          type: undefined,
          id: undefined,
          startData: undefined,
          data: data[0],
        };
        break;
      case 2:
        task.id = this.parseId();
        task.startTime = {
          type: 'getStartDate',
          id: undefined,
          startData: data[0],
          data: data[0],
        };
        task.endTime = {
          type: undefined,
          id: undefined,
          startData: undefined,
          data: data[1],
        };
        break;
      case 3:
        task.id = this.parseId(data[0]);
        task.startTime = {
          type: 'getStartDate',
          id: undefined,
          startData: data[1],
          data: data[0],
        };
        task.endTime = {
          type: undefined,
          id: undefined,
          startData: undefined,
          data: data[2],
        };
        break;
      default:
    }

    return task;
  }

  private lastTask: Task | undefined;
  private lastTaskID: string | undefined;
  private rawTasks: Task[] = [];
  private taskDb: Record<string, number> = {};
  public addTask(descr: string, data: string) {
    const taskInfo = this.parseData(this.lastTaskID, data);

    const rawTask: Task = {
      section: this.currentSection,
      type: this.currentSection,
      processed: false,
      manualEndTime: false,
      renderEndTime: null,
      raw: {
        data: data,
        startTime: taskInfo.startTime,
        endTime: taskInfo.endTime,
      },
      task: descr,
      classes: [],
      id: taskInfo.id,
      prevTaskId: this.lastTaskID,
      active: taskInfo.active,
      done: taskInfo.done,
      crit: taskInfo.crit,
      milestone: taskInfo.milestone,
      vert: taskInfo.vert,
      order: this.lastOrder,
      description: descr,
      startTime: dayjs(taskInfo.startTime.startData, this.dateFormat.trim(), true).toDate(),
      endTime: dayjs(taskInfo.endTime.data, this.dateFormat.trim(), true).toDate(),
    };

    this.lastOrder++;

    const pos = this.rawTasks.push(rawTask);

    this.lastTaskID = rawTask.id;
    // Store cross ref
    this.taskDb[rawTask.id] = pos - 1;
  }

  public findTaskById(id: string): Task {
    const pos = this.taskDb[id];
    return this.rawTasks[pos];
  }

  public addTaskOrg(descr: string, data: string) {
    if (this.lastTask) {
      const taskInfo = this.compileData(this.lastTask, data);
      const newTask: Task = {
        section: this.currentSection,
        type: this.currentSection,
        description: descr,
        task: descr,
        classes: [],
        startTime: taskInfo.startTime,
        endTime: taskInfo.endTime,
        id: taskInfo.id,
        active: taskInfo.active,
        done: taskInfo.done,
        crit: taskInfo.crit,
        milestone: taskInfo.milestone,
        vert: taskInfo.vert,
        manualEndTime: taskInfo.manualEndTime,
        renderEndTime: taskInfo.renderEndTime,
        processed: false,
        raw: {
          data: data,
          startTime: taskInfo.raw ? taskInfo.raw.startTime : undefined,
          endTime: taskInfo.raw ? taskInfo.raw.endTime : undefined,
        },
        prevTaskId: this.lastTask.id,
        order: taskInfo.order,
      };

      this.lastTask = newTask;
      this.tasks.push(newTask);
    }
  }

  private isValidDate(date: Date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  private compileTask(pos: number) {
    const task = this.rawTasks[pos];

    if (task.raw?.startTime === undefined) {
      return false;
    }
    switch (task.raw.startTime.type) {
      case 'prevTaskEnd': {
        if (task.prevTaskId === undefined) {
          return false;
        }
        const prevTask = this.findTaskById(task.prevTaskId);
        task.startTime = prevTask.endTime;
        break;
      }
      case 'getStartDate': {
        if (task.raw.startTime.startData == undefined) {
          return false;
        }
        const startTime = this.getStartDate(this.dateFormat, task.raw.startTime.startData);
        if (startTime) {
          this.rawTasks[pos].startTime = startTime;
        }
        break;
      }
    }

    if (task.startTime && task.raw.endTime?.data) {
      task.endTime = this.getEndDate(
        task.startTime,
        this.dateFormat,
        task.raw.endTime.data,
        this.inclusiveEndDates
      );
      if (this.isValidDate(task.endTime)) {
        task.processed = true;
        task.manualEndTime = dayjs(task.raw.endTime.data, 'YYYY-MM-DD', true).isValid();
        this.checkTaskDates(task, this.dateFormat, this.excludes, this.includes);
      }
    }

    return task.processed;
  }

  private compileTasks() {
    let allProcessed = true;
    for (const [i, rawTask] of this.rawTasks.entries()) {
      this.compileTask(i);

      allProcessed = allProcessed && rawTask.processed;
    }
    return allProcessed;
  }

  /**
   * Called by parser when a link is found. Adds the URL to the vertex data.
   *
   * @param ids - Comma separated list of ids
   * @param _linkStr - URL to create a link for
   */
  public setLink(ids: string, _linkStr: string) {
    let linkStr = _linkStr;
    if (getConfig().securityLevel !== 'loose') {
      linkStr = sanitizeUrl(_linkStr);
    }
    ids.split(',').forEach((id) => {
      const rawTask = this.findTaskById(id);
      if (rawTask !== undefined) {
        this.pushFun(id, () => {
          window.open(linkStr, '_self');
        });
        this.links.set(id, linkStr);
      }
    });
    this.setClass(ids, 'clickable');
  }

  /**
   * Called by parser when a special node is found, e.g. a clickable element.
   *
   * @param ids - Comma separated list of ids
   * @param className - Class to add
   */
  public setClass(ids: string, className: string) {
    ids.split(',').forEach((id) => {
      const rawTask = this.findTaskById(id);
      if (rawTask !== undefined) {
        rawTask.classes.push(className);
      }
    });
  }

  private setClickFun(id: string, functionName: string, functionArgs: string) {
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

    const rawTask = this.findTaskById(id);
    if (rawTask !== undefined) {
      this.pushFun(id, () => {
        utils.runFunc(functionName, ...argList);
      });
    }
  }

  /**
   * The callbackFunction is executed in a click event bound to the task with the specified id or the
   * task's assigned text
   *
   * @param id - The task's id
   * @param callbackFunction - A function to be executed when clicked on the task or the task's text
   */
  private pushFun(id: string, callbackFunction: () => void) {
    this.funs.push(
      () => {
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
  }

  /**
   * Called by parser when a click definition is found. Registers an event handler.
   *
   * @param ids - Comma separated list of ids
   * @param functionName - Function to be called on click
   * @param functionArgs - Function args the function should be called with
   */
  public setClickEvent(ids: string, functionName: string, functionArgs: string) {
    ids.split(',').forEach((id) => {
      this.setClickFun(id, functionName, functionArgs);
    });
    this.setClass(ids, 'clickable');
  }

  /**
   * Binds all functions previously added to fun (specified through click) to the element
   *
   * @param element - The element to bind the functions to
   */
  public bindFunctions(element: Element) {
    this.funs.forEach((fun) => {
      fun(element);
    });
  }

  /**
   * @param data - The data array to check for tags.
   * @param task - The task to check against.
   * @param tags - The tags to check for.
   */
  private getTaskTags(data: string[], task: Task | TaskInfo, tags: string[]) {
    let matchFound = true;
    while (matchFound) {
      matchFound = false;
      tags.forEach(function (t: string) {
        const pattern = '^\\s*' + t + '\\s*$';
        const regex = new RegExp(pattern);
        if (data[0].match(regex)) {
          Object.assign(task, { [t]: true });
          data.shift();
          matchFound = true;
        }
      });
    }
  }

  public getConfig() {
    return getConfig().gantt;
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public setAccDescription = setAccDescription;
  public getAccDescription = getAccDescription;
}
