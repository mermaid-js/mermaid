import { log } from '../../logger.js';
import mermaidAPI from '../../mermaidAPI.js';
import * as configApi from '../../config.js';
import common from '../common/common.js';
import { clear as commonClear } from '../../commonDb.js';

let teams = {};
let interactions = {};

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

const addInteraction = function (fromTeam, interactionType, toTeam) {
  if (interactions[fromTeam] === undefined) {
    interactions[fromTeam] = {};
  }
  if (interactions[fromTeam][interactionType] === undefined) {
    interactions[fromTeam][interactionType] = [];
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

const clear = function () {
  teams = {};
  interactions = {};
  commonClear();
};

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().tt,
  addInteraction,
  getInteractions,
  addTeam,
  getTeams,
  clear,
};
