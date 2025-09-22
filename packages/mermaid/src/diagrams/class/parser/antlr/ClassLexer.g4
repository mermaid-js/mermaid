lexer grammar ClassLexer;
import HeaderCommon;


tokens {
  ACC_TITLE_VALUE,
  ACC_DESCR_VALUE,
  ACC_DESCR_MULTILINE_VALUE,
  ACC_DESCR_MULTI_END,
  OPEN_IN_STRUCT,
  MEMBER
}

@members {
  private pendingClassBody = false;
  private pendingNamespaceBody = false;

  private clearPendingScopes(): void {
    this.pendingClassBody = false;
    this.pendingNamespaceBody = false;
  }
}

// Common fragments
fragment WS_INLINE: [ \t]+;
fragment DIGIT: [0-9];
fragment LETTER: [A-Za-z_];
fragment IDENT_PART: [A-Za-z0-9_\-];
fragment NOT_DQUOTE: ~[""];


// Comments and whitespace

NEWLINE: ('\r'? '\n')+ { this.clearPendingScopes(); };
WS: [ \t]+ -> skip;

// Diagram title declaration
CLASS_DIAGRAM_V2: 'classDiagram-v2' { this.headerMode = false; } -> type(CLASS_DIAGRAM);
CLASS_DIAGRAM: 'classDiagram' { this.headerMode = false; };

// Directions
DIRECTION_TB: 'direction' WS_INLINE+ 'TB';
DIRECTION_BT: 'direction' WS_INLINE+ 'BT';
DIRECTION_LR: 'direction' WS_INLINE+ 'LR';
DIRECTION_RL: 'direction' WS_INLINE+ 'RL';

// Accessibility tokens
ACC_TITLE: 'accTitle' WS_INLINE* ':' WS_INLINE* -> pushMode(ACC_TITLE_MODE);
ACC_DESCR: 'accDescr' WS_INLINE* ':' WS_INLINE* -> pushMode(ACC_DESCR_MODE);
ACC_DESCR_MULTI: 'accDescr' WS_INLINE* '{' -> pushMode(ACC_DESCR_MULTILINE_MODE);

// Statements captured as raw lines for semantic handling in listener
STYLE_LINE: 'style' WS_INLINE+ ~[\r\n]*;
CLASSDEF_LINE: 'classDef' ~[\r\n]*;
CSSCLASS_LINE: 'cssClass' ~[\r\n]*;
CALLBACK_LINE: 'callback' ~[\r\n]*;
CLICK_LINE: 'click' ~[\r\n]*;
LINK_LINE: 'link' ~[\r\n]*;
CALL_LINE: 'call' ~[\r\n]*;

// Notes
NOTE_FOR: 'note' WS_INLINE+ 'for';
NOTE: 'note';

// Keywords that affect block handling
CLASS: 'class' { this.pendingClassBody = true; };
NAMESPACE: 'namespace' { this.pendingNamespaceBody = true; };

