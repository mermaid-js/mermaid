import {
  MermaidParseError,
  createRailroadServices,
  type Railroad,
  type RailroadChoice,
  type RailroadExceptionPostfix,
  type RailroadGroup,
  type RailroadNonTerminal,
  type RailroadOptional,
  type RailroadPostfix,
  type RailroadPrimary,
  type RailroadRepetition,
  type RailroadRule as LangiumRailroadRule,
  type RailroadSequence,
  type RailroadSpecial,
  type RailroadTerm,
  type RailroadTerminal,
} from '@mermaid-js/parser';

import type { ParserDefinition } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import { populateCommonDb } from '../../common/populateCommonDb.js';
import { db } from '../railroadDb.js';
import type { ASTNode, RailroadRule } from '../railroadTypes.js';

const langiumParser = createRailroadServices().Railroad.parser.LangiumParser;

const transformChoice = (choice: RailroadChoice): ASTNode => {
  const alternatives = choice.alternatives.map(transformSequence);

  if (alternatives.length === 1) {
    return alternatives[0];
  }

  return {
    type: 'choice',
    alternatives,
  };
};

const transformSequence = (sequence: RailroadSequence): ASTNode => {
  const elements = sequence.elements.map(transformTerm);

  if (elements.length === 1) {
    return elements[0];
  }

  return {
    type: 'sequence',
    elements,
  };
};

const transformPrimary = (primary: RailroadPrimary): ASTNode => {
  switch (primary.$type) {
    case 'RailroadTerminal':
      return {
        type: 'terminal',
        value: (primary as RailroadTerminal).value,
      };
    case 'RailroadNonTerminal':
      return {
        type: 'nonterminal',
        name: (primary as RailroadNonTerminal).name,
      };
    case 'RailroadSpecial':
      return {
        type: 'special',
        text: (primary as RailroadSpecial).text,
      };
    case 'RailroadGroup':
      return {
        type: 'group',
        element: transformChoice((primary as RailroadGroup).element),
      };
    case 'RailroadOptional':
      return {
        type: 'optional',
        element: transformChoice((primary as RailroadOptional).element),
      };
    case 'RailroadRepetition':
      return {
        type: 'repetition',
        element: transformChoice((primary as RailroadRepetition).element),
        min: 0,
        max: Infinity,
      };
    default:
      throw new Error(`Unsupported railroad primary node: ${primary.$type}`);
  }
};

const transformPostfix = (node: ASTNode, postfix: RailroadPostfix): ASTNode => {
  switch (postfix.$type) {
    case 'RailroadOptionalPostfix':
      return {
        type: 'optional',
        element: node,
      };
    case 'RailroadZeroOrMorePostfix':
      return {
        type: 'repetition',
        element: node,
        min: 0,
        max: Infinity,
      };
    case 'RailroadOneOrMorePostfix':
      return {
        type: 'repetition',
        element: node,
        min: 1,
        max: Infinity,
      };
    case 'RailroadExceptionPostfix':
      return {
        type: 'exception',
        base: node,
        except: transformPrimary((postfix as RailroadExceptionPostfix).except),
      };
    default:
      throw new Error(`Unsupported railroad postfix node: ${postfix.$type}`);
  }
};

const transformTerm = (term: RailroadTerm): ASTNode => {
  return term.postfixes.reduce((currentNode, postfix) => {
    return transformPostfix(currentNode, postfix);
  }, transformPrimary(term.base));
};

const transformRule = (rule: LangiumRailroadRule): RailroadRule => {
  return {
    name: rule.name,
    definition: transformChoice(rule.definition),
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
