import {
  MermaidParseError,
  createRailroadAbnfServices,
  type RailroadAbnf,
  type AbnfAlternation,
  type AbnfConcatenation,
  type AbnfElement,
  type AbnfGroup,
  type AbnfNumVal,
  type AbnfOptionalGroup,
  type AbnfPrimary,
  type AbnfRule as LangiumAbnfRule,
  type AbnfRuleName,
  type AbnfStringLiteral,
} from '@mermaid-js/parser';

import type { ParserDefinition } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import { populateCommonDb } from '../../common/populateCommonDb.js';
import { db } from '../railroadDb.js';
import type { ASTNode, RailroadRule } from '../railroadTypes.js';

const langiumParser = createRailroadAbnfServices().RailroadAbnf.parser.LangiumParser;

const transformAlternation = (alt: AbnfAlternation): ASTNode => {
  const alternatives = alt.alternatives.map(transformConcatenation);

  if (alternatives.length === 1) {
    return alternatives[0];
  }

  return {
    type: 'choice',
    alternatives,
  };
};

const transformConcatenation = (concat: AbnfConcatenation): ASTNode => {
  const elements = concat.elements.map(transformElement);

  if (elements.length === 1) {
    return elements[0];
  }

  return {
    type: 'sequence',
    elements,
  };
};

const parseRepeat = (repeat: string): { min: number; max: number } => {
  if (repeat.includes('*')) {
    const [minStr, maxStr] = repeat.split('*');
    const min = minStr ? parseInt(minStr, 10) : 0;
    const max = maxStr ? parseInt(maxStr, 10) : Infinity;
    return { min, max };
  }
  // Exact repeat: "3" means exactly 3
  const exact = parseInt(repeat, 10);
  return { min: exact, max: exact };
};

const transformElement = (element: AbnfElement): ASTNode => {
  const inner = transformPrimary(element.primary);

  if (!element.repeat) {
    return inner;
  }

  const { min, max } = parseRepeat(element.repeat);

  if (min === 0 && max === 1) {
    return { type: 'optional', element: inner };
  }

  return {
    type: 'repetition',
    element: inner,
    min,
    max,
  };
};

const transformPrimary = (primary: AbnfPrimary): ASTNode => {
  switch (primary.$type) {
    case 'AbnfStringLiteral':
      return {
        type: 'terminal',
        value: (primary as AbnfStringLiteral).value,
      };
    case 'AbnfNumVal':
      return {
        type: 'terminal',
        value: (primary as AbnfNumVal).value,
      };
    case 'AbnfRuleName':
      return {
        type: 'nonterminal',
        name: (primary as AbnfRuleName).name,
      };
    case 'AbnfGroup':
      return transformAlternation((primary as AbnfGroup).element);
    case 'AbnfOptionalGroup':
      return {
        type: 'optional',
        element: transformAlternation((primary as AbnfOptionalGroup).element),
      };
    default:
      throw new Error(`Unsupported ABNF primary node: ${primary.$type}`);
  }
};

const transformRule = (rule: LangiumAbnfRule): RailroadRule => {
  return {
    name: rule.name,
    definition: transformAlternation(rule.definition),
  };
};

const populateDb = (ast: RailroadAbnf): void => {
  populateCommonDb(ast, db);

  if (ast.title) {
    db.setTitle(ast.title);
  }

  ast.rules.map((rule) => db.addRule(transformRule(rule)));
};

export const parser: ParserDefinition = {
  parse: (input: string): void => {
    db.clear();
    log.debug('[ABNF Parser] Starting Langium parse');

    const result = langiumParser.parse<RailroadAbnf>(input);
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
      throw new MermaidParseError(result);
    }

    const ast = result.value;
    log.debug('[ABNF Parser] Parsed rules:', ast.rules.length);

    populateDb(ast);
    log.debug('[ABNF Parser] Parse complete');
  },
  parser: {
    yy: db,
  },
};

export default parser;
