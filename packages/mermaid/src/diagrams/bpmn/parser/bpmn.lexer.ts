import { Lexer } from 'chevrotain';
import { bpmnLexerModes } from './bpmn.tokens.js';

/** Singleton mode-aware lexer; construction and validation happen once at module load. */
export const bpmnLexer = new Lexer(bpmnLexerModes);
