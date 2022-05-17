import mermaidAPI from '../../mermaidAPI';
import * as configApi from '../../config';
import common from '../common/common';
import {
  setAccTitle,
  getTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb';

const sanitizeText = (txt) => common.sanitizeText(txt, configApi.getConfig());

let title = '';
let description = '';
let currentSection = '';

const sections = [];
const tasks = [];
const rawTasks = [];

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

export const clear = function () {
  sections.length = 0;
  tasks.length = 0;
  currentSection = '';
  title = '';
  description = '';
  rawTasks.length = 0;
  commonClear();
};

export const addSection = function (txt) {
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
  const tempActors = [];
  tasks.forEach((task) => {
    if (task.people) {
      tempActors.push(...task.people);
    }
  });

  const unique = new Set(tempActors);
  return [...unique].sort();
};

export const addTask = function (descr, taskData) {
  const pieces = taskData.substr(1).split(':');

  let score = 0;
  let peeps = [];
  if (pieces.length === 1) {
    score = Number(pieces[0]);
    peeps = [];
  } else {
    score = Number(pieces[0]);
    peeps = pieces[1].split(',');
  }
  const peopleList = peeps.map((s) => s.trim());

  const rawTask = {
    section: currentSection,
    type: currentSection,
    people: peopleList,
    task: descr,
    score,
  };

  rawTasks.push(rawTask);
};

export const addTaskOrg = function (descr) {
  const newTask = {
    section: currentSection,
    type: currentSection,
    description: descr,
    task: descr,
    classes: [],
  };
  tasks.push(newTask);
};

const compileTasks = function () {
  const compileTask = function (pos) {
    return rawTasks[pos].processed;
  };

  let allProcessed = true;
  for (let i = 0; i < rawTasks.length; i++) {
    compileTask(i);

    allProcessed = allProcessed && rawTasks[i].processed;
  }
  return allProcessed;
};

const getActors = function () {
  return updateActors();
};

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().journey,
  clear,
  setAccTitle,
  getTitle,
  setAccDescription,
  getAccDescription,
  addSection,
  getSections,
  getTasks,
  addTask,
  addTaskOrg,
  getActors,
};
