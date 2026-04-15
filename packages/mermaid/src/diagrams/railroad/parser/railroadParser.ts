import {
  MermaidParseError,
  createRailroadServices,
  type Railroad,
  type RailroadChoiceExpr,
  type RailroadExpression,
  type RailroadNonTerminalExpr,
  type RailroadOneOrMoreExpr,
  type RailroadOptionalExpr,
  type RailroadRule as LangiumRailroadRule,
  type RailroadSequenceExpr,
  type RailroadSpecialExpr,
  type RailroadTerminalExpr,
  type RailroadZeroOrMoreExpr,
} from '@mermaid-js/parser';

import type { ParserDefinition } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import { populateCommonDb } from '../../common/populateCommonDb.js';
import { db } from '../railroadDb.js';
import type { ASTNode, RailroadRule } from '../railroadTypes.js';

const langiumParser = createRailroadServices().Railroad.parser.LangiumParser;

const transformExpression = (expr: RailroadExpression): ASTNode => {
  switch (expr.$type) {
    case 'RailroadTerminalExpr':
      return {
        type: 'terminal',
        value: (expr as RailroadTerminalExpr).value,
      };
    case 'RailroadNonTerminalExpr':
      return {
        type: 'nonterminal',
        name: (expr as RailroadNonTerminalExpr).name,
      };
    case 'RailroadSpecialExpr':
      return {
        type: 'special',
        text: (expr as RailroadSpecialExpr).text,
      };
    case 'RailroadSequenceExpr': {
      const elements = (expr as RailroadSequenceExpr).elements.map(transformExpression);
      return elements.length === 1 ? elements[0] : { type: 'sequence', elements };
    }
    case 'RailroadChoiceExpr': {
      const alternatives = (expr as RailroadChoiceExpr).alternatives.map(transformExpression);
      return alternatives.length === 1 ? alternatives[0] : { type: 'choice', alternatives };
    }
    case 'RailroadOptionalExpr':
      return {
        type: 'optional',
        element: transformExpression((expr as RailroadOptionalExpr).element),
      };
    case 'RailroadOneOrMoreExpr':
      return {
        type: 'repetition',
        element: transformExpression((expr as RailroadOneOrMoreExpr).element),
        min: 1,
        max: Infinity,
      };
    case 'RailroadZeroOrMoreExpr':
      return {
        type: 'repetition',
        element: transformExpression((expr as RailroadZeroOrMoreExpr).element),
        min: 0,
        max: Infinity,
      };
    default:
      throw new Error(`Unsupported railroad expression: ${expr.$type}`);
  }
};

const transformRule = (rule: LangiumRailroadRule): RailroadRule => {
  return {
    name: rule.name,
    definition: transformExpression(rule.definition),
  };
};

const populateDb = (ast: Railroad): void => {
  populateCommonDb(ast, db);

  if (ast.title) {
    db.setTitle(ast.title);
  }

  ast.rules.map((rule) => db.addRule(transformRule(rule)));
};

export const parser: ParserDefinition = {
  parse: (input: string): void => {
    db.clear();
    log.debug('[Railroad Parser] Starting Langium parse');

    const result = langiumParser.parse<Railroad>(input);
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
      throw new MermaidParseError(result);
    }

    const ast = result.value;
    log.debug('[Railroad Parser] Parsed rules:', ast.rules.length);

    populateDb(ast);
    log.debug('[Railroad Parser] Parse complete');
  },
  parser: {
    yy: db,
  },
};

export default parser;
