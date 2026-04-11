/**
 * Parser for the railroad diagram expression language.
 *
 * Syntax:
 *   expression   = function_call
 *   function_call = IDENTIFIER "(" arg_list ")"
 *   arg_list      = (arg ("," arg)* ","?)?
 *   arg           = STRING | expression
 *
 * Allowed functions: textBox, sequence, stack, bypass, loop
 *
 * A source block may contain one or more rule definitions:
 *   ruleName := expression
 *
 * The tokenizer is ported from diagram.js (same repo).
 */

import { Expression } from './expression.js';
import type { Expr } from './expression.js';

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TokenType =
  | 'IDENTIFIER'
  | 'OPEN_PAREN'
  | 'CLOSE_PAREN'
  | 'COMMA'
  | 'STRING'
  | 'ASSIGN'
  | 'WHITESPACE'
  | 'EOF';

const TokenType = {
  IDENTIFIER: 'IDENTIFIER',
  OPEN_PAREN: 'OPEN_PAREN',
  CLOSE_PAREN: 'CLOSE_PAREN',
  COMMA: 'COMMA',
  STRING: 'STRING',
  ASSIGN: 'ASSIGN',
  WHITESPACE: 'WHITESPACE',
  EOF: 'EOF',
} as const satisfies Record<TokenType, TokenType>;

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

const TOKEN_RE =
  /(?<string>"(?:[^"\\]|\\.)*")|(?<identifier>[A-Z_a-z]\w*)|(?<assign>:=)|(?<openParen>\()|(?<closeParen>\))|(?<comma>,)|(?<whitespace>\s+)/g;

function tokenize(code: string, skipWhitespace = true): Token[] {
  const tokens: Token[] = [];
  TOKEN_RE.lastIndex = 0;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_RE.exec(code)) !== null) {
    if (match.index > lastIndex) {
      throw new Error(
        `Unexpected character(s) '${code.slice(lastIndex, match.index)}' at position ${lastIndex}`
      );
    }

    const g = match.groups!;
    let type: TokenType;
    if (g.string) {
      type = TokenType.STRING;
    } else if (g.identifier) {
      type = TokenType.IDENTIFIER;
    } else if (g.assign) {
      type = TokenType.ASSIGN;
    } else if (g.openParen) {
      type = TokenType.OPEN_PAREN;
    } else if (g.closeParen) {
      type = TokenType.CLOSE_PAREN;
    } else if (g.comma) {
      type = TokenType.COMMA;
    } else {
      type = TokenType.WHITESPACE;
    }

    if (!skipWhitespace || type !== TokenType.WHITESPACE) {
      tokens.push({ type, value: match[0], position: match.index });
    }

    lastIndex = TOKEN_RE.lastIndex;
  }

  if (lastIndex < code.length) {
    throw new Error(`Unexpected character(s) '${code.slice(lastIndex)}' at position ${lastIndex}`);
  }

  tokens.push({ type: TokenType.EOF, value: '', position: code.length });
  return tokens;
}

// ---------------------------------------------------------------------------
// Recursive descent parser
// ---------------------------------------------------------------------------

