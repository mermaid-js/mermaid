lexer grammar SequenceLexer;
tokens { AS }


// Comments (skip)
HASH_COMMENT: '#' ~[\r\n]* -> skip;
PERCENT_COMMENT1: '%%' ~[\r\n]* -> skip;
PERCENT_COMMENT2: ~[}] '%%' ~[\r\n]* -> skip;

// Whitespace and newline
NEWLINE: ('\r'? '\n')+;
WS: [ \t]+ -> skip;

// Punctuation and simple symbols
COMMA: ',';
SEMI: ';' -> type(NEWLINE);
PLUS: '+';
MINUS: '-';

// Core keywords
SD: 'sequenceDiagram';
PARTICIPANT: 'participant' -> pushMode(ID);
PARTICIPANT_ACTOR: 'actor' -> pushMode(ID);
CREATE: 'create';
DESTROY: 'destroy';
BOX: 'box' -> pushMode(LINE);

// Blocks and control flow
LOOP: 'loop' -> pushMode(LINE);
RECT: 'rect' -> pushMode(LINE);
OPT: 'opt' -> pushMode(LINE);
ALT: 'alt' -> pushMode(LINE);
ELSE: 'else' -> pushMode(LINE);
PAR: 'par' -> pushMode(LINE);
PAR_OVER: 'par_over' -> pushMode(LINE);
AND: 'and' -> pushMode(LINE);
CRITICAL: 'critical' -> pushMode(LINE);
OPTION: 'option' -> pushMode(LINE);
BREAK: 'break' -> pushMode(LINE);
END: 'end';

// Note and placement
LEFT_OF: 'left' WS+ 'of';
RIGHT_OF: 'right' WS+ 'of';
LINKS: 'links';
LINK: 'link';
PROPERTIES: 'properties';
DETAILS: 'details';
OVER: 'over';
// Accept both Note and note
NOTE: [Nn][Oo][Tt][Ee];

// Lifecycle
ACTIVATE: 'activate';
DEACTIVATE: 'deactivate';

