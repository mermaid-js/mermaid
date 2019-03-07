/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex

%options case-insensitive

/* string is used to detect blocks that are surrounded by double quotes. */
/* copied from /src/diagrams/flowchart/parser/flow.jison */
%x string
/* a valid callback looks like this: callback(example_callback_arg) */
/* callback prefix: callback( */
/* callback suffix: ) */
%x callback
%x callbackname
%%

[\n]+                   return 'NL';
\s+                     /* skip whitespace */
\#[^\n]*                /* skip comments */
\%%[^\n]*               /* skip comments */
/* Strings are used to detect tooltips */
["]                     this.begin("string");
<string>["]             this.popState();
<string>[^"]*           return 'STR';
"call"\s                   this.begin("callbackname");
<callbackname>\(        this.popState(); this.begin("callback");
<callbackname>[^(]+     return 'callbackname';
<callback>[)]            this.popState();
<callback>[^)]*         return 'callbackarguments';

"click"                 return 'click';
"gantt"                 return 'gantt';
"dateFormat"\s[^#\n;]+  return 'dateFormat';
"axisFormat"\s[^#\n;]+  return 'axisFormat';
\d\d\d\d"-"\d\d"-"\d\d  return 'date';
"title"\s[^#\n;]+       return 'title';
"section"\s[^#:\n;]+    return 'section';
[^#:()\n;]+               return 'taskTxt';
":"[^#\n;]+             return 'taskData';
":"                     return ':';
<<EOF>>                 return 'EOF';
.                       return 'INVALID';

/lex

%left '^'

%start start

%% /* language grammar */

start
	: gantt document 'EOF' { return $2; }
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
  : 'dateFormat' {yy.setDateFormat($1.substr(11));$$=$1.substr(11);}
  | 'axisFormat' {yy.setAxisFormat($1.substr(11));$$=$1.substr(11);}
  | title {yy.setTitle($1.substr(6));$$=$1.substr(6);}
  | section {yy.addSection($1.substr(8));$$=$1.substr(8);}
  | clickStatement
  | taskTxt taskData {yy.addTask($1,$2);$$='task';}
  ;

clickStatement
    : click callbackname callbackarguments     {$$ = $1;yy.setClickEvent($2, $3);}
    | click STR callbackname callbackarguments {$$ = $1;yy.setLink($2);yy.setClickEvent($3, $4);}
    | click STR                                {$$ = $1;yy.setLink($2);}
    ;
%%
