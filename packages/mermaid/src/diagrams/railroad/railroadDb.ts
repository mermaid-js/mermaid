import type { ASTNode, RailroadDB, RailroadRule } from './railroadTypes.js';
import { log } from '../../logger.js';
import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import { clear as commonClear } from '../common/commonDb.js';
import { sanitizeText as commonSanitizeText } from '../common/common.js';

let diagramTitle = '';
let accTitle = '';
let accDescription = '';
const rules: RailroadRule[] = [];
const ruleMap = new Map<string, RailroadRule>();

const sanitizeText = (text: string): string => {
  return commonSanitizeText(text, getGlobalConfig());
};

const sanitizeAstNode = (node: ASTNode): ASTNode => {
  switch (node.type) {
    case 'terminal':
      return { ...node, value: sanitizeText(node.value) };
    case 'nonterminal':
      return { ...node, name: sanitizeText(node.name) };
    case 'sequence':
      return { ...node, elements: node.elements.map(sanitizeAstNode) };
    case 'choice':
      return { ...node, alternatives: node.alternatives.map(sanitizeAstNode) };
    case 'optional':
      return { ...node, element: sanitizeAstNode(node.element) };
    case 'repetition':
      return {
        ...node,
        element: sanitizeAstNode(node.element),
        separator: node.separator ? sanitizeAstNode(node.separator) : undefined,
      };
    case 'group':
      return { ...node, element: sanitizeAstNode(node.element) };
    case 'special':
      return { ...node, text: sanitizeText(node.text) };
    case 'exception':
      return {
        ...node,
        base: sanitizeAstNode(node.base),
        except: sanitizeAstNode(node.except),
      };
  }
};

/**
 * Clear all diagram state
 */
const clear = (): void => {
  diagramTitle = '';
  accTitle = '';
  accDescription = '';
  rules.length = 0;
  ruleMap.clear();
  commonClear();
  log.debug('[Railroad] Database cleared');
};

/**
 * Set diagram title
 */
const setTitle = (text: string): void => {
  diagramTitle = sanitizeText(text);
  log.debug('[Railroad] Title set:', text);
};

/**
 * Get diagram title
 */
const getTitle = (): string => {
  return diagramTitle;
};

/**
 * Add a new rule to the diagram
 */
const addRule = (rule: RailroadRule): void => {
  const sanitizedRule: RailroadRule = {
    ...rule,
    name: sanitizeText(rule.name),
    definition: sanitizeAstNode(rule.definition),
    comment: rule.comment ? sanitizeText(rule.comment) : undefined,
  };

  log.debug('[Railroad] Adding rule:', sanitizedRule.name);

  // Check for duplicate rule names
  if (ruleMap.has(sanitizedRule.name)) {
    log.warn(`[Railroad] Rule '${sanitizedRule.name}' is already defined. Overwriting.`);
  }

  rules.push(sanitizedRule);
  ruleMap.set(sanitizedRule.name, sanitizedRule);
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
  accTitle = sanitizeText(text).replace(/^\s+/g, '');
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
  accDescription = sanitizeText(text).replace(/\n\s+/g, '\n');
  log.debug('[Railroad] Accessibility description set:', text);
};

/**
 * Get accessibility description
 */
const getAccDescription = (): string => {
  return accDescription;
};

const setDiagramTitle = setTitle;
const getDiagramTitle = getTitle;

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
