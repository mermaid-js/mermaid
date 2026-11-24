import { Lexer } from 'chevrotain';
import { componentLexerModes } from './component.tokens.js';

export const componentLexer = new Lexer(componentLexerModes, {
  positionTracking: 'full',
});
