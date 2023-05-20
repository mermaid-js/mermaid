%lex
%options case-insensitive

%x string
%x string
%x md_string
%x title
%x open_directive
%x type_directive
%x arg_directive
%x close_directive
%x acc_title
%x acc_descr
%x acc_descr_multiline
%%
\%\%\{                                   { this.begin('open_directive'); return 'open_directive'; }
<open_directive>((?:(?!\}\%\%)[^:.])*)   { this.begin('type_directive'); return 'type_directive'; }
<type_directive>":"                      { this.popState(); this.begin('arg_directive'); return ':'; }
<type_directive,arg_directive>\}\%\%     { this.popState(); this.popState(); return 'close_directive'; }
<arg_directive>((?:(?!\}\%\%).|\n)*)     return 'arg_directive';
\%\%(?!\{)[^\n]*                         /* skip comments */
[^\}]\%\%[^\n]*                          /* skip comments */
[\n\r]+                                  return 'NEWLINE';
\%\%[^\n]*                               /* do nothing */

title                                    { this.begin("title");return 'title'; }
<title>(?!\n|;|#)*[^\n]*                 { this.popState(); return "title_value"; }

accTitle\s*":"\s*                        { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*             { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                        { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*             { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                        { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                { this.popState(); }
<acc_descr_multiline>[^\}]*              return "acc_descr_multiline_value";


["][`]                                   { this.begin("md_string");}
<md_string>[^`"]+                        { return "MD_STR";}
<md_string>[`]["]                        { this.popState();}
["]                                      this.begin("string");
<string>["]                              this.popState();
<string>[^"]*                            return "STR";

" "*"xychart"" "*		                   return 'XYCHART';

[A-Za-z]+                                return 'ALPHA';
":"                                      return 'COLON';
\+                                       return 'PLUS';
","                                      return 'COMMA';
"="                                      return 'EQUALS';
\=                                       return 'EQUALS';
"*"                                      return 'MULT';
\#                                       return 'BRKT';
[\_]                                     return 'UNDERSCORE';
"."                                      return 'DOT';
"&"                                      return 'AMP';
\-                                       return 'MINUS';
[0-9]+                                   return 'NUM';
\s                                       return 'SPACE';
";"                                      return 'SEMI';
[!"#$%&'*+,-.`?\\_/]                     return 'PUNCTUATION';
<<EOF>>                                  return 'EOF';

/lex

%start start

%% /* language grammar */

start
  : eol start
  | SPACE start
  | directive start
	| XYCHART document
	;

document
	: /* empty */
	| document line
	;

line
	: statement eol
	;

statement
  :
  | SPACE statement
	| directive
	;


directive
  : openDirective typeDirective closeDirective
  | openDirective typeDirective ':' argDirective closeDirective
  ;

eol
  : NEWLINE
  | SEMI
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
  : close_directive { yy.parseDirective('}%%', 'close_directive', 'quadrantChart'); }
  ;

text: alphaNumToken
    { $$={text:$1, type: 'text'};}
    | text textNoTagsToken
    { $$={text:$1.text+''+$2, type: $1.type};}
    | STR
    { $$={text: $1, type: 'text'};}
    | MD_STR
    { $$={text: $1, type: 'markdown'};}
    ;

alphaNum
    : alphaNumToken
    {$$=$1;}
    | alphaNum alphaNumToken
    {$$=$1+''+$2;}
    ;


alphaNumToken  : PUNCTUATION | AMP | NUM| ALPHA | COMMA | PLUS | EQUALS | MULT | DOT | BRKT| UNDERSCORE ;

textNoTagsToken: alphaNumToken | SPACE | MINUS;

%%
