/** js sequence diagrams
 *  http://bramp.github.io/js-sequence-diagrams/
 *  (c) 2012-2013 Andrew Brampton (bramp.net)
 *  Simplified BSD license.
 */
%lex

%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%%

[\n]+             return 'NL';
\s+               /* skip whitespace */
\#[^\n]*          /* skip comments */
\%%[^\n]*          /* skip comments */
"participant"     return 'participant';
"loop"     		  return 'loop';
"alt"     		  return 'loop';
"else"     		  return 'loop';
"end"     		  return 'end';
"left of"         return 'left_of';
"right of"        return 'right_of';
"over"            return 'over';
"note"            return 'note';
"title"           return 'title';
"sequenceDiagram" return 'SD';
","               return ',';
[^\->:\n,]+       return 'ACTOR';
"--"              return 'DOTLINE';
"-"               return 'LINE';
">>"              return 'OPENARROW';
">"               return 'ARROW';
:[^#\n]+          return 'MESSAGE';
"%%"		      return 'CMT';
<<EOF>>           return 'EOF';
.                 return 'INVALID';

/lex

%start start

%% /* language grammar */

start
	: SD document 'EOF' { return yy; }
	;

document
	: /* empty */
	| document line
	;

line
	: statement { }
	| 'NL'
	;

statement
	: 'participant' actor  { $$='actor'; }
	| signal               { $$='signal'; }
	| note_statement       { $$='note';  }
	| 'title' message      { yy.setTitle($2);  }
	| 'loop' ACTOR
	 { yy.addSignal(undefined, undefined, $2, yy.LINETYPE.LOOP_START);$$='loop';  }
	| 'end'
	 { yy.addSignal(undefined, undefined, undefined, yy.LINETYPE.LOOP_END);$$='loop';  }
	;

note_statement
	: 'note' placement actor message   { $$ = yy.addNote($3, $2, $4); }
	| 'note' 'over' actor_pair message { $$ = yy.addNote($3, yy.PLACEMENT.OVER, $4); }
	;

actor_pair
	: actor             { $$ = $1; }
	| actor ',' actor   { $$ = [$1, $3]; }
	;

placement
	: 'left_of'   { $$ = yy.PLACEMENT.LEFTOF; }
	| 'right_of'  { $$ = yy.PLACEMENT.RIGHTOF; }
	;

signal
	: actor signaltype actor message
	{ yy.addSignal($1, $3, $4, $2); }
	;

actor
	/*: ACTOR { $$ = yy.getActor($1); }*/
	: ACTOR { yy.addActor($1,$1,$1); }
	;

signaltype
	: linetype arrowtype  { $$ = $1 | ($2 << 2); }
	| linetype            { $$ = $1; }
	;

linetype
	: LINE      { $$ = yy.LINETYPE.SOLID; }
	| DOTLINE   { $$ = yy.LINETYPE.DOTTED; }
	;

arrowtype
	: ARROW     { $$ = yy.ARROWTYPE.FILLED; }
	| OPENARROW { $$ = yy.ARROWTYPE.OPEN; }
	;

message
	: MESSAGE { $$ = $1.substring(1).trim().replace(/\\n/gm, "\n"); }
	;

%%