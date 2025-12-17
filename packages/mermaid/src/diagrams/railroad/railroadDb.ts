import type { RailroadDB, RailroadRule } from './railroadTypes.js';
import { log } from '../../logger.js';
import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import { clear as commonClear } from '../common/commonDb.js';

let title = '';
let accTitle = '';
let accDescription = '';
let diagramTitle = '';
const rules: RailroadRule[] = [];
const ruleMap = new Map<string, RailroadRule>();

/**
 * Clear all diagram state
 */
const clear = (): void => {
  title = '';
  accTitle = '';
  accDescription = '';
  diagramTitle = '';
  rules.length = 0;
  ruleMap.clear();
  commonClear();
  log.debug('[Railroad] Database cleared');
};

/**
 * Set diagram title
 */
const setTitle = (text: string): void => {
  title = text;
  log.debug('[Railroad] Title set:', text);
};

/**
 * Get diagram title
 */
const getTitle = (): string => {
  return title;
};

/**
 * Add a new rule to the diagram
 */
const addRule = (rule: RailroadRule): void => {
  log.debug('[Railroad] Adding rule:', rule.name);

  // Check for duplicate rule names
  if (ruleMap.has(rule.name)) {
    log.warn(`[Railroad] Rule '${rule.name}' is already defined. Overwriting.`);
  }

  rules.push(rule);
  ruleMap.set(rule.name, rule);
};

/**
 * Get all rules
 */
const getRules = (): RailroadRule[] => {
  return rules;
};

/**
 * Get a specific rule by name
 */
const getRule = (name: string): RailroadRule | undefined => {
  return ruleMap.get(name);
};

/**
 * Set accessibility title
 */
const setAccTitle = (text: string): void => {
  accTitle = text;
  log.debug('[Railroad] Accessibility title set:', text);
};

/**
 * Get accessibility title
 */
const getAccTitle = (): string => {
  return accTitle;
};

/**
 * Set accessibility description
 */
const setAccDescription = (text: string): void => {
  accDescription = text;
  log.debug('[Railroad] Accessibility description set:', text);
};

/**
 * Get accessibility description
 */
const getAccDescription = (): string => {
  return accDescription;
};

/**
 * Set diagram title (alias for setTitle)
 */
const setDiagramTitle = (text: string): void => {
  diagramTitle = text;
  log.debug('[Railroad] Diagram title set:', text);
};

/**
 * Get diagram title (alias for getTitle)
 */
const getDiagramTitle = (): string => {
  return diagramTitle || title;
};

/**
 * Get configuration
 */
const getRailroadConfig = () => {
  return getGlobalConfig().railroad || {};
};

/**
 * Export the database object
 */
export const db: RailroadDB = {
  clear,
  setTitle,
  getTitle,
  addRule,
  getRules,
  getRule,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,
  setDiagramTitle,
  getDiagramTitle,
};

export default db;
