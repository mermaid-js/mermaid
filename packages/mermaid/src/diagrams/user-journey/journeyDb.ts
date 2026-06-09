import { getConfig } from '../../diagram-api/diagramAPI.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../common/commonDb.js';

export interface JourneyTask {
  section: string;
  type: string;
  people: string[];
  task: string;
  score: number;
  processed?: boolean;
}

export interface JourneyTaskOrg {
  section: string;
  type: string;
  description: string;
  task: string;
  classes: string[];
  people?: never;
}

let currentSection = '';

const sections: string[] = [];
const tasks: (JourneyTask | JourneyTaskOrg)[] = [];
const rawTasks: JourneyTask[] = [];

export const clear = function () {
  sections.length = 0;
  tasks.length = 0;
  currentSection = '';
  rawTasks.length = 0;
  commonClear();
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

const updateActors = function () {
  const tempActors: string[] = [];
  tasks.forEach((task) => {
    if (task.people) {
      tempActors.push(...task.people);
    }
  });

  const unique = new Set(tempActors);
  return [...unique].sort();
};

export const addTask = function (descr: string, taskData: string) {
  const pieces = taskData.substr(1).split(':');

  let score = 0;
  let peeps: string[] = [];
  if (pieces.length === 1) {
    score = Number(pieces[0]);
    peeps = [];
  } else {
    score = Number(pieces[0]);
    peeps = pieces[1].split(',');
  }
  const peopleList = peeps.map((s) => s.trim());

  const rawTask: JourneyTask = {
    section: currentSection,
    type: currentSection,
    people: peopleList,
    task: descr,
    score,
  };

  rawTasks.push(rawTask);
};

export const addTaskOrg = function (descr: string) {
  const newTask: JourneyTaskOrg = {
    section: currentSection,
    type: currentSection,
    description: descr,
    task: descr,
    classes: [],
  };
  tasks.push(newTask);
};

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

const getActors = function () {
  return updateActors();
};

export default {
  getConfig: () => getConfig().journey,
  clear,
  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,
  addSection,
  getSections,
  getTasks,
  addTask,
  addTaskOrg,
  getActors,
};
