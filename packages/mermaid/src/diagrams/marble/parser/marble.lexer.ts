import { Lexer } from 'chevrotain';
import { marbleTokens } from './marble.tokens.js';

/** Singleton lexer; construction and validation happen once at module load. */
export const marbleLexer = new Lexer(marbleTokens);
