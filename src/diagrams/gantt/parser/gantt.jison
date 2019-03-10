/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex

%options case-insensitive

/* string is used to detect blocks that are surrounded by double quotes. */
/* copied from /src/diagrams/flowchart/parser/flow.jison */
%x click
%x href
%x callbackname
%x callbackargs
%%

[\n]+                   return 'NL';
\s+                     /* skip whitespace */
\#[^\n]*                /* skip comments */
\%%[^\n]*               /* skip comments */

"href"[\s]+["]          this.begin("href"); /* return the next double quoted word after 'href' */
<href>["]               this.popState();    /* e.g. return https://example.com for 'href "https://example.com"' */
<href>[^"]*             return 'href';

"call"[\s]+             this.begin("callbackname");
<callbackname>\(        this.popState(); this.begin("callbackargs");
<callbackname>[^(]*     return 'callbackname';
<callbackargs>\)        this.popState();
<callbackargs>[^)]*     return 'callbackargs';

"click"[\s]+            this.begin("click");
<click>[\s\n]           this.popState();
<click>[^\s\n]*         return 'click';

"gantt"                 return 'gantt';
"dateFormat"\s[^#\n;]+  return 'dateFormat';
"axisFormat"\s[^#\n;]+  return 'axisFormat';
\d\d\d\d"-"\d\d"-"\d\d  return 'date';
"title"\s[^#\n;]+       return 'title';
"section"\s[^#:\n;]+    return 'section';
[^#:()\n;]+             return 'taskTxt';
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
    : click callbackname callbackargs       {$$ = $1;yy.setClickEvent($1, $2, $3);}
    | click callbackname callbackargs href  {$$ = $1;yy.setClickEvent($1, $2, $3);yy.setLink($1,$4);}
    | click href callbackname callbackargs  {$$ = $1;yy.setClickEvent($1, $3, $4);yy.setLink($1,$2);}
    | click href                            {$$ = $1;yy.setLink($1, $2);}
    ;

clickStatementDebug
    : click callbackname callbackargs  {$$=$1+' ' + $2 + ' ' + $3;}
    | click callbackname callbackargs href {$$=$1+' ' + $2 + ' ' + $3 + ' ' + $4;}
    | click href callbackname callbackargs {$$=$1+' ' + $2 + ' ' + $3 + ' ' + $4;}
    | click href  {$$=$1+' ' + $2;}
    ;
%%
