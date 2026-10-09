import {
  MermaidParseError,
  createRailroadEbnfServices,
  type RailroadEbnf,
  type EbnfChoice,
  type EbnfExceptionPostfix,
  type EbnfGroup,
  type EbnfNonTerminal,
  type EbnfOptional,
  type EbnfPostfix,
  type EbnfPrimary,
  type EbnfRepetition,
  type EbnfRule as LangiumEbnfRule,
  type EbnfSequence,
  type EbnfSpecial,
  type EbnfTerm,
  type EbnfTerminal,
} from '@mermaid-js/parser';

import type { ParserDefinition } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import { populateCommonDb } from '../../common/populateCommonDb.js';
import { db } from '../railroadDb.js';
import type { ASTNode, RailroadRule } from '../railroadTypes.js';

const langiumParser = createRailroadEbnfServices().RailroadEbnf.parser.LangiumParser;

const transformChoice = (choice: EbnfChoice): ASTNode => {
  const alternatives = choice.alternatives.map(transformSequence);

  if (alternatives.length === 1) {
    return alternatives[0];
  }

  return {
    type: 'choice',
    alternatives,
  };
};

const transformSequence = (sequence: EbnfSequence): ASTNode => {
  const elements = sequence.elements.map(transformTerm);

  if (elements.length === 1) {
    return elements[0];
  }

  return {
    type: 'sequence',
    elements,
  };
};

const transformPrimary = (primary: EbnfPrimary): ASTNode => {
  switch (primary.$type) {
    case 'EbnfTerminal':
      return {
        type: 'terminal',
        value: (primary as EbnfTerminal).value,
      };
    case 'EbnfNonTerminal':
      return {
        type: 'nonterminal',
        name: (primary as EbnfNonTerminal).name,
      };
    case 'EbnfSpecial':
      return {
        type: 'special',
        text: (primary as EbnfSpecial).text,
      };
    case 'EbnfGroup':
      return transformChoice((primary as EbnfGroup).element);
    case 'EbnfOptional':
      return {
        type: 'optional',
        element: transformChoice((primary as EbnfOptional).element),
      };
    case 'EbnfRepetition':
      return {
        type: 'repetition',
        element: transformChoice((primary as EbnfRepetition).element),
        min: 0,
        max: Infinity,
      };
    default:
      throw new Error(`Unsupported EBNF primary node: ${primary.$type}`);
  }
};

const transformPostfix = (node: ASTNode, postfix: EbnfPostfix): ASTNode => {
  switch (postfix.$type) {
    case 'EbnfOptionalPostfix':
      return {
        type: 'optional',
        element: node,
      };
    case 'EbnfZeroOrMorePostfix':
      return {
        type: 'repetition',
        element: node,
        min: 0,
        max: Infinity,
      };
    case 'EbnfOneOrMorePostfix':
      return {
        type: 'repetition',
        element: node,
        min: 1,
        max: Infinity,
      };
    case 'EbnfExceptionPostfix':
      return {
        type: 'sequence',
        elements: [
          node,
          { type: 'terminal', value: '-' },
          transformPrimary((postfix as EbnfExceptionPostfix).except),
        ],
      };
    default:
      throw new Error(`Unsupported EBNF postfix node: ${postfix.$type}`);
  }
};

const transformTerm = (term: EbnfTerm): ASTNode => {
  return term.postfixes.reduce((currentNode, postfix) => {
    return transformPostfix(currentNode, postfix);
  }, transformPrimary(term.base));
};

const transformRule = (rule: LangiumEbnfRule): RailroadRule => {
  return {
    name: rule.name,
    definition: transformChoice(rule.definition),
  };
};

const populateDb = (ast: RailroadEbnf): void => {
  populateCommonDb(ast, db);

  if (ast.title) {
    db.setTitle(ast.title);
  }

  ast.rules.map((rule) => db.addRule(transformRule(rule)));
};

export const parser: ParserDefinition = {
  parse: (input: string): void => {
    db.clear();
    log.debug('[EBNF Parser] Starting Langium parse');

    const result = langiumParser.parse<RailroadEbnf>(input);
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
      throw new MermaidParseError(result);
    }

    const ast = result.value;
    log.debug('[EBNF Parser] Parsed rules:', ast.rules.length);

    populateDb(ast);
    log.debug('[EBNF Parser] Parse complete');
  },
  parser: {
    yy: db,
  },
};

export default parser;
