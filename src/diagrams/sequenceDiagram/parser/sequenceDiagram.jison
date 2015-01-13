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
[\-][x]			  { return 'SOLID_CROSS';}
[\-][\-][x]		  { return 'DOTTED_CROSS';}
[\-][>][>]		  	  { return 'SOLID_ARROW';}
[\-][\-][>][>]		  { return 'DOTTED_ARROW';}
\s+               /* skip whitespace */
\#[^\n]*          /* skip comments */
\%%[^\n]*          /* skip comments */
"participant"     return 'participant';
"opt"     		  return 'opt';
"loop"     		  return 'loop';
"alt"     		  return 'alt';
"else"     		  return 'else';
"end"     		  return 'end';
"left of"         return 'left_of';
"right of"        return 'right_of';
"over"            return 'over';
"note"            return 'note';
"title"           return 'title';
"sequenceDiagram" return 'SD';
","               return ',';
";"               return 'NL';
[^\->:\n,;]+       return 'ACTOR';
"->"		      return 'SOLID_OPEN_ARROW';
"-->"		 	  return 'DOTTED_OPEN_ARROW';
"->>"			  return 'SOLID_ARROW';
"-->>"            return 'DOTTED_ARROW';
":"[^#\n;]+        return 'TXT';
<<EOF>>           return 'EOF';
.                 return 'INVALID';

/lex

%left '^'

%start start

%% /* language grammar */

start
	: SD document 'EOF' { yy.apply($2);return $2; }
	;

document
	: /* empty */ { $$ = [] }
	| document line {$1.push($2);$$ = $1}
	;

line
	: SPACE statement { $$ = $2 }
	| statement { $$ = $1 }
	| NL { $$=[];}
	| EOF { $$=[];}
	;

statement
	: 'participant' actor 'NL' {$$=$2;}
	| signal 'NL'
	| note_statement 'NL'
	| 'title' SPACE text 'NL'
	| 'loop' actor document end
	{
		$3.unshift({type: 'loopStart', loopText:$2.actor, signalType: yy.LINETYPE.LOOP_START});
		$3.push({type: 'loopEnd', loopText:$2, signalType: yy.LINETYPE.LOOP_END});
		$$=$3;}
	| opt actor document end
	{
		$3.unshift({type: 'optStart', optText:$2.actor, signalType: yy.LINETYPE.OPT_START});
		$3.push({type: 'optEnd', optText:$2.actor, signalType: yy.LINETYPE.OPT_END});
		$$=$3;}
	| alt actor document else actor document end
	{
		// Alt start
		$3.unshift({type: 'altStart', altText:$2.actor, signalType: yy.LINETYPE.ALT_START});
		// Content in alt is already in $3
		// Else
		$3.push({type: 'else', altText:$5.actor, signalType: yy.LINETYPE.ALT_ELSE});
		// Content in other alt
		$3 = $3.concat($6);
		// End
		$3.push({type: 'altEnd', signalType: yy.LINETYPE.ALT_END});

		$$=$3;}
	;

note_statement
	: 'note' placement actor text2 {$$=[$3,{type:'addNote', placement:$2, actor:$3.actor, text:$4}];}
	| 'note' 'over' spaceList actor_pair actor
	;

spaceList
    : SPACE spaceList
    | SPACE
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
	: actor signaltype actor text2
	{$$ = [$1,$3,{type: 'addMessage', from:$1.actor, to:$3.actor, signalType:$2, msg:$4}]}
	;

actors: actors actor
	  | actor
	  ;
actor
	: ACTOR {$$={type: 'addActor', actor:$1}}
	;

signaltype
	: SOLID_OPEN_ARROW  { $$ = yy.LINETYPE.SOLID_OPEN; }
	| DOTTED_OPEN_ARROW { $$ = yy.LINETYPE.DOTTED_OPEN; }
	| SOLID_ARROW       { $$ = yy.LINETYPE.SOLID; }
	| DOTTED_ARROW      { $$ = yy.LINETYPE.DOTTED; }
	| SOLID_CROSS       { $$ = yy.LINETYPE.SOLID_CROSS; }
	| DOTTED_CROSS      { $$ = yy.LINETYPE.DOTTED_CROSS; }
	;

text2: TXT {$$ = $1.substring(1).trim().replace(/\\n/gm, "\n");} ;

%%