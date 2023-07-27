/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2014-2015 Knut Sveidqvist
 *  MIT license.
 *
 *  Based on js sequence diagrams jison grammr
 *  https://bramp.github.io/js-sequence-diagrams/
 *  (c) 2012-2013 Andrew Brampton (bramp.net)
 *  Simplified BSD license.
 */
%lex

%options case-insensitive

// Special states for recognizing aliases
// A special state for grabbing text up to the first comment/newline
%x ID ALIAS LINE GROUP

// Directive states
%x open_directive type_directive arg_directive
%x acc_title
%x acc_descr
%x acc_descr_multiline
%%

\%\%\{                                                          { this.begin('open_directive'); return 'open_directive'; }
<open_directive>((?:(?!\}\%\%)[^:.])*)                          { this.begin('type_directive'); return 'type_directive'; }
<type_directive>":"                                             { this.popState(); this.begin('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%                            { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)                            return 'arg_directive';
[\n]+                                                           return 'NEWLINE';
\s+                                                             /* skip all whitespace */
<ID,ALIAS,LINE>((?!\n)\s)+                                      /* skip same-line whitespace */
<INITIAL,ID,ALIAS,LINE,arg_directive,type_directive,open_directive>\#[^\n]*   /* skip comments */
\%%(?!\{)[^\n]*                                                 /* skip comments */
[^\}]\%\%[^\n]*                                                 /* skip comments */
[0-9]+(?=[ \n]+)       											return 'NUM';
"box"															{ this.begin('LINE'); return 'box'; }
"participant"                                                   { this.begin('ID'); return 'participant'; }
"actor"                                                   		{ this.begin('ID'); return 'participant_actor'; }
"create"                                                        return 'create';
"destroy"                                                       { this.begin('ID'); return 'destroy'; }
<ID>[^\->:\n,;]+?([\-]*[^\->:\n,;]+?)*?(?=((?!\n)\s)+"as"(?!\n)\s|[#\n;]|$)     { yytext = yytext.trim(); this.begin('ALIAS'); return 'ACTOR'; }
<ALIAS>"as"                                                     { this.popState(); this.popState(); this.begin('LINE'); return 'AS'; }
<ALIAS>(?:)                                                     { this.popState(); this.popState(); return 'NEWLINE'; }
"loop"                                                          { this.begin('LINE'); return 'loop'; }
"rect"                                                          { this.begin('LINE'); return 'rect'; }
"opt"                                                           { this.begin('LINE'); return 'opt'; }
"alt"                                                           { this.begin('LINE'); return 'alt'; }
"else"                                                          { this.begin('LINE'); return 'else'; }
"par"                                                           { this.begin('LINE'); return 'par'; }
"par_over" 														{ this.begin('LINE'); return 'par_over'; }
"and"                                                           { this.begin('LINE'); return 'and'; }
"critical"                                                      { this.begin('LINE'); return 'critical'; }
"option"                                                        { this.begin('LINE'); return 'option'; }
"break"                                                         { this.begin('LINE'); return 'break'; }
"group"                                                         { this.begin('GROUP'); return 'group'; }
<GROUP>\s*(?:[:])\s*[^\->:\n,;]+?([\-]*[^\->:\n,;]+?)*?(?=((?!\n)\s)+) { yytext = yytext.trim().substring(1); this.popState(); this.begin('LINE'); return 'label'; }
<LINE>(?:[:]?(?:no)?wrap:)?[^#\n;]*                             { this.popState(); return 'restOfLine'; }
"end"                                                           return 'end';
"left of"                                                       return 'left_of';
"right of"                                                      return 'right_of';
"links"                                                         return 'links';
"link"                                                          return 'link';
"properties"                                                    return 'properties';
"details"                                                       return 'details';
"over"                                                          return 'over';
"note"                                                          return 'note';
"activate"                                                      { this.begin('ID'); return 'activate'; }
"deactivate"                                                    { this.begin('ID'); return 'deactivate'; }
"title"\s[^#\n;]+                                               return 'title';
"title:"\s[^#\n;]+                                              return 'legacy_title';
accTitle\s*":"\s*                                               { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                       { this.popState(); }
<acc_descr_multiline>[^\}]*                     return "acc_descr_multiline_value";
"sequenceDiagram"                                               return 'SD';
"autonumber"                                                    return 'autonumber';
"off"															return 'off';
","                                                             return ',';
";"                                                             return 'NEWLINE';
[^\+\->:\n,;]+((?!(\-x|\-\-x|\-\)|\-\-\)))[\-]*[^\+\->:\n,;]+)*             { yytext = yytext.trim(); return 'ACTOR'; }
"->>"                                                           return 'SOLID_ARROW';
"-->>"                                                          return 'DOTTED_ARROW';
"->"                                                            return 'SOLID_OPEN_ARROW';
"-->"                                                           return 'DOTTED_OPEN_ARROW';
\-[x]                                                           return 'SOLID_CROSS';
\-\-[x]                                                         return 'DOTTED_CROSS';
\-[\)]                                                          return 'SOLID_POINT';
\-\-[\)]                                                        return 'DOTTED_POINT';
":"(?:(?:no)?wrap:)?[^#\n;]+                                    return 'TXT';
"+"                                                             return '+';
"-"                                                             return '-';
<<EOF>>                                                         return 'NEWLINE';
.                                                               return 'INVALID';

/lex

%left '^'

%start start

%% /* language grammar */

start
	: SPACE start
	| NEWLINE start
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
	| NEWLINE { $$=[]; }
	;

box_section
	: /* empty */ { $$ = [] }
	| box_section box_line {$1.push($2);$$ = $1}
	;

box_line
	: SPACE participant_statement { $$ = $2 }
	| participant_statement { $$ = $1 }
	| NEWLINE { $$=[]; }
	;


directive
  : openDirective typeDirective closeDirective 'NEWLINE'
  | openDirective typeDirective ':' argDirective closeDirective 'NEWLINE'
  ;

statement
	: participant_statement
	| 'create' participant_statement {$2.type='createParticipant'; $$=$2;}
	| 'box' restOfLine box_section end
	{
		$3.unshift({type: 'boxStart', boxData:yy.parseBoxData($2) });
		$3.push({type: 'boxEnd', boxText:$2});
		$$=$3;}
	| signal 'NEWLINE'
	| autonumber NUM NUM 'NEWLINE' { $$= {type:'sequenceIndex',sequenceIndex: Number($2), sequenceIndexStep:Number($3), sequenceVisible:true, signalType:yy.LINETYPE.AUTONUMBER};}
	| autonumber NUM 'NEWLINE' { $$ = {type:'sequenceIndex',sequenceIndex: Number($2), sequenceIndexStep:1, sequenceVisible:true, signalType:yy.LINETYPE.AUTONUMBER};}
	| autonumber off 'NEWLINE' { $$ = {type:'sequenceIndex', sequenceVisible:false, signalType:yy.LINETYPE.AUTONUMBER};}
	| autonumber 'NEWLINE'  {$$ = {type:'sequenceIndex', sequenceVisible:true, signalType:yy.LINETYPE.AUTONUMBER}; }
	| 'activate' actor 'NEWLINE' {$$={type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $2};}
	| 'deactivate' actor 'NEWLINE' {$$={type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $2};}
	| note_statement 'NEWLINE'
	| links_statement 'NEWLINE'
	| link_statement 'NEWLINE'
	| properties_statement 'NEWLINE'
	| details_statement 'NEWLINE'
	| title {yy.setDiagramTitle($1.substring(6));$$=$1.substring(6);}
	| legacy_title {yy.setDiagramTitle($1.substring(7));$$=$1.substring(7);}
  | acc_title acc_title_value  { $$=$2.trim();yy.setAccTitle($$); }
  | acc_descr acc_descr_value  { $$=$2.trim();yy.setAccDescription($$); }
  | acc_descr_multiline_value { $$=$1.trim();yy.setAccDescription($$); }
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
	| par_over restOfLine par_sections end
	{
		// Parallel (overlapped) start
		$3.unshift({type: 'parStart', parText:yy.parseMessage($2), signalType: yy.LINETYPE.PAR_OVER_START});
		// Content in par is already in $3
		// End
		$3.push({type: 'parEnd', signalType: yy.LINETYPE.PAR_END});
		$$=$3;}
	| critical restOfLine option_sections end
	{
		// critical start
		$3.unshift({type: 'criticalStart', criticalText:yy.parseMessage($2), signalType: yy.LINETYPE.CRITICAL_START});
		// Content in critical is already in $3
		// critical end
		$3.push({type: 'criticalEnd', signalType: yy.LINETYPE.CRITICAL_END});
		$$=$3;}
	| break restOfLine document end
	{
		$3.unshift({type: 'breakStart', breakText:yy.parseMessage($2), signalType: yy.LINETYPE.BREAK_START});
		$3.push({type: 'breakEnd', optText:yy.parseMessage($2), signalType: yy.LINETYPE.BREAK_END});
		$$=$3;}
	| group label restOfLine document end
	{
		$4.unshift({type: 'groupStart', groupText:yy.parseMessage($3), signalType: yy.LINETYPE.GROUP_START});
		$4.push({type: 'groupEnd', groupLabel:yy.parseMessage($2), signalType: yy.LINETYPE.GROUP_END});
		$$=$4;}
  | directive
	;

option_sections
	: document
	| document option restOfLine option_sections
	{ $$ = $1.concat([{type: 'option', optionText:yy.parseMessage($3), signalType: yy.LINETYPE.CRITICAL_OPTION}, $4]); }
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

participant_statement
	: 'participant' actor 'AS' restOfLine 'NEWLINE' {$2.draw='participant'; $2.type='addParticipant';$2.description=yy.parseMessage($4); $$=$2;}
	| 'participant' actor 'NEWLINE' {$2.draw='participant'; $2.type='addParticipant';$$=$2;}
	| 'participant_actor' actor 'AS' restOfLine 'NEWLINE' {$2.draw='actor'; $2.type='addParticipant';$2.description=yy.parseMessage($4); $$=$2;}
	| 'participant_actor' actor 'NEWLINE' {$2.draw='actor'; $2.type='addParticipant'; $$=$2;}
	| 'destroy' actor 'NEWLINE' {$2.type='destroyParticipant'; $$=$2;}
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

links_statement
	: 'links' actor text2
	{
		$$ = [$2, {type:'addLinks', actor:$2.actor, text:$3}];
  }
	;

link_statement
	: 'link' actor text2
	{
		$$ = [$2, {type:'addALink', actor:$2.actor, text:$3}];
  }
	;

properties_statement
	: 'properties' actor text2
	{
		$$ = [$2, {type:'addProperties', actor:$2.actor, text:$3}];
  }
	;

details_statement
	: 'details' actor text2
	{
		$$ = [$2, {type:'addDetails', actor:$2.actor, text:$3}];
  }
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

// actor
// 	: actor_participant
// 	| actor_actor
// 	;

actor: ACTOR {$$={ type: 'addParticipant', actor:$1}};
// actor_actor: ACTOR {$$={type: 'addActor', actor:$1}};

signaltype
	: SOLID_OPEN_ARROW  { $$ = yy.LINETYPE.SOLID_OPEN; }
	| DOTTED_OPEN_ARROW { $$ = yy.LINETYPE.DOTTED_OPEN; }
	| SOLID_ARROW       { $$ = yy.LINETYPE.SOLID; }
	| DOTTED_ARROW      { $$ = yy.LINETYPE.DOTTED; }
	| SOLID_CROSS       { $$ = yy.LINETYPE.SOLID_CROSS; }
	| DOTTED_CROSS      { $$ = yy.LINETYPE.DOTTED_CROSS; }
	| SOLID_POINT { $$ = yy.LINETYPE.SOLID_POINT; }
	| DOTTED_POINT { $$ = yy.LINETYPE.DOTTED_POINT; }
	;

text2
  : TXT {$$ = yy.parseMessage($1.trim().substring(1)) }
  ;

openDirective
  : open_directive { yy.parseDirective('%%{', 'open_directive'); }
  ;

typeDirective
  : type_directive { yy.parseDirective($1, 'type_directive'); }
  ;

argDirective
  : arg_directive { $1 = $1.trim().replace(/'/g, '"'); yy.parseDirective($1, 'arg_directive'); }
  ;

closeDirective
  : close_directive { yy.parseDirective('}%%', 'close_directive', 'sequence'); }
  ;

%%
