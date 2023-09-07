/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2014-2021 Knut Sveidqvist
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
%x ID
%x STATE
%x FORK_STATE
%x STATE_STRING
%x STATE_ID
%x ALIAS
%x SCALE
%x acc_title
%x acc_descr
%x acc_descr_multiline
%x CLASSDEF
%x CLASSDEFID
%x CLASS
%x CLASS_STYLE
%x NOTE
%x NOTE_ID
%x NOTE_TEXT
%x FLOATING_NOTE
%x FLOATING_NOTE_ID
%x struct

// A special state for grabbing text up to the first comment/newline
%x LINE

%%

"default"             return 'DEFAULT';

.*direction\s+TB[^\n]*                                      return 'direction_tb';
.*direction\s+BT[^\n]*                                      return 'direction_bt';
.*direction\s+RL[^\n]*                                      return 'direction_rl';
.*direction\s+LR[^\n]*                                      return 'direction_lr';

\%\%(?!\{)[^\n]*                                                /* skip comments */
[^\}]\%\%[^\n]*                                                 /* skip comments */{ /*console.log('Crap after close');*/ }

[\n]+                            return 'NL';
[\s]+                              /* skip all whitespace */
<ID,STATE,struct,LINE>((?!\n)\s)+       /* skip same-line whitespace */
<INITIAL,ID,STATE,struct,LINE>\#[^\n]*  /* skip comments */
\%%[^\n]*                        /* skip comments */
"scale"\s+            { this.pushState('SCALE'); /* console.log('Got scale', yytext);*/ return 'scale'; }
<SCALE>\d+            return 'WIDTH';
<SCALE>\s+"width"     { this.popState(); }

accTitle\s*":"\s*                                               { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                { this.begin("acc_descr_multiline"); }
<acc_descr_multiline>[\}]                        { this.popState(); }
<acc_descr_multiline>[^\}]*                     return "acc_descr_multiline_value";

<INITIAL,struct>"classDef"\s+   { this.pushState('CLASSDEF'); return 'classDef'; }
<CLASSDEF>DEFAULT\s+            { this.popState(); this.pushState('CLASSDEFID'); return 'DEFAULT_CLASSDEF_ID' }
<CLASSDEF>\w+\s+                { this.popState(); this.pushState('CLASSDEFID'); return 'CLASSDEF_ID' }
<CLASSDEFID>[^\n]*              { this.popState(); return 'CLASSDEF_STYLEOPTS' }

<INITIAL,struct>"class"\s+      { this.pushState('CLASS'); return 'class'; }
<CLASS>(\w+)+((","\s*\w+)*)     { this.popState(); this.pushState('CLASS_STYLE'); return 'CLASSENTITY_IDS' }
<CLASS_STYLE>[^\n]*             { this.popState(); return 'STYLECLASS' }

"scale"\s+            { this.pushState('SCALE'); /* console.log('Got scale', yytext);*/ return 'scale'; }
<SCALE>\d+            return 'WIDTH';
<SCALE>\s+"width"     {this.popState();}

<INITIAL,struct>"state"\s+  { /* console.log('Starting STATE '); */ this.pushState('STATE'); }

<STATE>.*"<<fork>>"                   {this.popState();yytext=yytext.slice(0,-8).trim(); /*console.warn('Fork Fork: ',yytext);*/return 'FORK';}
<STATE>.*"<<join>>"                   {this.popState();yytext=yytext.slice(0,-8).trim();/*console.warn('Fork Join: ',yytext);*/return 'JOIN';}
<STATE>.*"<<choice>>"                 {this.popState();yytext=yytext.slice(0,-10).trim();/*console.warn('Fork Join: ',yytext);*/return 'CHOICE';}
<STATE>.*"[[fork]]"                   {this.popState();yytext=yytext.slice(0,-8).trim();/*console.warn('Fork Fork: ',yytext);*/return 'FORK';}
<STATE>.*"[[join]]"                   {this.popState();yytext=yytext.slice(0,-8).trim();/*console.warn('Fork Join: ',yytext);*/return 'JOIN';}
<STATE>.*"[[choice]]"                 {this.popState();yytext=yytext.slice(0,-10).trim();/*console.warn('Fork Join: ',yytext);*/return 'CHOICE';}

<struct>.*direction\s+TB[^\n]*            { return 'direction_tb';}
<struct>.*direction\s+BT[^\n]*            { return 'direction_bt';}
<struct>.*direction\s+RL[^\n]*            { return 'direction_rl';}
<struct>.*direction\s+LR[^\n]*            { return 'direction_lr';}

