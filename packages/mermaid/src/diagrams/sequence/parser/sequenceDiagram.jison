/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2014-2015 Knut Sveidqvist
 *  MIT license.
 *
 *  Based on js sequence diagrams jison grammar
 *  https://bramp.github.io/js-sequence-diagrams/
 *  (c) 2012-2013 Andrew Brampton (bramp.net)
 *  Simplified BSD license.
 */
%lex

%options case-insensitive


// Special states for recognizing aliases
// A special state for grabbing text up to the first comment/newline
%x ID ALIAS LINE CONFIG CONFIG_DATA

%x acc_title
%x acc_descr
%x acc_descr_multiline
%%

[\n]+                                                           { console.log("NEWLINE"); return 'NEWLINE'; }
\s+                                                             { console.log("WHITESPACE"); /* skip whitespace */ }
<ID,ALIAS,LINE>((?!\n)\s)+                                      { console.log("SAME-LINE-WHITESPACE"); /* skip same-line whitespace */ }
<INITIAL,ID,ALIAS,LINE>\#[^\n]*                                 { console.log("COMMENT"); /* skip comments */ }
\%%(?!\{)[^\n]*                                                 { console.log("COMMENT"); /* skip comments */ }
[^\}]\%\%[^\n]*                                                 { console.log("COMMENT"); /* skip comments */ }
[0-9]+(?=[ \n]+)                                                { console.log("NUM:", yytext); return 'NUM'; }
<ID>[^\<->\->:\n,;@]+?([\-]*[^\<->\->:\n,;@]+?)*?(?=\@\{)       { console.log("LEXER:ACTOR_WITH_CONFIG_OBJECT:", yytext); yytext = yytext.trim(); return 'ACTOR_WITH_CONFIG'; }
// Enhanced config handling rules
<ID>\@\{                                                        { console.log("CONFIG_START"); this.begin('CONFIG'); return 'CONFIG_START'; }
<CONFIG>[^\}]+                                                  { console.log("CONFIG_CONTENT:", yytext); return 'CONFIG_CONTENT'; }
<CONFIG>\}                                                      { console.log("CONFIG_END"); this.popState(); return 'CONFIG_END'; }
"box"                                                           { console.log("BOX"); this.begin('LINE'); return 'box'; }
"participant"                                                   { console.log("PARTICIPANT"); this.begin('ID'); return 'participant'; }
"actor"                                                         { console.log("ACTOR_TYPE_ACTOR"); this.begin('ID'); return 'participant_actor'; }
"boundary"                                                      { return yy.matchAsActorOrParticipant('boundary', 'participant_boundary', this._input, this); }
"control"                                                       { return yy.matchAsActorOrParticipant('control', 'participant_control', this._input, this); }
"entity"                                                        { return yy.matchAsActorOrParticipant('entity', 'participant_entity', this._input, this); }
"database"                                                      { return yy.matchAsActorOrParticipant('database', 'participant_database', this._input, this); }
"collections"                                                   { return yy.matchAsActorOrParticipant('collections', 'participant_collections', this._input, this); }
"queue"                                                         { return yy.matchAsActorOrParticipant('queue', 'participant_queue', this._input, this); }
"create"                                                        { console.log("CREATE"); return 'create'; }
"destroy"                                                       { console.log("DESTROY"); this.begin('ID'); return 'destroy'; }
// Updated ID rules to handle @{...} config
// <ID>[^\<->\->:\n,;@]+?([\-]*[^\<->\->:\n,;@]+?)*?(?=\@\{)       { console.log("LEXER:ACTOR_WITH_CONFIG:", yytext); yytext = yytext.trim(); return 'ACTOR_WITH_CONFIG'; }
<ID>[^\<->\->:\n,;]+?([\-]*[^\<->\->:\n,;]+?)*?(?=((?!\n)\s)+"as"(?!\n)\s|[#\n;]|$) { console.log("ACTOR:", yytext); yytext = yytext.trim(); this.begin('ALIAS'); return 'ACTOR'; }
<ALIAS>"as"                                                     { console.log("AS"); this.popState(); this.popState(); this.begin('LINE'); return 'AS'; }
<ALIAS>(?:)                                                     { console.log("ALIAS_END"); this.popState(); this.popState(); return 'NEWLINE'; }
// // Enhanced config handling rules
// <ID>\@\{                                                        { console.log("CONFIG_START"); this.begin('CONFIG'); return 'CONFIG_START'; }
// <CONFIG>[^\}]+                                                  { console.log("CONFIG_CONTENT:", yytext); return 'CONFIG_CONTENT'; }
// <CONFIG>\}                                                      { console.log("CONFIG_END"); this.popState(); return 'CONFIG_END'; }
"loop"                                                          { console.log("LOOP"); this.begin('LINE'); return 'loop'; }
"rect"                                                          { console.log("RECT"); this.begin('LINE'); return 'rect'; }
"opt"                                                           { console.log("OPT"); this.begin('LINE'); return 'opt'; }
"alt"                                                           { console.log("ALT"); this.begin('LINE'); return 'alt'; }
"else"                                                          { console.log("ELSE"); this.begin('LINE'); return 'else'; }
"par"                                                           { console.log("PAR"); this.begin('LINE'); return 'par'; }
"par_over"                                                      { console.log("PAR_OVER"); this.begin('LINE'); return 'par_over'; }
"and"                                                           { console.log("AND"); this.begin('LINE'); return 'and'; }
"critical"                                                      { console.log("CRITICAL"); this.begin('LINE'); return 'critical'; }
"option"                                                        { console.log("OPTION"); this.begin('LINE'); return 'option'; }
"break"                                                         { console.log("BREAK"); this.begin('LINE'); return 'break'; }
<LINE>(?:[:]?(?:no)?wrap:)?[^#\n;]*                             { console.log("REST_OF_LINE:", yytext); this.popState(); return 'restOfLine'; }
"end"                                                           { console.log("END"); return 'end'; }
"left of"                                                       { console.log("LEFT_OF"); return 'left_of'; }
"right of"                                                      { console.log("RIGHT_OF"); return 'right_of'; }
"links"                                                         { console.log("LINKS"); return 'links'; }
"link"                                                          { console.log("LINK"); return 'link'; }
"properties"                                                    { console.log("PROPERTIES"); return 'properties'; }
"details"                                                       { console.log("DETAILS"); return 'details'; }
"over"                                                          { console.log("OVER"); return 'over'; }
"note"                                                          { console.log("NOTE"); return 'note'; }
"activate"                                                      { console.log("ACTIVATE"); this.begin('ID'); return 'activate'; }
"deactivate"                                                    { console.log("DEACTIVATE"); this.begin('ID'); return 'deactivate'; }
"title"\s[^#\n;]+                                               { console.log("TITLE"); return 'title'; }
"title:"\s[^#\n;]+                                              { console.log("LEGACY_TITLE"); return 'legacy_title'; }
accTitle\s*":"\s*                                               { console.log("ACC_TITLE"); this.begin("acc_title"); return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { console.log("ACC_TITLE_VALUE:", yytext); this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { console.log("ACC_DESCR"); this.begin("acc_descr"); return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { console.log("ACC_DESCR_VALUE:", yytext); this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                               { console.log("ACC_DESCR_MULTILINE_START"); this.begin("acc_descr_multiline"); }
<acc_descr_multiline>[\}]                                       { console.log("ACC_DESCR_MULTILINE_END"); this.popState(); }
<acc_descr_multiline>[^\}]*                                     { console.log("ACC_DESCR_MULTILINE_VALUE:", yytext); return "acc_descr_multiline_value"; }
"sequenceDiagram"                                               { console.log("SEQUENCE_DIAGRAM"); return 'SD'; }
"autonumber"                                                    { console.log("AUTONUMBER"); return 'autonumber'; }
"off"                                                           { console.log("OFF"); return 'off'; }
","                                                             { console.log("COMMA"); return ','; }
";"                                                             { console.log("SEMICOLON"); return 'NEWLINE'; }
[^\+\<->\->:\n,;]+((?!(\-x|\-\-x|\-\)|\-\-\)))[\-]*[^\+\<->\->:\n,;]+)* { console.log("ACTOR_GENERIC:", yytext); yytext = yytext.trim(); return 'ACTOR'; }
"->>"                                                           { console.log("SOLID_ARROW"); return 'SOLID_ARROW'; }
"<<->>"                                                         { console.log("BIDIRECTIONAL_SOLID_ARROW"); return 'BIDIRECTIONAL_SOLID_ARROW'; }
"-->>"                                                          { console.log("DOTTED_ARROW"); return 'DOTTED_ARROW'; }
"<<-->>"                                                        { console.log("BIDIRECTIONAL_DOTTED_ARROW"); return 'BIDIRECTIONAL_DOTTED_ARROW'; }
"->"                                                            { console.log("SOLID_OPEN_ARROW"); return 'SOLID_OPEN_ARROW'; }
"-->"                                                           { console.log("DOTTED_OPEN_ARROW"); return 'DOTTED_OPEN_ARROW'; }
\-[x]                                                           { console.log("SOLID_CROSS"); return 'SOLID_CROSS'; }
\-\-[x]                                                         { console.log("DOTTED_CROSS"); return 'DOTTED_CROSS'; }
\-[\)]                                                          { console.log("SOLID_POINT"); return 'SOLID_POINT'; }
\-\-[\)]                                                        { console.log("DOTTED_POINT"); return 'DOTTED_POINT'; }
":"(?:(?:no)?wrap:)?[^#\n;]*                                    { console.log("TEXT_WITH_WRAP:", yytext); return 'TXT'; }
":"                                                             { console.log("TEXT"); return 'TXT'; }
"+"                                                             { console.log("PLUS"); return '+'; }
"-"                                                             { console.log("MINUS"); return '-'; }
<<EOF>>                                                         { console.log("EOF"); return 'NEWLINE'; }
.                                                               { console.log("INVALID:", yytext); return 'INVALID'; }

/lex

%left '^'

%start start

%% /* language grammar */

start
	: SPACE start
	| NEWLINE start
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
	| 'activate' actor 'NEWLINE' {$$={type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $2.actor};}
	| 'deactivate' actor 'NEWLINE' {$$={type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $2.actor};}
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
    : 'participant' actor_with_config 'AS' restOfLine 'NEWLINE'
      {
        console.log('Participant with config and alias:', $2, $4);
        $2.draw = 'participant';
        $2.type = 'addParticipant';
        $2.description = yy.parseMessage($4);
        $$ = $2;
      }
    | 'participant' actor_with_config 'NEWLINE'
      {
        console.log('Participant with config without alias:', $2);
        $2.draw = 'participant';
        $2.type = 'addParticipant';
        $$ = $2;
      }
    | 'participant_actor' actor_with_config 'AS' restOfLine 'NEWLINE'
      {
        $2.draw = 'actor';
        $2.type = 'addParticipant';
        $2.description = yy.parseMessage($4);
        $$ = $2;
      }
    | 'participant_actor' actor_with_config 'NEWLINE'
      {
        $2.draw = 'actor';
        $2.type = 'addParticipant';
        $$ = $2;
      }
    | 'destroy' actor 'NEWLINE'
      {
        $2.type = 'destroyParticipant';
        $$ = $2;
      }
  | 'participant_boundary' actor 'AS' restOfLine 'NEWLINE' {$2.draw='boundary'; $2.type='addParticipant';$2.description=yy.parseMessage($4); $$=$2;}
	| 'participant_boundary' actor 'NEWLINE' {$2.draw='boundary'; $2.type='addParticipant'; $$=$2;}

	| 'participant_control' actor 'AS' restOfLine 'NEWLINE' {$2.draw='control'; $2.type='addParticipant';$2.description=yy.parseMessage($4); $$=$2;}
	| 'participant_control' actor 'NEWLINE' {$2.draw='control'; $2.type='addParticipant'; $$=$2;}

	| 'participant_entity' actor 'AS' restOfLine 'NEWLINE' {$2.draw='entity'; $2.type='addParticipant';$2.description=yy.parseMessage($4); $$=$2;}
	| 'participant_entity' actor 'NEWLINE' {$2.draw='entity'; $2.type='addParticipant'; $$=$2;}

	| 'participant_database' actor 'AS' restOfLine 'NEWLINE' {$2.draw='database'; $2.type='addParticipant';$2.description=yy.parseMessage($4); $$=$2;}
	| 'participant_database' actor 'NEWLINE' {$2.draw='database'; $2.type='addParticipant'; $$=$2;}

	| 'participant_collections' actor 'AS' restOfLine 'NEWLINE' {$2.draw='collections'; $2.type='addParticipant';$2.description=yy.parseMessage($4); $$=$2;}
	| 'participant_collections' actor 'NEWLINE' {$2.draw='collections'; $2.type='addParticipant'; $$=$2;}

	| 'participant_queue' actor 'AS' restOfLine 'NEWLINE' {$2.draw='queue'; $2.type='addParticipant';$2.description=yy.parseMessage($4); $$=$2;}
	| 'participant_queue' actor 'NEWLINE' {$2.draw='queue'; $2.type='addParticipant'; $$=$2;}

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
	{ $$ = [$1,$4,{type: 'addMessage', from:$1.actor, to:$4.actor, signalType:$2, msg:$5, activate: true},
	              {type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $4.actor}
	             ]}
	| actor signaltype '-' actor text2
	{ $$ = [$1,$4,{type: 'addMessage', from:$1.actor, to:$4.actor, signalType:$2, msg:$5},
	             {type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $1.actor}
	             ]}
	| actor signaltype actor text2
	{ $$ = [$1,$3,{type: 'addMessage', from:$1.actor, to:$3.actor, signalType:$2, msg:$4}]}
	;

actor_with_config
    : ACTOR_WITH_CONFIG config_object  // Changed from ACTOR
      {
        console.log("ACTOR_WITH_CONFIG Actor with config:", $1, $2);
        $$ = {
          type: 'addParticipant',
          actor: $1,
          config: $2
        };
      }
    | ACTOR config_object
      {
        console.log("Actor with config:", $1, $2);
        $$ = {
          type: 'addParticipant',
          actor: $1,
          config: $2
        };
      }
    | ACTOR
      {
        console.log("Actor without config:", $1);
        $$ = {
          type: 'addParticipant',
          actor: $1,
        };
      }
    ;

config_object
    : CONFIG_START CONFIG_CONTENT CONFIG_END
      {
        console.log("Parsing config content:", $2);
        try {
          // Remove any trailing whitespace/newlines
          const content = $2.trim();
          $$ = JSON.parse(content);
          console.log("Successfully parsed JSON config:", $$);
        } catch (e) {
          console.log("JSON parse failed, using raw content");
          $$ = $2.trim();
        }
      }
    ;
actor
  : ACTOR_WITH_CONFIG  // Add this case
      {
        console.log("Actor with config flag:", $1);
        $$ = { type: 'addParticipant', actor: $1 };
      }
	| actor config_object
      {
        console.log("Actor with config:", $1, $2);
        $$ = {
          type: 'addParticipant',
          actor: $1.actor,
          config: $2
        };
      }
    | ACTOR
      {
        console.log("Basic actor:", $1);
        $$ = { type: 'addParticipant', actor: $1 };
      }
    ;

signaltype
	: SOLID_OPEN_ARROW  { $$ = yy.LINETYPE.SOLID_OPEN; }
	| DOTTED_OPEN_ARROW { $$ = yy.LINETYPE.DOTTED_OPEN; }
	| SOLID_ARROW       { $$ = yy.LINETYPE.SOLID; }
  | BIDIRECTIONAL_SOLID_ARROW       { $$ = yy.LINETYPE.BIDIRECTIONAL_SOLID; }
	| DOTTED_ARROW      { $$ = yy.LINETYPE.DOTTED; }
	| BIDIRECTIONAL_DOTTED_ARROW      { $$ = yy.LINETYPE.BIDIRECTIONAL_DOTTED; }
	| SOLID_CROSS       { $$ = yy.LINETYPE.SOLID_CROSS; }
	| DOTTED_CROSS      { $$ = yy.LINETYPE.DOTTED_CROSS; }
	| SOLID_POINT { $$ = yy.LINETYPE.SOLID_POINT; }
	| DOTTED_POINT { $$ = yy.LINETYPE.DOTTED_POINT; }
	;

text2
  : TXT {$$ = yy.parseMessage($1.trim().substring(1)) }
  ;

%%
