/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex

%options case-insensitive

%x click
%x href
%x callbackname
%x callbackargs
%%

[\n]+                   return 'NL';
\s+                     /* skip whitespace */
\#[^\n]*                /* skip comments */
\%%[^\n]*               /* skip comments */

/*
---interactivity command---
'href' adds a link to the specified task. 'href' can only be specified when the
line was introduced with 'click'.
'href "<link>"' attaches the specified link to the task that was specified by 'click'.
*/
"href"[\s]+["]          this.begin("href");
<href>["]               this.popState();
<href>[^"]*             return 'href';

/*
---interactivity command---
'call' adds a callback to the specified task. 'call' can only be specified when
the line was introdcued with 'click'.
'call <callbackname>(<args>)' attaches the function 'callbackname' with the specified
arguments to the task that was specified by 'click'.
Function arguments are optional: 'call <callbackname>()' simply executes 'callbackname' without any arguments.
*/
"call"[\s]+             this.begin("callbackname");
<callbackname>\([\s]*\) this.popState();
<callbackname>\(        this.popState(); this.begin("callbackargs");
<callbackname>[^(]*     return 'callbackname';
<callbackargs>\)        this.popState();
<callbackargs>[^)]*     return 'callbackargs';

/*
'click' is the keyword to introduce a line that contains interactivity commands.
'click' must be followed by an existing task-id. All commands are attached to
that id.
'click <id>' can be followed by href or call commands in any desired order
*/
"click"[\s]+            this.begin("click");
<click>[\s\n]           this.popState();
<click>[^\s\n]*         return 'click';

"gantt"                 return 'gantt';
"dateFormat"\s[^#\n;]+  return 'dateFormat';
"inclusiveEndDates"			return 'inclusiveEndDates';
"axisFormat"\s[^#\n;]+  return 'axisFormat';
"excludes"\s[^#\n;]+    return 'excludes';
\d\d\d\d"-"\d\d"-"\d\d  return 'date';
"title"\s[^#\n;]+       return 'title';
"section"\s[^#:\n;]+    return 'section';
[^#:\n;]+             return 'taskTxt';
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
  : dateFormat {yy.setDateFormat($1.substr(11));$$=$1.substr(11);}
	| inclusiveEndDates {yy.enableInclusiveEndDates();$$=$1.substr(18);}
  | axisFormat {yy.setAxisFormat($1.substr(11));$$=$1.substr(11);}
  | excludes {yy.setExcludes($1.substr(9));$$=$1.substr(9);}
  | title {yy.setTitle($1.substr(6));$$=$1.substr(6);}
  | section {yy.addSection($1.substr(8));$$=$1.substr(8);}
  | clickStatement
  | taskTxt taskData {yy.addTask($1,$2);$$='task';}
  ;

/*
click allows any combination of href and call.
*/
clickStatement
    : click callbackname                    {$$ = $1;yy.setClickEvent($1, $2, null);}
    | click callbackname callbackargs       {$$ = $1;yy.setClickEvent($1, $2, $3);}

    | click callbackname href               {$$ = $1;yy.setClickEvent($1, $2, null);yy.setLink($1,$3);}
    | click callbackname callbackargs href  {$$ = $1;yy.setClickEvent($1, $2, $3);yy.setLink($1,$4);}

    | click href callbackname               {$$ = $1;yy.setClickEvent($1, $3, null);yy.setLink($1,$2);}
    | click href callbackname callbackargs  {$$ = $1;yy.setClickEvent($1, $3, $4);yy.setLink($1,$2);}

    | click href                            {$$ = $1;yy.setLink($1, $2);}
    ;

clickStatementDebug
    : click callbackname                    {$$=$1 + ' ' + $2;}
    | click callbackname href               {$$=$1 + ' ' + $2 + ' ' + $3;}

    | click callbackname callbackargs       {$$=$1 + ' ' + $2 + ' ' + $3;}
    | click callbackname callbackargs href  {$$=$1 + ' ' + $2 + ' ' + $3 + ' ' + $4;}

    | click href callbackname               {$$=$1 + ' ' + $2 + ' ' + $3;}
    | click href callbackname callbackargs  {$$=$1 + ' ' + $2 + ' ' + $3 + ' ' + $4;}

    | click href                            {$$=$1 + ' ' + $2;}
    ;%%
