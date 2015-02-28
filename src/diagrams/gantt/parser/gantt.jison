/** mermaid
 *  http://knsv.github.io/mermaid/
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex

%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%%

[\n]+                   return 'NL';
\s+                     /* skip whitespace */
\#[^\n]*                /* skip comments */
\%%[^\n]*               /* skip comments */
"gantt"     	        return 'gantt';
"dateFormat"\s[^#\n;]+  return 'dateFormat';
\d\d\d\d"-"\d\d"-"\d\d  return 'date';
"title"\s[^#\n;]+       return 'title';
"section"\s[^#:\n;]+    return 'section';
[^#:\n;]+               return 'taskTxt';
":"[^#\n;]+             return 'taskData';
":"                         return ':';
<<EOF>>                     return 'EOF';
.                           return 'INVALID';

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
	| title {yy.setTitle($1.substr(6));$$=$1.substr(6);}
	| section {yy.addSection($1.substr(8));$$=$1.substr(8);}
	| taskTxt taskData {yy.addTask($1,$2);$$='task';}
	;

%%