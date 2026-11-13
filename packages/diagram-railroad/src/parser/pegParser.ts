import {
  MermaidParseError,
  createRailroadPegServices,
  type RailroadPeg,
  type PegAny,
  type PegGroup,
  type PegIdentifier,
  type PegLiteral,
  type PegOrderedChoice,
  type PegPrefix,
  type PegPrimary,
  type PegRule as LangiumPegRule,
  type PegSequence,
  type PegSuffix,
} from '@mermaid-js/parser';

import type { ParserDefinition } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import { populateCommonDb } from '../../common/populateCommonDb.js';
import { db } from '../railroadDb.js';
import type { ASTNode, RailroadRule } from '../railroadTypes.js';

const langiumParser = createRailroadPegServices().RailroadPeg.parser.LangiumParser;

const transformOrderedChoice = (choice: PegOrderedChoice): ASTNode => {
  const alternatives = choice.alternatives.map(transformSequence);

  if (alternatives.length === 1) {
    return alternatives[0];
  }

  return {
    type: 'choice',
    alternatives,
  };
};

const transformSequence = (sequence: PegSequence): ASTNode => {
  const elements = sequence.elements.map(transformPrefix);

  if (elements.length === 1) {
    return elements[0];
  }

  return {
    type: 'sequence',
    elements,
  };
};

const transformPrefix = (prefix: PegPrefix): ASTNode => {
  const inner = transformSuffix(prefix.suffix);

  if (!prefix.operator) {
    return inner;
  }

  // & and ! are lookahead operators - render as special nodes
  const label = prefix.operator === '&' ? `&${nodeToLabel(inner)}` : `!${nodeToLabel(inner)}`;
  return {
    type: 'special',
    text: label,
  };
};

const nodeToLabel = (node: ASTNode): string => {
  switch (node.type) {
    case 'terminal':
      return `"${node.value}"`;
    case 'nonterminal':
      return node.name;
    case 'special':
      return node.text;
    default:
      return '(...)';
  }
};

const transformSuffix = (suffix: PegSuffix): ASTNode => {
  const inner = transformPrimary(suffix.primary);

  if (!suffix.operator) {
    return inner;
  }

  switch (suffix.operator) {
    case '?':
      return { type: 'optional', element: inner };
    case '*':
      return { type: 'repetition', element: inner, min: 0, max: Infinity };
    case '+':
      return { type: 'repetition', element: inner, min: 1, max: Infinity };
    default:
      throw new Error(`Unsupported PEG suffix operator: ${suffix.operator}`);
  }
};

const transformPrimary = (primary: PegPrimary): ASTNode => {
  switch (primary.$type) {
    case 'PegLiteral':
      return {
        type: 'terminal',
        value: (primary as PegLiteral).value,
      };
    case 'PegIdentifier':
      return {
        type: 'nonterminal',
        name: (primary as PegIdentifier).name,
      };
    case 'PegGroup':
      return transformOrderedChoice((primary as PegGroup).element);
    case 'PegAny':
      return {
        type: 'special',
        text: (primary as PegAny).dot,
      };
    default:
      throw new Error(`Unsupported PEG primary node: ${primary.$type}`);
  }
};

const transformRule = (rule: LangiumPegRule): RailroadRule => {
  return {
    name: rule.name,
    definition: transformOrderedChoice(rule.definition),
  };
};

const populateDb = (ast: RailroadPeg): void => {
  populateCommonDb(ast, db);

  if (ast.title) {
    db.setTitle(ast.title);
  }

  ast.rules.map((rule) => db.addRule(transformRule(rule)));
};

export const parser: ParserDefinition = {
  parse: (input: string): void => {
    db.clear();
    log.debug('[PEG Parser] Starting Langium parse');

    const result = langiumParser.parse<RailroadPeg>(input);
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
      throw new MermaidParseError(result);
    }

    const ast = result.value;
    log.debug('[PEG Parser] Parsed rules:', ast.rules.length);

    populateDb(ast);
    log.debug('[PEG Parser] Parse complete');
  },
  parser: {
    yy: db,
  },
};

export default parser;
