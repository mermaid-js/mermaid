/** mermaid
 *  https://knsv.github.io/mermaid
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
%lex
%options case-insensitive

%x string
%x title
%x open_directive
%x type_directive
%x arg_directive
%x close_directive

%%
\%\%\{                                                          { this.begin('open_directive'); return 'open_directive'; }
<open_directive>((?:(?!\}\%\%)[^:.])*)                          { this.begin('type_directive'); return 'type_directive'; }
<type_directive>":"                                             { this.popState(); this.begin('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%                            { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)                            return 'arg_directive';
\%\%(?!\{)[^\n]*                                                /* skip comments */
[^\}]\%\%[^\n]*                                                 /* skip comments */{ /*console.log('');*/ }
[\n\r]+                                                         return 'NEWLINE';
\%\%[^\n]*                                                      /* do nothing */
[\s]+ 		                                                      /* ignore */
title                                                           { this.begin("title");return 'title'; }
<title>(?!\n|;|#)*[^\n]*                                        { this.popState(); return "title_value"; }
["]                                                             { this.begin("string"); }
<string>["]                                                     { this.popState(); }
<string>[^"]*                                                   { return "txt"; }
"pie"		                                                        return 'PIE';
"showData"                                                      return 'showData';
":"[\s]*[\d]+(?:\.[\d]+)?                                       return "value";
<<EOF>>                                                         return 'EOF';


/lex

%start start

%% /* language grammar */

start
  : eol start
  | directive start
	| PIE document
  | PIE showData document {yy.setShowData(true);}
	;

document
	: /* empty */
	| document line
	;

line
	: statement eol { $$ = $1 }
	;

statement
  :
	| txt value          { yy.addSection($1,yy.cleanupValue($2)); }
	| title title_value  { $$=$2.trim();yy.setTitle($$); }
	| directive
	;

directive
  : openDirective typeDirective closeDirective
  | openDirective typeDirective ':' argDirective closeDirective
  ;

eol
  : NEWLINE
  | ';'
  | EOF
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
  : close_directive { yy.parseDirective('}%%', 'close_directive', 'pie'); }
  ;

%%
