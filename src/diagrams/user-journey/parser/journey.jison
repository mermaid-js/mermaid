/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex
%options case-insensitive

// Directive states
%x open_directive type_directive arg_directive


%%

\%\%\{                                                          { this.begin('open_directive'); return 'open_directive'; }
<open_directive>((?:(?!\}\%\%)[^:.])*)                          { this.begin('type_directive'); return 'type_directive'; }
<type_directive>":"                                             { this.popState(); this.begin('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%                            { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)                            return 'arg_directive';
\%%(?!\{)[^\n]*                                                 /* skip comments */
[^\}]\%\%[^\n]*                                                 /* skip comments */
[\n]+                   return 'NEWLINE';
\s+                     /* skip whitespace */
\#[^\n]*                /* skip comments */

"journey"               return 'journey';
"title"\s[^#\n;]+       return 'title';
"section"\s[^#:\n;]+    return 'section';
[^#:\n;]+               return 'taskName';
":"[^#\n;]+             return 'taskData';
":"                     return ':';
<<EOF>>                 return 'EOF';
.                       return 'INVALID';

/lex

%left '^'

%start start

%% /* language grammar */

start
	: journey document 'EOF' { return $2; }
	| directive start
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

directive
  : openDirective typeDirective closeDirective 'NEWLINE'
  | openDirective typeDirective ':' argDirective closeDirective 'NEWLINE'
  ;

statement
  : title {yy.setTitle($1.substr(6));$$=$1.substr(6);}
  | section {yy.addSection($1.substr(8));$$=$1.substr(8);}
  | taskName taskData {yy.addTask($1, $2);$$='task';}
  | directive
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
  : close_directive { yy.parseDirective('}%%', 'close_directive', 'journey'); }
  ;

%%
