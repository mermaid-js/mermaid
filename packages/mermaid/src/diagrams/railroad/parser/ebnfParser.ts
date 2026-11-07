import {
  MermaidParseError,
  createRailroadEbnfServices,
  type RailroadEbnfStandard,
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

const defaultServices = createRailroadEbnfServices().RailroadEbnf;
// `iso` lexes like the default; only `w3c` needs its own lexer (no `? ... ?` token).
const w3cServices = createRailroadEbnfServices(undefined, 'w3c').RailroadEbnf;

const STANDARDS: readonly RailroadEbnfStandard[] = ['w3c', 'iso'];

interface Located {
  line: number;
  column: number;
}

const diagnostic = (at: Located | undefined, message: string): string =>
  `Parse error on line ${at?.line ?? '?'}, column ${at?.column ?? '?'}: ${message}`;

const locate = (
  node: { $cstNode?: { range: { start: { line: number; character: number } } } } | undefined
): Located | undefined => {
  const start = node?.$cstNode?.range.start;
  return start ? { line: start.line + 1, column: start.character + 1 } : undefined;
};

/**
 * Read the `standard` lines from the header. The choice has to be known before parsing because
 * W3C and ISO tokenize `? ... ?` differently, so this runs the default lexer, which reads the
 * header the same way under both.
 */
const readStandard = (input: string): { standard?: RailroadEbnfStandard; errors: string[] } => {
  const errors: string[] = [];
  let standard: RailroadEbnfStandard | undefined;
  let seen = 0;
  for (const token of defaultServices.parser.Lexer.tokenize(input).tokens) {
    if (token.tokenType.name !== 'STANDARD') {
      continue;
    }
    seen++;
    const at = { line: token.startLine ?? 0, column: token.startColumn ?? 0 };
    const value = token.image.slice('standard'.length).trim();
    if (seen > 1) {
      errors.push(diagnostic(at, 'only one `standard` line is allowed'));
    } else if ((STANDARDS as readonly string[]).includes(value)) {
      standard = value as RailroadEbnfStandard;
    } else {
      errors.push(
        diagnostic(at, `unknown standard "${value}", expected one of: ${STANDARDS.join(', ')}`)
      );
    }
  }
  return { standard, errors };
};

const collectChoice = (
  choice: EbnfChoice,
  standard: RailroadEbnfStandard | undefined,
  errors: string[]
): void => {
  for (const sequence of choice.alternatives) {
    if (standard === 'w3c') {
      for (const comma of sequence.commas) {
        errors.push(
          diagnostic(
            locate(comma),
            'the "," separator is not W3C notation, separate elements with whitespace'
          )
        );
      }
    }
    for (const term of sequence.elements) {
      collectPrimary(term.base, standard, errors);
      for (const postfix of term.postfixes) {
        collectPostfix(postfix, standard, errors);
      }
    }
  }
};

const collectPrimary = (
  primary: EbnfPrimary,
  standard: RailroadEbnfStandard | undefined,
  errors: string[]
): void => {
  if (
    primary.$type === 'EbnfGroup' ||
    primary.$type === 'EbnfOptional' ||
    primary.$type === 'EbnfRepetition'
  ) {
    collectChoice((primary as EbnfGroup).element, standard, errors);
  }
};

const ISO_POSTFIX_HINTS: Record<string, string> = {
  EbnfOptionalPostfix: '?: use [ ... ]',
  EbnfZeroOrMorePostfix: '*: use { ... }',
  EbnfOneOrMorePostfix: '+: use "x, { x }"',
};

const collectPostfix = (
  postfix: EbnfPostfix,
  standard: RailroadEbnfStandard | undefined,
  errors: string[]
): void => {
  if (postfix.$type === 'EbnfExceptionPostfix') {
    collectPrimary((postfix as EbnfExceptionPostfix).except, standard, errors);
  } else if (standard === 'iso') {
    const hint = ISO_POSTFIX_HINTS[postfix.$type];
    errors.push(diagnostic(locate(postfix), `the postfix operator ${hint} (ISO 14977 notation)`));
  }
};

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

    const header = readStandard(input);
    if (header.errors.length > 0) {
      throw new Error(`Parsing failed: ${header.errors.join('\n')}`);
    }

    const services = header.standard === 'w3c' ? w3cServices : defaultServices;
    const result = services.parser.LangiumParser.parse<RailroadEbnf>(input);
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
      throw new MermaidParseError(result);
    }

    const ast = result.value;
    const notation: string[] = [];
    ast.rules.forEach((rule) => collectChoice(rule.definition, header.standard, notation));
    if (notation.length > 0) {
      throw new Error(`Parsing failed: ${notation.join('\n')}`);
    }
    log.debug('[EBNF Parser] Parsed rules:', ast.rules.length);

    populateDb(ast);
    log.debug('[EBNF Parser] Parse complete');
  },
  parser: {
    yy: db,
  },
};

export default parser;
