import { Lexer } from 'chevrotain';
import { usecaseTokens } from './usecase.tokens.js';

/** Singleton lexer; construction and validation happen once at module load. */
export const usecaseLexer = new Lexer(usecaseTokens);
