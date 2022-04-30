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
%x acc_title
%x acc_descr
%x acc_descr_multiline
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

accTitle\s*":"\s*                                               { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                               { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                                    { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                       { this.popState(); }
<acc_descr_multiline>[^\}]*                     return "acc_descr_multiline_value";
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
  | acc_title acc_title_value  { $$=$2.trim();yy.setTitle($$); }
  | acc_descr acc_descr_value  { $$=$2.trim();yy.setAccDescription($$); }
  | acc_descr_multiline_value { $$=$1.trim();yy.setAccDescription($$); }  | section {yy.addSection($1.substr(8));$$=$1.substr(8);}
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
