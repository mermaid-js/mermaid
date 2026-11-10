import { MermaidParseError } from '../../parse.js';
import type { EbnfChoice, EbnfPostfix, EbnfPrimary, RailroadEbnf } from '../generated/ast.js';
import {
  isEbnfExceptionPostfix,
  isEbnfGroup,
  isEbnfOptional,
  isEbnfRepetition,
} from '../generated/ast.js';
import { createRailroadEbnfServices, type RailroadEbnfServices } from './module.js';
import type { RailroadEbnfStandard } from './tokenBuilder.js';

const STANDARDS: readonly RailroadEbnfStandard[] = ['w3c', 'iso'];

const STANDARD_NAMES: readonly string[] = STANDARDS;

const isStandard = (value: string): value is RailroadEbnfStandard => STANDARD_NAMES.includes(value);

/** One refusal of the `standard` line or of the notation it names. Lines and columns are 1-based. */
export interface RailroadEbnfDiagnostic {
  line?: number;
  column?: number;
  message: string;
}

const formatDiagnostic = ({ line, column, message }: RailroadEbnfDiagnostic): string =>
  `Parse error on line ${line ?? '?'}, column ${column ?? '?'}: ${message}`;

/**
 * Thrown by {@link parseRailroadEbnf} when the text parses but its `standard` line is invalid or the
 * rules use a construct the named notation does not have. `diagnostics` lists every refusal; the
 * message joins them in the same `Parse error on line L, column C: ...` form as
 * {@link MermaidParseError}.
 */
export class RailroadEbnfNotationError extends Error {
  constructor(public readonly diagnostics: RailroadEbnfDiagnostic[]) {
    super(`Parsing failed: ${diagnostics.map(formatDiagnostic).join('\n')}`);
  }
}

interface ServicesByStandard {
  default: RailroadEbnfServices;
  w3c: RailroadEbnfServices;
}

let services: ServicesByStandard | undefined;

/** `iso` lexes like the default; only `w3c` needs its own lexer (no `? ... ?` token). */
const getServices = (): ServicesByStandard =>
  (services ??= {
    default: createRailroadEbnfServices().RailroadEbnf,
    w3c: createRailroadEbnfServices(undefined, 'w3c').RailroadEbnf,
  });

const at = (
  node: { $cstNode?: { range: { start: { line: number; character: number } } } },
  message: string
): RailroadEbnfDiagnostic => {
  const start = node.$cstNode?.range.start;
  return start ? { line: start.line + 1, column: start.character + 1, message } : { message };
};

/**
 * Read the `standard` lines from the header. The choice has to be known before parsing because
 * W3C and ISO tokenize `? ... ?` differently, so this runs the default lexer, which reads the
 * header the same way under both.
 */
const readStandard = (
  input: string
): { standard?: RailroadEbnfStandard; diagnostics: RailroadEbnfDiagnostic[] } => {
  const diagnostics: RailroadEbnfDiagnostic[] = [];
  let standard: RailroadEbnfStandard | undefined;
  let seen = 0;
  for (const token of getServices().default.parser.Lexer.tokenize(input).tokens) {
    if (token.tokenType.name !== 'STANDARD') {
      continue;
    }
    seen++;
    const line = token.startLine ?? 0;
    const column = token.startColumn ?? 0;
    const value = token.image.slice('standard'.length).trim();
    if (seen > 1) {
      diagnostics.push({ line, column, message: 'only one `standard` line is allowed' });
    } else if (isStandard(value)) {
      standard = value;
    } else {
      diagnostics.push({
        line,
        column,
        message: `unknown standard "${value}", expected one of: ${STANDARDS.join(', ')}`,
      });
    }
  }
  return { standard, diagnostics };
};

const collectChoice = (
  choice: EbnfChoice,
  standard: RailroadEbnfStandard | undefined,
  diagnostics: RailroadEbnfDiagnostic[]
): void => {
  for (const sequence of choice.alternatives) {
    if (standard === 'w3c') {
      for (const comma of sequence.commas) {
        diagnostics.push(
          at(comma, 'the "," separator is not W3C notation, separate elements with whitespace')
        );
      }
    }
    if (standard === 'iso' && sequence.commas.length < sequence.elements.length - 1) {
      diagnostics.push(
        at(
          sequence,
          'ISO 14977 notation separates the elements of a sequence with ",", add the missing ","'
        )
      );
    }
    for (const term of sequence.elements) {
      collectPrimary(term.base, standard, diagnostics);
      for (const postfix of term.postfixes) {
        collectPostfix(postfix, standard, diagnostics);
      }
    }
  }
};

/** ISO brackets refused under `standard w3c`, with the W3C postfix that replaces each. */
const W3C_BRACKET_HINTS: Record<string, string> = {
  EbnfOptional: '[ ... ] optional is not W3C notation, use the postfix ?',
  EbnfRepetition: '{ ... } repetition is not W3C notation, use the postfix *',
};

const collectPrimary = (
  primary: EbnfPrimary,
  standard: RailroadEbnfStandard | undefined,
  diagnostics: RailroadEbnfDiagnostic[]
): void => {
  const w3cHint = standard === 'w3c' ? W3C_BRACKET_HINTS[primary.$type] : undefined;
  if (w3cHint) {
    diagnostics.push(at(primary, `the ${w3cHint}`));
  }
  if (isEbnfGroup(primary) || isEbnfOptional(primary) || isEbnfRepetition(primary)) {
    collectChoice(primary.element, standard, diagnostics);
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
  diagnostics: RailroadEbnfDiagnostic[]
): void => {
  if (isEbnfExceptionPostfix(postfix)) {
    collectPrimary(postfix.except, standard, diagnostics);
  } else if (standard === 'iso') {
    const hint = ISO_POSTFIX_HINTS[postfix.$type];
    diagnostics.push(at(postfix, `the postfix operator ${hint} (ISO 14977 notation)`));
  }
};

/**
 * Parse `railroad-ebnf-beta` text in the notation its `standard` line names: `standard w3c` lexes
 * `?` only as a postfix operator and refuses `,`, `[ ... ]` and `{ ... }`; `standard iso` reads
 * `? ... ?` as a special sequence, requires `,` between elements and refuses the postfix operators
 * `?`, `*` and `+`. Without a `standard` line both notations are accepted together.
 *
 * @throws {@link MermaidParseError} when the text does not lex or parse.
 * @throws {@link RailroadEbnfNotationError} when the `standard` line is unknown or repeated (checked
 * before parsing), or when a rule uses a construct the named notation does not have.
 */
export const parseRailroadEbnf = (text: string): RailroadEbnf => {
  const header = readStandard(text);
  if (header.diagnostics.length > 0) {
    throw new RailroadEbnfNotationError(header.diagnostics);
  }
  const { parser } = header.standard === 'w3c' ? getServices().w3c : getServices().default;
  const result = parser.LangiumParser.parse<RailroadEbnf>(text);
  if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
    throw new MermaidParseError(result);
  }
  const notation: RailroadEbnfDiagnostic[] = [];
  result.value.rules.forEach((rule) => collectChoice(rule.definition, header.standard, notation));
  if (notation.length > 0) {
    throw new RailroadEbnfNotationError(notation);
  }
  return result.value;
};
