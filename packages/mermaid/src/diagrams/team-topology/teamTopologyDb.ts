import { log } from '../../logger.js';
import mermaidAPI from '../../mermaidAPI.js';
import * as configApi from '../../config.js';
import common from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb.js';

let teams = {};
let interactions = {};
let showData = false;

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

const addInteraction = function (fromTeam, interactionType, toTeam) {
  if (interactions[fromTeam] === undefined) {
    interactions[fromTeam] = {}
  }
  if (interactions[fromTeam][interactionType] === undefined) {
    interactions[fromTeam][interactionType] = []
  }
  if (!interactions[fromTeam][interactionType].includes(toTeam)) {
    interactions[fromTeam][interactionType].push(toTeam);
  }
};
const getInteractions = () => interactions;

const addTeam = function (teamName, teamType) {
  if (teams[teamName] === undefined) {
    teams[teamName] = teamType;
    log.debug('Added new team :', teamName);
  }
};
const getTeams = () => teams;

const setShowData = function (toggle) {
  showData = toggle;
};

const getShowData = function () {
  return showData;
};

const cleanupValue = function (value) {
  if (value.substring(0, 1) === ':') {
    value = value.substring(1).trim();
    return Number(value.trim());
  } else {
    return Number(value.trim());
  }
};

const clear = function () {
  teams = {};
  interactions = {};
  showData = false;
  commonClear();
};

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().tt,
  addInteraction,
  getInteractions,
  addTeam,
  getTeams,
  cleanupValue,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  setShowData,
  getShowData,
  getAccDescription,
  setAccDescription,
};
