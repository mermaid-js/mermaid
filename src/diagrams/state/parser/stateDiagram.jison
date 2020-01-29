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
%x STATE
%x FORK_STATE
%x STATE_STRING
%x STATE_ID
%x ALIAS
%x SCALE
%x NOTE
%x NOTE_ID
%x NOTE_TEXT
%x FLOATING_NOTE
%x FLOATING_NOTE_ID
%x struct

// A special state for grabbing text up to the first comment/newline
%x LINE

%%

[\n]+                            return 'NL';
\s+                              /* skip all whitespace */
<ID,STATE,struct,LINE>((?!\n)\s)+       /* skip same-line whitespace */
<INITIAL,ID,STATE,struct,LINE>\#[^\n]*  /* skip comments */
\%%[^\n]*                        /* skip comments */

"scale"\s+            { this.pushState('SCALE'); /* console.log('Got scale', yytext);*/ return 'scale'; }
<SCALE>\d+            return 'WIDTH';
<SCALE>\s+"width"     {this.popState();}

<INITIAL,struct>"state"\s+            { this.pushState('STATE'); }
<STATE>.*"<<fork>>"                   {this.popState();yytext=yytext.slice(0,-8).trim(); /*console.warn('Fork Fork: ',yytext);*/return 'FORK';}
<STATE>.*"<<join>>"                   {this.popState();yytext=yytext.slice(0,-8).trim();/*console.warn('Fork Join: ',yytext);*/return 'JOIN';}
<STATE>.*"[[fork]]"                   {this.popState();yytext=yytext.slice(0,-8).trim();/*console.warn('Fork Fork: ',yytext);*/return 'FORK';}
<STATE>.*"[[join]]"                   {this.popState();yytext=yytext.slice(0,-8).trim();/*console.warn('Fork Join: ',yytext);*/return 'JOIN';}
<STATE>["]                   this.begin("STATE_STRING");
<STATE>\s*"as"\s+         {this.popState();this.pushState('STATE_ID');return "AS";}
<STATE_ID>[^\n\{]*         {this.popState();/* console.log('STATE_ID', yytext);*/return "ID";}
<STATE_STRING>["]              this.popState();
<STATE_STRING>[^"]*         { /*console.log('Long description:', yytext);*/return "STATE_DESCR";}
<STATE>[^\n\s\{]+      {/*console.log('COMPOSIT_STATE', yytext);*/return 'COMPOSIT_STATE';}
<STATE>\n      {this.popState();}
<INITIAL,STATE>\{               {this.popState();this.pushState('struct'); /*console.log('begin struct', yytext);*/return 'STRUCT_START';}
<struct>\}           { /*console.log('Ending struct');*/ this.popState(); return 'STRUCT_STOP';}}
<struct>[\n]              /* nothing */

<INITIAL,struct>"note"\s+           { this.begin('NOTE'); return 'note'; }
<NOTE>"left of"                     { this.popState();this.pushState('NOTE_ID');return 'left_of';}
<NOTE>"right of"                    { this.popState();this.pushState('NOTE_ID');return 'right_of';}
<NOTE>\"                            { this.popState();this.pushState('FLOATING_NOTE');}
<FLOATING_NOTE>\s*"as"\s*       {this.popState();this.pushState('FLOATING_NOTE_ID');return "AS";}
<FLOATING_NOTE>["]         /**/
<FLOATING_NOTE>[^"]*         { /*console.log('Floating note text: ', yytext);*/return "NOTE_TEXT";}
<FLOATING_NOTE_ID>[^\n]*         {this.popState();/*console.log('Floating note ID', yytext);*/return "ID";}
<NOTE_ID>\s*[^:\n\s\-]+                { this.popState();this.pushState('NOTE_TEXT');/*console.log('Got ID for note', yytext);*/return 'ID';}
<NOTE_TEXT>\s*":"[^:\n;]+       { this.popState();/*console.log('Got NOTE_TEXT for note',yytext);*/yytext = yytext.substr(2).trim();return 'NOTE_TEXT';}
<NOTE_TEXT>\s*[^:;]+"end note"       { this.popState();/*console.log('Got NOTE_TEXT for note',yytext);*/yytext = yytext.slice(0,-8).trim();return 'NOTE_TEXT';}

"stateDiagram"\s+                   { /*console.log('Got state diagram', yytext,'#');*/return 'SD'; }
"hide empty description"    { /*console.log('HIDE_EMPTY', yytext,'#');*/return 'HIDE_EMPTY'; }
<INITIAL,struct>"[*]"                   { /*console.log('EDGE_STATE=',yytext);*/ return 'EDGE_STATE';}
<INITIAL,struct>[^:\n\s\-\{]+                { /*console.log('=>ID=',yytext);*/ return 'ID';}
// <INITIAL,struct>\s*":"[^\+\->:\n;]+      { yytext = yytext.trim(); /*console.log('Descr = ', yytext);*/ return 'DESCR'; }
<INITIAL,struct>\s*":"[^:\n;]+      { yytext = yytext.trim(); /*console.log('Descr = ', yytext);*/ return 'DESCR'; }
<INITIAL,struct>"-->"             return '-->';
<struct>"--"        return 'CONCURRENT';
<<EOF>>           return 'NL';
.                 return 'INVALID';

/lex

%left '^'

%start start

%% /* language grammar */

start
	: SPACE start
	| NL start
	| SD document { /*console.warn('Root document', $2);*/ yy.setRootDoc($2);return $2; }
	;

document
	: /* empty */ { $$ = [] }
	| document line {
        if($2!='nl'){
            $1.push($2);$$ = $1
        }
        // console.warn('Got document',$1, $2);
    }
	;

line
	: SPACE statement { $$ = $2 }
	| statement { $$ = $1 }
	| NL { $$='nl';}
	;

statement
	: idStatement { /*console.warn('got id and descr', $1);*/$$={ stmt: 'state', id: $1, type: 'default', description: ''};}
	| idStatement DESCR { /*console.warn('got id and descr', $1, $2.trim());*/$$={ stmt: 'state', id: $1, type: 'default', description: $2.trim()};}
	| idStatement '-->' idStatement
    {
        /*console.warn('got id', $1);yy.addRelation($1, $3);*/
        $$={ stmt: 'relation', state1: { stmt: 'state', id: $1, type: 'default', description: '' }, state2:{ stmt: 'state', id: $3 ,type: 'default', description: ''}};
    }
	| idStatement '-->' idStatement DESCR
    {
        /*yy.addRelation($1, $3, $4.substr(1).trim());*/
        $$={ stmt: 'relation', state1: { stmt: 'state', id: $1, type: 'default', description: '' }, state2:{ stmt: 'state', id: $3 ,type: 'default', description: ''}, description: $4.substr(1).trim()};
    }
    | HIDE_EMPTY
    | scale WIDTH
    | COMPOSIT_STATE
    | COMPOSIT_STATE STRUCT_START document STRUCT_STOP
    {

        /* console.warn('Adding document for state without id ', $1);*/
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
         //console.warn('Adding document for state with id ', $3, $4); yy.addDocument($3);
         $$={ stmt: 'state', id: $3, type: 'default', description: $1, doc: $5 }
    }
    | FORK {
        $$={ stmt: 'state', id: $1, type: 'fork' }
    }
    | JOIN {
        $$={ stmt: 'state', id: $1, type: 'join' }
    }
    | CONCURRENT {
        $$={ stmt: 'state', id: yy.getDividerId(), type: 'divider' }
    }
    | note notePosition ID NOTE_TEXT
    {
        /*console.warn('got NOTE, position: ', $2.trim(), 'id = ', $3.trim(), 'note: ', $4);*/
        $$={ stmt: 'state', id: $3.trim(), note:{position: $2.trim(), text: $4.trim()}};
    }
    | note NOTE_TEXT AS ID
    ;

idStatement
    : ID {$$=$1;}
    | EDGE_STATE {$$=$1;}
    ;

notePosition
    : left_of
    | right_of
    ;

%%
