import mermaidAPI from '../../mermaidAPI.js';
import * as configApi from '../../config.js';
import { log } from '../../logger.js';
import { sanitizeText } from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb.js';
import { SequenceDB } from './sequenceTypes.js';
import type { DiagramDB, ParseDirectiveDefinition } from '../../diagram-api/types.js';
import { parseDirective as _parseDirective } from '../../directiveUtils.js';

const prevActor = undefined;
const actors = {};
const createdActors = {};
const destroyedActors = {};
const boxes = [];
const messages = [];
const notes = [];
const sequenceNumbersEnabled = false;
let wrapEnabled;
const currentBox = undefined;
const lastCreated = undefined;
const lastDestroyed = undefined;

const parseDirective: ParseDirectiveDefinition = (statement, context, type) => {
  _parseDirective(this, statement, context, type);
};
