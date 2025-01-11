/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2023 Knut Sveidqvist
 *  MIT license.
 */
%lex
%options case-insensitive
%x acc_title
%x acc_descr
%x acc_descr_multiline

%%

\%%(?!\{)[^\n]*                                                 /* skip comments */
[^\}]\%\%[^\n]*                                                 /* skip comments */
[\n]+                   return 'NEWLINE';
\s+                     /* skip whitespace */
\#[^\n]*                /* skip comments */

"timeline"               return 'timeline';
"title"\s[^\n]+       return 'title';
accTitle\s*":"\s*                                               { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                       { this.popState(); }
<acc_descr_multiline>[^\}]*                     return "acc_descr_multiline_value";
"section"\s[^:\n]+    return 'section';

// event starting with "==>" keyword
":"\s[^:\n]+        return 'event';
[^#:\n]+               return 'period';


<<EOF>>                 return 'EOF';
.                       return 'INVALID';

/lex

%left '^'

%start start

%% /* language grammar */

start
	: timeline document 'EOF' { return $2; }
	;

document
	: /* empty */ { $$ = [] }
	| document line {$1.push($2);$$ = $1}
	;

line
	: SPACE statement { $$ = $2 }
	| statement { $$ = $1 }
	| NEWLINE { $$=[];}
	| EOF { $$=[];}
	;

statement
  : title {yy.getCommonDb().setDiagramTitle($1.substr(6));$$=$1.substr(6);}
  | acc_title acc_title_value  { $$=$2.trim();yy.getCommonDb().setAccTitle($$); }
  | acc_descr acc_descr_value  { $$=$2.trim();yy.getCommonDb().setAccDescription($$); }
  | acc_descr_multiline_value { $$=$1.trim();yy.getCommonDb().setAccDescription($$); }
  | section {yy.addSection($1.substr(8));$$=$1.substr(8);}
  | period_statement
  | event_statement
  ;
period_statement
  : period {yy.addTask($1,0,'');$$=$1;}
;
event_statement
  : event {yy.addEvent($1.substr(2));$$=$1;}
;

%%