// Structural tokens
STYLE_SEPARATOR: ':::';
ANNOTATION_START: '<<';
ANNOTATION_END: '>>';
LBRACKET: '[';
RBRACKET: ']';
COMMA: ',';
DOT: '.';
EDGE_STATE: '[*]';
GENERIC: '~' (~[~\r\n])+ '~';
// Match strings without escape semantics to mirror Jison behavior
// Allow any chars except an unescaped closing double-quote; permit newlines
STRING: '"' NOT_DQUOTE* '"';
BACKTICK_ID: '`' (~[`])* '`';
LABEL: ':' (~[':\r\n;])*;

RELATION_ARROW
  : (LEFT_HEAD)? LINE_BODY (RIGHT_HEAD)?
  ;
fragment LEFT_HEAD
  : '<|'
  | '<'
  | 'o'
  | '*'
  | '()'
  ;
fragment RIGHT_HEAD
  : '|>'
  | '>'
  | 'o'
  | '*'
  | '()'
  ;
fragment LINE_BODY
  : '--'
  | '..'
  ;

// Identifiers and numbers
IDENTIFIER
  : (LETTER | DIGIT) IDENT_PART*
  ;
NUMBER: DIGIT+;
PLUS: '+';
MINUS: '-';
HASH: '#';
PERCENT: '%';
STAR: '*';
SLASH: '/';
LPAREN: '(';
RPAREN: ')';

// Structural braces with mode management
STRUCT_START
  : '{'
    {
      if (this.pendingClassBody) {
        this.pendingClassBody = false;
        this.pushMode(ClassLexer.CLASS_BODY);
      } else {
        if (this.pendingNamespaceBody) {
          this.pendingNamespaceBody = false;
        }
        this.pushMode(ClassLexer.BLOCK);
      }
    }
  ;

STRUCT_END: '}' { /* default mode only */ };

// Default fallback (should not normally trigger)
UNKNOWN: .;

// ===== Mode: ACC_TITLE =====
mode ACC_TITLE_MODE;
ACC_TITLE_MODE_WS: [ \t]+ -> skip;
ACC_TITLE_VALUE: ~[\r\n;#]+ -> type(ACC_TITLE_VALUE), popMode;
ACC_TITLE_MODE_NEWLINE: ('\r'? '\n')+ { this.popMode(); this.clearPendingScopes(); } -> type(NEWLINE);

// ===== Mode: ACC_DESCR =====
mode ACC_DESCR_MODE;
ACC_DESCR_MODE_WS: [ \t]+ -> skip;
ACC_DESCR_VALUE: ~[\r\n;#]+ -> type(ACC_DESCR_VALUE), popMode;
ACC_DESCR_MODE_NEWLINE: ('\r'? '\n')+ { this.popMode(); this.clearPendingScopes(); } -> type(NEWLINE);

// ===== Mode: ACC_DESCR_MULTILINE =====
mode ACC_DESCR_MULTILINE_MODE;
ACC_DESCR_MULTILINE_VALUE: (~[}])+ -> type(ACC_DESCR_MULTILINE_VALUE);
ACC_DESCR_MULTI_END: '}' -> popMode, type(ACC_DESCR_MULTI_END);

// ===== Mode: CLASS_BODY =====
mode CLASS_BODY;
CLASS_BODY_WS: [ \t]+ -> skip;
CLASS_BODY_COMMENT: '%%' ~[\r\n]* -> skip;
CLASS_BODY_NEWLINE: ('\r'? '\n')+ -> type(NEWLINE);
CLASS_BODY_STRUCT_END: '}' -> popMode, type(STRUCT_END);
CLASS_BODY_OPEN_BRACE: '{' -> type(OPEN_IN_STRUCT);
CLASS_BODY_EDGE_STATE: '[*]' -> type(EDGE_STATE);
CLASS_BODY_MEMBER: ~[{}\r\n]+ -> type(MEMBER);

// ===== Mode: BLOCK =====
mode BLOCK;
BLOCK_WS: [ \t]+ -> skip;
BLOCK_COMMENT: '%%' ~[\r\n]* -> skip;
BLOCK_NEWLINE: ('\r'? '\n')+ -> type(NEWLINE);
BLOCK_CLASS: 'class' { this.pendingClassBody = true; } -> type(CLASS);
BLOCK_NAMESPACE: 'namespace' { this.pendingNamespaceBody = true; } -> type(NAMESPACE);
BLOCK_STYLE_LINE: 'style' WS_INLINE+ ~[\r\n]* -> type(STYLE_LINE);
BLOCK_CLASSDEF_LINE: 'classDef' ~[\r\n]* -> type(CLASSDEF_LINE);
BLOCK_CSSCLASS_LINE: 'cssClass' ~[\r\n]* -> type(CSSCLASS_LINE);
BLOCK_CALLBACK_LINE: 'callback' ~[\r\n]* -> type(CALLBACK_LINE);
BLOCK_CLICK_LINE: 'click' ~[\r\n]* -> type(CLICK_LINE);
BLOCK_LINK_LINE: 'link' ~[\r\n]* -> type(LINK_LINE);
BLOCK_CALL_LINE: 'call' ~[\r\n]* -> type(CALL_LINE);
BLOCK_NOTE_FOR: 'note' WS_INLINE+ 'for' -> type(NOTE_FOR);
BLOCK_NOTE: 'note' -> type(NOTE);
BLOCK_ACC_TITLE: 'accTitle' WS_INLINE* ':' WS_INLINE* -> type(ACC_TITLE), pushMode(ACC_TITLE_MODE);
BLOCK_ACC_DESCR: 'accDescr' WS_INLINE* ':' WS_INLINE* -> type(ACC_DESCR), pushMode(ACC_DESCR_MODE);
BLOCK_ACC_DESCR_MULTI: 'accDescr' WS_INLINE* '{' -> type(ACC_DESCR_MULTI), pushMode(ACC_DESCR_MULTILINE_MODE);
BLOCK_STRUCT_START
  : '{'
    {
      if (this.pendingClassBody) {
        this.pendingClassBody = false;
        this.pushMode(ClassLexer.CLASS_BODY);
      } else {
        if (this.pendingNamespaceBody) {
          this.pendingNamespaceBody = false;
        }
        this.pushMode(ClassLexer.BLOCK);
      }
    }
    -> type(STRUCT_START)
  ;
BLOCK_STRUCT_END: '}' -> popMode, type(STRUCT_END);
BLOCK_STYLE_SEPARATOR: ':::' -> type(STYLE_SEPARATOR);
BLOCK_ANNOTATION_START: '<<' -> type(ANNOTATION_START);
BLOCK_ANNOTATION_END: '>>' -> type(ANNOTATION_END);
BLOCK_LBRACKET: '[' -> type(LBRACKET);
BLOCK_RBRACKET: ']' -> type(RBRACKET);
BLOCK_COMMA: ',' -> type(COMMA);
BLOCK_DOT: '.' -> type(DOT);
BLOCK_EDGE_STATE: '[*]' -> type(EDGE_STATE);
BLOCK_GENERIC: '~' (~[~\r\n])+ '~' -> type(GENERIC);
// Mirror Jison: no escape semantics inside strings in BLOCK mode as well
BLOCK_STRING: '"' NOT_DQUOTE* '"' -> type(STRING);
BLOCK_BACKTICK_ID: '`' (~[`])* '`' -> type(BACKTICK_ID);
BLOCK_LABEL: ':' (~[':\r\n;])* -> type(LABEL);
BLOCK_RELATION_ARROW
  : (LEFT_HEAD)? LINE_BODY (RIGHT_HEAD)?
    -> type(RELATION_ARROW)
  ;
BLOCK_IDENTIFIER: (LETTER | DIGIT) IDENT_PART* -> type(IDENTIFIER);
BLOCK_NUMBER: DIGIT+ -> type(NUMBER);
BLOCK_PLUS: '+' -> type(PLUS);
BLOCK_MINUS: '-' -> type(MINUS);
BLOCK_HASH: '#' -> type(HASH);
BLOCK_PERCENT: '%' -> type(PERCENT);
BLOCK_STAR: '*' -> type(STAR);
BLOCK_SLASH: '/' -> type(SLASH);
BLOCK_LPAREN: '(' -> type(LPAREN);
BLOCK_RPAREN: ')' -> type(RPAREN);
BLOCK_UNKNOWN: . -> type(UNKNOWN);
