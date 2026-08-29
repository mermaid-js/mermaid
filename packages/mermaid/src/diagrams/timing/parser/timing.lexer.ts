import { Lexer } from 'chevrotain';
import { timingTokens } from './timing.tokens.js';

/** Singleton lexer; construction and validation happen once at module load. */
export const timingLexer = new Lexer(timingTokens);