// Titles and accessibility
LEGACY_TITLE: 'title' WS* ':' WS* (~[\r\n;#])*;
TITLE: 'title' -> pushMode(LINE);
ACC_TITLE: 'accTitle' WS* ':' WS* -> pushMode(ACC_TITLE_MODE);
ACC_DESCR: 'accDescr' WS* ':' WS* -> pushMode(ACC_DESCR_MODE);
ACC_DESCR_MULTI: 'accDescr' WS* '{' WS* -> pushMode(ACC_DESCR_MULTILINE_MODE);

// Directives
AUTONUMBER: 'autonumber';
OFF: 'off';

// Config block @{ ... }
CONFIG_START: '@{' -> pushMode(CONFIG_MODE);

// Arrows (must come before ACTOR)
SOLID_ARROW: '->>';
BIDIRECTIONAL_SOLID_ARROW: '<<->>';
DOTTED_ARROW: '-->>';
BIDIRECTIONAL_DOTTED_ARROW: '<<-->>';
SOLID_OPEN_ARROW: '->';
DOTTED_OPEN_ARROW: '-->';
SOLID_CROSS: '-x';
DOTTED_CROSS: '--x';
SOLID_POINT: '-)';
DOTTED_POINT: '--)';

// Text after colon up to newline or comment delimiter ; or #
TXT: ':' (~[\r\n;#])*;

// Actor identifiers: allow hyphen runs, but forbid -x, --x, -), --)
fragment IDCHAR_NO_HYPHEN: ~[+<>:\n,;@# \t-];
fragment ALNUM: [A-Za-z0-9_];
fragment ALNUM_NOT_X_RPAREN: [A-WYZa-wyz0-9_];
fragment H3: '-' '-' '-' ('-')*; // three or more hyphens
ACTOR: IDCHAR_NO_HYPHEN+
      (
        '-' ALNUM_NOT_X_RPAREN+
      | '-' '-' ALNUM_NOT_X_RPAREN+
      | H3 ALNUM+
      )*;


// Modes to mirror Jison stateful lexing
mode ACC_TITLE_MODE;
ACC_TITLE_VALUE: (~[\r\n;#])* -> popMode;

mode ACC_DESCR_MODE;
ACC_DESCR_VALUE: (~[\r\n;#])* -> popMode;

mode ACC_DESCR_MULTILINE_MODE;
ACC_DESCR_MULTILINE_END: '}' -> popMode;
ACC_DESCR_MULTILINE_VALUE: (~['}'])*;

mode CONFIG_MODE;
CONFIG_CONTENT: (~[}])+;
CONFIG_END: '}' -> popMode;


// ID mode: after participant/actor, allow same-line WS/comments; pop on newline
mode ID;
ID_NEWLINE: ('\r'? '\n')+ -> popMode, type(NEWLINE);
ID_SEMI: ';' -> popMode, type(NEWLINE);
ID_WS: [ \t]+ -> skip;
ID_HASH_COMMENT: '#' ~[\r\n]* -> skip;
ID_PERCENT_COMMENT: '%%' ~[\r\n]* -> skip;
// recognize 'as' in ID mode and switch to ALIAS
ID_AS: 'as' -> type(AS), pushMode(ALIAS);
// inline config in ID mode
ID_CONFIG_START: '@{' -> type(CONFIG_START), pushMode(CONFIG_MODE);
// arrows first to ensure proper splitting before actor
ID_BIDIR_SOLID_ARROW: '<<->>' -> type(BIDIRECTIONAL_SOLID_ARROW);
ID_BIDIR_DOTTED_ARROW: '<<-->>' -> type(BIDIRECTIONAL_DOTTED_ARROW);
ID_SOLID_ARROW: '->>' -> type(SOLID_ARROW);
ID_DOTTED_ARROW: '-->>' -> type(DOTTED_ARROW);
ID_SOLID_OPEN_ARROW: '->' -> type(SOLID_OPEN_ARROW);
ID_DOTTED_OPEN_ARROW: '-->' -> type(DOTTED_OPEN_ARROW);
ID_SOLID_CROSS: '-x' -> type(SOLID_CROSS);
ID_DOTTED_CROSS: '--x' -> type(DOTTED_CROSS);
ID_SOLID_POINT: '-)' -> type(SOLID_POINT);
ID_DOTTED_POINT: '--)' -> type(DOTTED_POINT);
ID_ACTOR: IDCHAR_NO_HYPHEN+
      (
        '-' ALNUM_NOT_X_RPAREN+
      | '--' ALNUM_NOT_X_RPAREN+
      | '-' '-' '-' '-'* ALNUM+
      )* -> type(ACTOR);

// ALIAS mode: after 'as', capture rest-of-line as TXT (alias display)
mode ALIAS;
ALIAS_NEWLINE: ('\r'? '\n')+ -> popMode, popMode, type(NEWLINE);
ALIAS_SEMI: ';' -> popMode, popMode, type(NEWLINE);
ALIAS_WS: [ \t]+ -> skip;
ALIAS_HASH_COMMENT: '#' ~[\r\n]* -> skip;
ALIAS_PERCENT_COMMENT: '%%' ~[\r\n]* -> skip;
// inline config allowed after alias as well
ALIAS_CONFIG_START: '@{' -> type(CONFIG_START), pushMode(CONFIG_MODE);
// Prefer capturing the remainder of the line as TXT for alias/description
ALIAS_TXT: (~[\r\n;#])+ -> type(TXT);
// arrows before actor pattern to split properly (kept for parity, though not used after AS)
ALIAS_BIDIR_SOLID_ARROW: '<<->>' -> type(BIDIRECTIONAL_SOLID_ARROW);
ALIAS_BIDIR_DOTTED_ARROW: '<<-->>' -> type(BIDIRECTIONAL_DOTTED_ARROW);
ALIAS_SOLID_ARROW: '->>' -> type(SOLID_ARROW);
ALIAS_DOTTED_ARROW: '-->>' -> type(DOTTED_ARROW);
ALIAS_SOLID_OPEN_ARROW: '->' -> type(SOLID_OPEN_ARROW);
ALIAS_DOTTED_OPEN_ARROW: '-->' -> type(DOTTED_OPEN_ARROW);
ALIAS_SOLID_CROSS: '-x' -> type(SOLID_CROSS);
ALIAS_DOTTED_CROSS: '--x' -> type(DOTTED_CROSS);
ALIAS_SOLID_POINT: '-)' -> type(SOLID_POINT);
ALIAS_DOTTED_POINT: '--)' -> type(DOTTED_POINT);
ALIAS_ACTOR: IDCHAR_NO_HYPHEN+
      (
        '-' ALNUM_NOT_X_RPAREN+
      | '--' ALNUM_NOT_X_RPAREN+
      | '-' '-' '-' '-'* ALNUM+
      )* -> type(ACTOR);

// LINE mode: after 'title' (no colon), pop at newline
mode LINE;
LINE_NEWLINE: ('\r'? '\n')+ -> popMode, type(NEWLINE);
LINE_SEMI: ';' -> popMode, type(NEWLINE);
LINE_WS: [ \t]+ -> skip;
LINE_HASH_COMMENT: '#' ~[\r\n]* -> skip;
LINE_PERCENT_COMMENT: '%%' ~[\r\n]* -> skip;
// Prefer capturing the remainder of the line as a single TXT token
LINE_TXT: (~[\r\n;#])+ -> type(TXT);
// allow arrows; placed after TXT so it won't split titles
LINE_BIDIR_SOLID_ARROW: '<<->>' -> type(BIDIRECTIONAL_SOLID_ARROW);
LINE_BIDIR_DOTTED_ARROW: '<<-->>' -> type(BIDIRECTIONAL_DOTTED_ARROW);
LINE_SOLID_ARROW: '->>' -> type(SOLID_ARROW);
LINE_DOTTED_ARROW: '-->>' -> type(DOTTED_ARROW);
LINE_SOLID_OPEN_ARROW: '->' -> type(SOLID_OPEN_ARROW);
LINE_DOTTED_OPEN_ARROW: '-->' -> type(DOTTED_OPEN_ARROW);
LINE_SOLID_CROSS: '-x' -> type(SOLID_CROSS);
LINE_DOTTED_CROSS: '--x' -> type(DOTTED_CROSS);
LINE_SOLID_POINT: '-)' -> type(SOLID_POINT);
LINE_DOTTED_POINT: '--)' -> type(DOTTED_POINT);
// Keep ACTOR for parity if TXT is not applicable
LINE_ACTOR: IDCHAR_NO_HYPHEN+
      (
        '-' ALNUM_NOT_X_RPAREN+
      | '--' ALNUM_NOT_X_RPAREN+
      | '-' '-' '-' '-'* ALNUM+
      )* -> type(ACTOR);

