import { Lexer } from 'chevrotain';
import { usecaseLexerModes } from './usecase.tokens.js';

/** Singleton mode-aware lexer; construction and validation happen once at module load. */
export const usecaseLexer = new Lexer(usecaseLexerModes);