const ALLOWED_FUNCTIONS = new Set(['textBox', 'sequence', 'stack', 'bypass', 'loop']);

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(expectedType?: TokenType): Token {
    const tok = this.tokens[this.pos++];
    if (expectedType !== undefined && tok.type !== expectedType) {
      throw new Error(
        `Expected ${expectedType} but got ${tok.type} ('${tok.value}') at position ${tok.position}`
      );
    }
    return tok;
  }

  parseExpression(): Expr {
    const nameTok = this.consume(TokenType.IDENTIFIER);
    const funcName = nameTok.value;

    if (!ALLOWED_FUNCTIONS.has(funcName)) {
      throw new Error(`Unknown function '${funcName}' at position ${nameTok.position}`);
    }

    this.consume(TokenType.OPEN_PAREN);

    const args: (string | Expr)[] = [];

    while (this.peek().type !== TokenType.CLOSE_PAREN) {
      if (this.peek().type === TokenType.EOF) {
        throw new Error('Unexpected end of input inside function call');
      }

      if (this.peek().type === TokenType.STRING) {
        const strTok = this.consume(TokenType.STRING);
        // Strip surrounding double-quotes; unescape \" sequences
        args.push(strTok.value.slice(1, -1).replace(/\\"/g, '"'));
      } else {
        args.push(this.parseExpression());
      }

      if (this.peek().type === TokenType.COMMA) {
        this.consume(TokenType.COMMA);
      }
    }

    this.consume(TokenType.CLOSE_PAREN);

    return buildExpression(funcName, args, nameTok.position);
  }
}

function buildExpression(funcName: string, args: (string | Expr)[], pos: number): Expr {
  switch (funcName) {
    case 'textBox': {
      if (args.length !== 2 || typeof args[0] !== 'string' || typeof args[1] !== 'string') {
        throw new Error(`textBox() requires exactly two string arguments (at position ${pos})`);
      }
      return Expression.textBox(args[0], args[1]);
    }
    case 'sequence': {
      const children = args as Expr[];
      if (children.length === 0) {
        throw new Error(`sequence() requires at least one argument (at position ${pos})`);
      }
      return Expression.sequence(...children);
    }
    case 'stack': {
      const children = args as Expr[];
      if (children.length === 0) {
        throw new Error(`stack() requires at least one argument (at position ${pos})`);
      }
      return Expression.stack(...children);
    }
    case 'bypass': {
      if (args.length !== 1) {
        throw new Error(`bypass() requires exactly one argument (at position ${pos})`);
      }
      return Expression.bypass(args[0] as Expr);
    }
    case 'loop': {
      if (args.length !== 1) {
        throw new Error(`loop() requires exactly one argument (at position ${pos})`);
      }
      return Expression.loop(args[0] as Expr);
    }
    default:
      throw new Error(`Unknown function '${funcName}'`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RuleDefinition {
  name: string;
  expression: Expr;
}

/**
 * Parse one expression string (the right-hand side of a rule definition).
 *
 * @throws if the syntax is invalid or an unknown function is used.
 */
export function parseExpression(code: string): Expr {
  const tokens = tokenize(code);
  const parser = new Parser(tokens);
  const expr = parser.parseExpression();

  if (parser.peek().type !== TokenType.EOF) {
    const remaining = parser.peek();
    throw new Error(`Unexpected token '${remaining.value}' at position ${remaining.position}`);
  }

  return expr;
}

/**
 * Parse the full source body (after metadata lines have been stripped by the
 * parser). Extracts one or more rule definitions of the form:
 *
 *   ruleName := expression(...)
 *
 * Lines that are blank or consist only of whitespace are ignored.
 * Lines that cannot be parsed are skipped with a console warning.
 */
export function parseRules(source: string): RuleDefinition[] {
  const rules: RuleDefinition[] = [];

  // Split on rule boundaries: look for "identifier :=" patterns.
  // We join multi-line expressions by tracking paren depth.
  const lines = source.split(/\r?\n/u);

  let currentName: string | null = null;
  let currentExprParts: string[] = [];
  let depth = 0;

  const flushRule = () => {
    if (currentName !== null && currentExprParts.length > 0) {
      const exprCode = currentExprParts.join(' ').trim();
      try {
        rules.push({ name: currentName, expression: parseExpression(exprCode) });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[railroad] Failed to parse rule '${currentName}': ${String(err)}`);
      }
      currentName = null;
      currentExprParts = [];
      depth = 0;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    // Check whether this line starts a new rule definition
    const ruleMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:=\s*(.*)$/u.exec(line);
    if (ruleMatch && depth === 0) {
      flushRule();
      currentName = ruleMatch[1];
      const rest = ruleMatch[2].trim();
      if (rest) {
        currentExprParts.push(rest);
        depth += (rest.match(/\(/g) ?? []).length - (rest.match(/\)/g) ?? []).length;
      }
    } else if (currentName !== null) {
      currentExprParts.push(line);
      depth += (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length;
    }
  }

  flushRule();
  return rules;
}
