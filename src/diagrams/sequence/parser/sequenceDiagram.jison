/** mermaid
 *  https://mermaidjs.github.io/
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

// Directive states
%x OPEN_DIRECTIVE
%x IN_DIRECTIVE

// A special state for grabbing text up to the first comment/newline
%x LINE

%%

\%\%\{                                                          { this.begin('OPEN_DIRECTIVE'); return 'open_directive'; }
<OPEN_DIRECTIVE>(?!\}\%\%)(?:\w+)\s*[:]?\s*(?:.*?)?(?=\}\%\%)   { this.popState(); return 'IN_DIRECTIVE'; }
\}\%\%                                                          { this.popState(); return 'close_directive'; }
"close_directive"                                               return 'NL';
"open_directive"                                                return 'NL';
[\n]+                                                           return 'NL';
\s+                                                             /* skip all whitespace */
<ID,ALIAS,LINE>((?!\n)\s)+                                      /* skip same-line whitespace */
<INITIAL,ID,ALIAS,LINE,IN_DIRECTIVE,OPEN_DIRECTIVE>\#[^\n]*     /* skip comments */
\%%(?!\{)[^\n]*                                                 /* skip comments */
[^\}]\%\%[^\n]*                                                 /* skip comments */
"participant"                                                   { this.begin('ID'); return 'participant'; }
<ID>[^\->:\n,;]+?(?=((?!\n)\s)+"as"(?!\n)\s|[#\n;]|$)           { yytext = yytext.trim(); this.begin('ALIAS'); return 'ACTOR'; }
<ALIAS>"as"                                                     { this.popState(); this.popState(); this.begin('LINE'); return 'AS'; }
<ALIAS>(?:)                                                     { this.popState(); this.popState(); return 'NL'; }
"loop"                                                          { this.begin('LINE'); return 'loop'; }
"rect"                                                          { this.begin('LINE'); return 'rect'; }
"opt"                                                           { this.begin('LINE'); return 'opt'; }
"alt"                                                           { this.begin('LINE'); return 'alt'; }
"else"                                                          { this.begin('LINE'); return 'else'; }
"par"                                                           { this.begin('LINE'); return 'par'; }
"and"                                                           { this.begin('LINE'); return 'and'; }
<LINE>(?:[:]?(?:no)?wrap:)?[^#\n;]*                             { this.popState(); return 'restOfLine'; }
"end"                                                           return 'end';
"left of"                                                       return 'left_of';
"right of"                                                      return 'right_of';
"over"                                                          return 'over';
"note"                                                          return 'note';
"activate"                                                      { this.begin('ID'); return 'activate'; }
"deactivate"                                                    { this.begin('ID'); return 'deactivate'; }
"title"                                                         return 'title';
"sequenceDiagram"                                               return 'SD';
"autonumber" 			                                              return 'autonumber';
","                                                             return ',';
";"                                                             return 'NL';
[^\+\->:\n,;]+                                                  { yytext = yytext.trim(); return 'ACTOR'; }
"->>"                                                           return 'SOLID_ARROW';
"-->>"                                                          return 'DOTTED_ARROW';
"->"                                                            return 'SOLID_OPEN_ARROW';
"-->"                                                           return 'DOTTED_OPEN_ARROW';
\-[x]                                                           return 'SOLID_CROSS';
\-\-[x]                                                         return 'DOTTED_CROSS';
":"(?:(?:no)?wrap:)?[^#\n;]+                                    return 'TXT';
"+"                                                             return '+';
"-"                                                             return '-';
<<EOF>>                                                         return 'NL';
.                                                               return 'INVALID';

/lex

%left '^'

%start start

%% /* language grammar */

start
	: SPACE start
	| NL start
	| directive start
	| SD document { yy.apply($2);return $2; }
	;

document
	: /* empty */ { $$ = [] }
	| document line {$1.push($2);$$ = $1}
	;

line
	: SPACE statement { $$ = $2 }
	| statement { $$ = $1 }
	| NL { $$=[]; }
	;

directive
  : open_directive textDirective close_directive { yy.handleDirective($2); }
  ;

statement
	: 'participant' actor 'AS' restOfLine 'NL' {$2.description=yy.parseMessage($4); $$=$2;}
	| 'participant' actor 'NL' {$$=$2;}
	| signal 'NL'
	| autonumber {yy.enableSequenceNumbers()}
	| directive 'NL'
	| 'activate' actor 'NL' {$$={type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $2};}
	| 'deactivate' actor 'NL' {$$={type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $2};}
	| note_statement 'NL'
	| title text2 'NL' {$$=[{type:'setTitle', text:$2}]}
	| 'loop' restOfLine document end
	{
		$3.unshift({type: 'loopStart', loopText:yy.parseMessage($2), signalType: yy.LINETYPE.LOOP_START});
		$3.push({type: 'loopEnd', loopText:$2, signalType: yy.LINETYPE.LOOP_END});
		$$=$3;}
	| 'rect' restOfLine document end
	{
		$3.unshift({type: 'rectStart', color:yy.parseMessage($2), signalType: yy.LINETYPE.RECT_START });
		$3.push({type: 'rectEnd', color:yy.parseMessage($2), signalType: yy.LINETYPE.RECT_END });
		$$=$3;}
	| opt restOfLine document end
	{
		$3.unshift({type: 'optStart', optText:yy.parseMessage($2), signalType: yy.LINETYPE.OPT_START});
		$3.push({type: 'optEnd', optText:yy.parseMessage($2), signalType: yy.LINETYPE.OPT_END});
		$$=$3;}
	| alt restOfLine else_sections end
	{
		// Alt start
		$3.unshift({type: 'altStart', altText:yy.parseMessage($2), signalType: yy.LINETYPE.ALT_START});
		// Content in alt is already in $3
		// End
		$3.push({type: 'altEnd', signalType: yy.LINETYPE.ALT_END});
		$$=$3;}
	| par restOfLine par_sections end
	{
		// Parallel start
		$3.unshift({type: 'parStart', parText:yy.parseMessage($2), signalType: yy.LINETYPE.PAR_START});
		// Content in par is already in $3
		// End
		$3.push({type: 'parEnd', signalType: yy.LINETYPE.PAR_END});
		$$=$3;}
	;

par_sections
	: document
	| document and restOfLine par_sections
	{ $$ = $1.concat([{type: 'and', parText:yy.parseMessage($3), signalType: yy.LINETYPE.PAR_AND}, $4]); }
	;

else_sections
	: document
	| document else restOfLine else_sections
	{ $$ = $1.concat([{type: 'else', altText:yy.parseMessage($3), signalType: yy.LINETYPE.ALT_ELSE}, $4]); }
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

text2
  : TXT {$$ = yy.parseMessage($1.trim().substring(1)) } ;

text3
  : TXT {$$ = JSON.parse($1.substring(1).trim().replace(/\\n/gm, "\n").replace(/'/gm, "\""));} ;

textDirective
  : IN_DIRECTIVE
  {
    $1 = $1.trim().replace(/'/gm, '"');
    if (/(\w+)[:]?\s*(\{.*}(?!%%))?/.test($1)) {
      $1 = $1.match(/(\w+)[:]?\s*(\{.*}(?!%%))?/);
      $$ = { type: $1[1], args: $1[2] !== undefined ? JSON.parse($1[2]) : null };
    } else {
      $$ = { type: $1, args: null };
    }
  }
  ;

%%
