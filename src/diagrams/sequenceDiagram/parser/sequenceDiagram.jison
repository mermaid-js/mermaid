/** mermaid
 *  http://knsv.github.io/mermaid/
 *  (c) 2014-2015 Knut Sveidqvist
 *  MIT license.
 *
 *  Based on js sequence diagrams jison grammr
 *  http://bramp.github.io/js-sequence-diagrams/
 *  (c) 2012-2013 Andrew Brampton (bramp.net)
 *  Simplified BSD license.
 */
%lex

%options case-insensitive

// Special states for recognizing aliases
%x ID
%x ALIAS

// A special state for grabbing text up to the first comment/newline
%x LINE

%%

[\n]+                            return 'NL';
\s+                              /* skip all whitespace */
<ID,ALIAS,LINE>((?!\n)\s)+       /* skip same-line whitespace */
<INITIAL,ID,ALIAS,LINE>\#[^\n]*  /* skip comments */
\%%[^\n]*                        /* skip comments */
"participant"     { this.begin('ID'); return 'participant'; }
<ID>[^\->:\n,;]+?(?=((?!\n)\s)+"as"(?!\n)\s|[#\n;]|$)  { this.begin('ALIAS'); return 'ACTOR'; }
<ALIAS>"as"       { this.popState(); this.popState(); this.begin('LINE'); return 'AS'; }
<ALIAS>(?:)       { this.popState(); this.popState(); return 'NL'; }
"loop"            { this.begin('LINE'); return 'loop'; }
"opt"             { this.begin('LINE'); return 'opt'; }
"alt"             { this.begin('LINE'); return 'alt'; }
"else"            { this.begin('LINE'); return 'else'; }
<LINE>[^#\n;]*    { this.popState(); return 'restOfLine'; }
"end"             return 'end';
"left of"         return 'left_of';
"right of"        return 'right_of';
"over"            return 'over';
"note"            return 'note';
"activate"        { this.begin('ID'); return 'activate'; }
"deactivate"      { this.begin('ID'); return 'deactivate'; }
"title"           return 'title';
"sequenceDiagram" return 'SD';
","               return ',';
";"               return 'NL';
[^\+\->:\n,;]+      { yytext = yytext.trim(); return 'ACTOR'; }
"->>"             return 'SOLID_ARROW';
"-->>"            return 'DOTTED_ARROW';
"->"              return 'SOLID_OPEN_ARROW';
"-->"             return 'DOTTED_OPEN_ARROW';
\-[x]             return 'SOLID_CROSS';
\-\-[x]           return 'DOTTED_CROSS';
":"[^#\n;]+       return 'TXT';
"+"               return '+';
"-"               return '-';
<<EOF>>           return 'NL';
.                 return 'INVALID';

/lex

%left '^'

%start start

%% /* language grammar */

start
	: SPACE start
	| NL start
	| SD document { yy.apply($2);return $2; }
	;

document
	: /* empty */ { $$ = [] }
	| document line {$1.push($2);$$ = $1}
	;

line
	: SPACE statement { $$ = $2 }
	| statement { $$ = $1 }
	| NL { $$=[];}
	;

statement
	: 'participant' actor 'AS' restOfLine 'NL' {$2.description=$4; $$=$2;}
	| 'participant' actor 'NL' {$$=$2;}
	| signal 'NL'
	| 'activate' actor 'NL' {$$={type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $2};}
	| 'deactivate' actor 'NL' {$$={type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $2};}
	| note_statement 'NL'
	| title text2 'NL' {$$=[{type:'setTitle', text:$2}]}
	| 'loop' restOfLine document end
	{
		$3.unshift({type: 'loopStart', loopText:$2, signalType: yy.LINETYPE.LOOP_START});
		$3.push({type: 'loopEnd', loopText:$2, signalType: yy.LINETYPE.LOOP_END});
		$$=$3;}
	| opt restOfLine document end
	{
		$3.unshift({type: 'optStart', optText:$2, signalType: yy.LINETYPE.OPT_START});
		$3.push({type: 'optEnd', optText:$2, signalType: yy.LINETYPE.OPT_END});
		$$=$3;}
	| alt restOfLine document else restOfLine document end
	{
		// Alt start
		$3.unshift({type: 'altStart', altText:$2, signalType: yy.LINETYPE.ALT_START});
		// Content in alt is already in $3
		// Else
		$3.push({type: 'else', altText:$5, signalType: yy.LINETYPE.ALT_ELSE});
		// Content in other alt
		$3 = $3.concat($6);
		// End
		$3.push({type: 'altEnd', signalType: yy.LINETYPE.ALT_END});

		$$=$3;}
	;

note_statement
	: 'note' placement actor text2
	{
		$$ = [$3, {type:'addNote', placement:$2, actor:$3.actor, text:$4}];}
	| 'note' 'over' actor_pair text2
	{
		// Coerce actor_pair into a [to, from, ...] array
		$2 = [].concat($3, $3).slice(0, 2);
		$2[0] = $2[0].actor;
		$2[1] = $2[1].actor;
		$$ = [$3, {type:'addNote', placement:yy.PLACEMENT.OVER, actor:$2.slice(0, 2), text:$4}];}
	;

spaceList
    : SPACE spaceList
    | SPACE
    ;
actor_pair
	: actor ',' actor   { $$ = [$1, $3]; }
	| actor             { $$ = $1; }
	;

placement
	: 'left_of'   { $$ = yy.PLACEMENT.LEFTOF; }
	| 'right_of'  { $$ = yy.PLACEMENT.RIGHTOF; }
	;

signal
	: actor signaltype '+' actor text2
	{ $$ = [$1,$4,{type: 'addMessage', from:$1.actor, to:$4.actor, signalType:$2, msg:$5},
	              {type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $4}
	             ]}
	| actor signaltype '-' actor text2
	{ $$ = [$1,$4,{type: 'addMessage', from:$1.actor, to:$4.actor, signalType:$2, msg:$5},
	             {type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $1}
	             ]}
	| actor signaltype actor text2
	{ $$ = [$1,$3,{type: 'addMessage', from:$1.actor, to:$3.actor, signalType:$2, msg:$4}]}
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
