/** mermaid
 *  https://mermaidjs.github.io/
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex
%options case-insensitive

// Directive states
%x OPEN_DIRECTIVE
%x TYPE_DIRECTIVE
%x ARG_DIRECTIVE

%%

\%\%\{                                                          { this.begin('OPEN_DIRECTIVE'); return 'open_directive'; }
<OPEN_DIRECTIVE>((?:(?!\}\%\%)[^:.])*)                          { this.begin('TYPE_DIRECTIVE'); return 'type_directive'; }
<TYPE_DIRECTIVE>":"                                             { this.popState(); this.begin('ARG_DIRECTIVE'); return ':'; }
<TYPE_DIRECTIVE,ARG_DIRECTIVE>\}\%\%                            { this.popState(); this.popState(); return 'close_directive'; }
<ARG_DIRECTIVE>((?:(?!\}\%\%).|\n)*)                            return 'arg_directive';
\%%(?!\{)[^\n]*                                                 /* skip comments */
[^\}]\%\%[^\n]*                                                 /* skip comments */
[\n]+                   return 'NL';
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
	| NL { $$=[];}
	| EOF { $$=[];}
	;

directive
  : openDirective typeDirective closeDirective 'NL'
  | openDirective typeDirective ':' argDirective closeDirective 'NL'
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
  : close_directive { yy.parseDirective('}%%', 'close_directive', 'sequence'); }
  ;


