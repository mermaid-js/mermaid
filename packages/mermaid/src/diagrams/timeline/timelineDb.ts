import * as commonDb from '../common/commonDb.js';

export interface TimelineTask {
  id: number;
  section: string;
  type: string;
  task: string;
  score: number;
  events: string[];
  processed?: boolean;
}

export interface TimelineTaskOrg {
  section: string;
  type: string;
  description: string;
  task: string;
  classes: string[];
  events?: never;
}

let currentSection = '';
let currentTaskId = 0;
let direction = 'LR';

const sections: string[] = [];
const tasks: (TimelineTask | TimelineTaskOrg)[] = [];
const rawTasks: TimelineTask[] = [];

export const getCommonDb = () => commonDb;

export const clear = function () {
  sections.length = 0;
  tasks.length = 0;
  currentSection = '';
  rawTasks.length = 0;
  direction = 'LR';
  commonDb.clear();
};

export const setDirection = function (dir: string) {
  direction = dir;
};

export const getDirection = function () {
  return direction;
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
  const maxDepth = 100;
  let iterationCount = 0;
  while (!allItemsProcessed && iterationCount < maxDepth) {
    allItemsProcessed = compileTasks();
    iterationCount++;
  }

  tasks.push(...rawTasks);

  return tasks;
};

export const addTask = function (period: string, length: number, event: string) {
  const rawTask: TimelineTask = {
    id: currentTaskId++,
    section: currentSection,
    type: currentSection,
    task: period,
    score: length ? length : 0,
    //if event is defined, then add it the events array
    events: event ? [event] : [],
  };
  rawTasks.push(rawTask);
};

export const addEvent = function (event: string) {
  // fetch current task with currentTaskId
  const currentTask = rawTasks.find((task) => task.id === currentTaskId - 1);
  //add event to the events array
  currentTask!.events.push(event);
};

export const addTaskOrg = function (descr: string) {
  const newTask: TimelineTaskOrg = {
    section: currentSection,
    type: currentSection,
    description: descr,
    task: descr,
    classes: [],
  };
  tasks.push(newTask);
};

/**
 * Compiles the raw tasks into a list of tasks with events
 * @returns true if all items are processed
 */
const compileTasks = function () {
  const compileTask = function (pos: number) {
    return rawTasks[pos].processed;
  };

  let allProcessed: boolean | undefined = true;
  for (const [i, rawTask] of rawTasks.entries()) {
    compileTask(i);

    allProcessed = allProcessed && rawTask.processed;
  }
  return allProcessed;
};

export default {
  clear,
  getCommonDb,
  getDirection,
  setDirection,
  addSection,
  getSections,
  getTasks,
  addTask,
  addTaskOrg,
  addEvent,
};
