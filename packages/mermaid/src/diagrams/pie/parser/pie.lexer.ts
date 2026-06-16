import { Lexer } from 'chevrotain';
import { pieTokens } from './pie.tokens.js';

/** Singleton lexer — constructed once at module load (Chevrotain init cost is paid here). */
export const pieLexer = new Lexer(pieTokens);