<STATE>["]                 { /* console.log('Starting STATE_STRING'); */ this.pushState("STATE_STRING"); }
<STATE>\s*"as"\s+          { this.pushState('STATE_ID'); /* console.log('pushState(STATE_ID)'); */ return "AS"; }
<STATE_ID>[^\n\{]*         { this.popState(); /* console.log('STATE_ID', yytext); */ return "ID"; }
<STATE_STRING>["]          { this.popState(); }
<STATE_STRING>[^"]*        { /* console.log('Long description:', yytext); */ return "STATE_DESCR"; }
<STATE>[^\n\s\{]+          { /* console.log('COMPOSIT_STATE', yytext); */ return 'COMPOSIT_STATE'; }
<STATE>\n                  { this.popState(); }
<INITIAL,STATE>\{          { this.popState(); this.pushState('struct'); /* console.log('begin struct', yytext); */ return 'STRUCT_START'; }
<struct>\%\%(?!\{)[^\n]*   /* skip comments inside state*/
<struct>\}                 { /*console.log('Ending struct');*/ this.popState(); return 'STRUCT_STOP';} }
<struct>[\n]               /* nothing */

<INITIAL,struct>"note"\s+           { this.begin('NOTE'); return 'note'; }
<NOTE>"left of"                     { this.popState(); this.pushState('NOTE_ID'); return 'left_of'; }
<NOTE>"right of"                    { this.popState(); this.pushState('NOTE_ID'); return 'right_of'; }
<NOTE>\"                            { this.popState(); this.pushState('FLOATING_NOTE'); }
<FLOATING_NOTE>\s*"as"\s*           { this.popState(); this.pushState('FLOATING_NOTE_ID'); return "AS"; }
<FLOATING_NOTE>["]                  /**/
<FLOATING_NOTE>[^"]*                { /* console.log('Floating note text: ', yytext); */ return "NOTE_TEXT"; }
<FLOATING_NOTE_ID>[^\n]*            { this.popState(); /* console.log('Floating note ID', yytext);*/ return "ID"; }
<NOTE_ID>\s*[^:\n\s\-]+             { this.popState(); this.pushState('NOTE_TEXT'); /*console.log('Got ID for note', yytext);*/ return 'ID'; }
<NOTE_TEXT>\s*":"[^:\n;]+           { this.popState(); /* console.log('Got NOTE_TEXT for note',yytext);*/yytext = yytext.substr(2).trim(); return 'NOTE_TEXT'; }
<NOTE_TEXT>[\s\S]*?"end note"       { this.popState(); /* console.log('Got NOTE_TEXT for note',yytext);*/yytext = yytext.slice(0,-8).trim(); return 'NOTE_TEXT'; }

"stateDiagram"\s+                   { /* console.log('Got state diagram', yytext,'#'); */ return 'SD'; }
"stateDiagram-v2"\s+                { /* console.log('Got state diagram', yytext,'#'); */ return 'SD'; }

"hide empty description"      { /* console.log('HIDE_EMPTY', yytext,'#'); */ return 'HIDE_EMPTY'; }

<INITIAL,struct>"[*]"                   { /* console.log('EDGE_STATE=',yytext); */ return 'EDGE_STATE'; }
<INITIAL,struct>[^:\n\s\-\{]+           { /* console.log('=>ID=',yytext); */ return 'ID'; }
// <INITIAL,struct>\s*":"[^\+\->:\n;]+  { yytext = yytext.trim(); /* console.log('Descr = ', yytext); */ return 'DESCR'; }
<INITIAL,struct>\s*":"[^:\n;]+          { yytext = yytext.trim(); /* console.log('Descr = ', yytext); */ return 'DESCR'; }

<INITIAL,struct>"-->"             return '-->';
<struct>"--"                      return 'CONCURRENT';
":::"                             return 'STYLE_SEPARATOR';
<<EOF>>                           return 'NL';
.                                 return 'INVALID';

/lex

%left '^'

%start start

%% /* language grammar */

/* $$ is the value of the symbol being evaluated (= what is to the left of the : in the rule */

start
	: SPACE start
	| NL start
	| SD document { /* console.log('--> Root document', $2); */   yy.setRootDoc($2); return $2; }
	;

document
	: /* empty */ { /*console.log('empty document'); */ $$ = [] }
	| document line {
        if($2 !='nl'){
            /* console.log(' document: 1: ', $1, ' pushing 2: ', $2); */
            $1.push($2); $$ = $1
        }
        /* console.log('Got document',$1, $2); */
    }
	;

line
	: SPACE statement { $$ = $2 }
	| statement { $$ = $1 }
	| NL { $$='nl';}
	;

statement
	: classDefStatement
    | cssClassStatement
	| idStatement { /* console.log('got id', $1); */
            $$=$1;
	    }
	| idStatement DESCR {
            const stateStmt = $1;
            stateStmt.description = yy.trimColon($2);
            $$ = stateStmt;
	    }
	| idStatement '-->' idStatement
        {
            /* console.info('got ids: 1: ', $1, ' 2:', $2,'  3: ', $3); */
            // console.log(' idStatement --> idStatement : state1 =', $1, ' state2 =', $3);
            $$={ stmt: 'relation', state1: $1, state2: $3};
        }
	| idStatement '-->' idStatement DESCR
        {
            const relDescription = yy.trimColon($4);
            /* console.log(' idStatement --> idStatement DESCR : state1 =', $1, ' state2stmt =', $3, '  description: ', relDescription); */
            $$={ stmt: 'relation', state1: $1, state2: $3, description: relDescription};
        }
    | HIDE_EMPTY
    | scale WIDTH
    | COMPOSIT_STATE
    | COMPOSIT_STATE STRUCT_START document STRUCT_STOP
    {
        // console.log('Adding document for state without id ', $1);
        $$={ stmt: 'state', id: $1, type: 'default', description: '', doc: $3 }
    }
    | STATE_DESCR AS ID {
        var id=$3;
        var description = $1.trim();
        if($3.match(':')){
            var parts = $3.split(':');
            id=parts[0];
            description = [description, parts[1]];
        }
        $$={stmt: 'state', id: id, type: 'default', description: description};

    }
    | STATE_DESCR AS ID STRUCT_START document STRUCT_STOP
    {
         // console.log('state with id ', $3,' document = ', $5, );
         $$={ stmt: 'state', id: $3, type: 'default', description: $1, doc: $5 }
    }
    | FORK {
        $$={ stmt: 'state', id: $1, type: 'fork' }
    }
    | JOIN {
        $$={ stmt: 'state', id: $1, type: 'join' }
    }
    | CHOICE {
        $$={ stmt: 'state', id: $1, type: 'choice' }
    }
    | CONCURRENT {
        $$={ stmt: 'state', id: yy.getDividerId(), type: 'divider' }
    }
    | note notePosition ID NOTE_TEXT
    {
        /* console.warn('got NOTE, position: ', $2.trim(), 'id = ', $3.trim(), 'note: ', $4);*/
        $$={ stmt: 'state', id: $3.trim(), note:{position: $2.trim(), text: $4.trim()}};
    }
    | note NOTE_TEXT AS ID
    | direction
    | acc_title acc_title_value  { $$=$2.trim();yy.setAccTitle($$); }
    | acc_descr acc_descr_value  { $$=$2.trim();yy.setAccDescription($$); }
    | acc_descr_multiline_value { $$=$1.trim();yy.setAccDescription($$); }    ;


classDefStatement
    : classDef CLASSDEF_ID CLASSDEF_STYLEOPTS {
        $$ = { stmt: 'classDef', id: $2.trim(), classes: $3.trim() };
        }
    | classDef DEFAULT CLASSDEF_STYLEOPTS {
        $$ = { stmt: 'classDef', id: $2.trim(), classes: $3.trim() };
        }
    ;

cssClassStatement
    : class CLASSENTITY_IDS STYLECLASS {
        //console.log('apply class: id(s): ',$2, '  style class: ', $3);
        $$={ stmt: 'applyClass', id: $2.trim(), styleClass: $3.trim() };
        }
    ;

direction
    : direction_tb
    { yy.setDirection('TB');$$={stmt:'dir', value:'TB'};}
    | direction_bt
    { yy.setDirection('BT');$$={stmt:'dir', value:'BT'};}
    | direction_rl
    { yy.setDirection('RL'); $$={stmt:'dir', value:'RL'};}
    | direction_lr
    { yy.setDirection('LR');$$={stmt:'dir', value:'LR'};}
    ;

eol
    : NL
    | ';'
    ;

idStatement
    : ID
        {   /* console.log('idStatement id: ', $1); */
            $$={ stmt: 'state', id: $1.trim(), type: 'default', description: '' };
        }
    | EDGE_STATE
        {   /* console.log('idStatement id: ', $1); */
            $$={ stmt: 'state', id: $1.trim(), type: 'default', description: '' };
        }
    | ID STYLE_SEPARATOR ID
        {   /*console.log('idStatement ID STYLE_SEPARATOR ID'); */
            $$={ stmt: 'state', id: $1.trim(), classes: [$3.trim()], type: 'default', description: '' };
        }
    | EDGE_STATE STYLE_SEPARATOR ID
        {   /*console.log('idStatement EDGE_STATE STYLE_SEPARATOR ID'); */
            $$={ stmt: 'state', id: $1.trim(), classes: [$3.trim()], type: 'default', description: '' };
        }
    ;

notePosition
    : left_of
    | right_of
    ;

%%
