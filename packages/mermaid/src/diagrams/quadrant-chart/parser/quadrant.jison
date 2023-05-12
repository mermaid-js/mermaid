/** mermaid
 *  https://knsv.github.io/mermaid
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */
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
%x point_start
%x point_x
%x point_y
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

" "*"x-axis"" "*                           return 'X-AXIS';
" "*"y-axis"" "*                           return 'Y-AXIS';
" "*\-\-+\>" "*                  return 'AXIS-TEXT-DELIMITER'
" "*"quadrant-1"" "*                       return 'QUADRANT_1';
" "*"quadrant-2"" "*                       return 'QUADRANT_2';
" "*"quadrant-3"" "*                       return 'QUADRANT_3';
" "*"quadrant-4"" "*                       return 'QUADRANT_4';

["][`]                                   { this.begin("md_string");}
<md_string>[^`"]+                        { return "MD_STR";}
<md_string>[`]["]                        { this.popState();}
["]                                      this.begin("string");
<string>["]                              this.popState();
<string>[^"]*                            return "STR";

\s*\:\s*\[\s*                            {this.begin("point_start"); return 'point_start';}
<point_start>(1)|(0(.\d+)?)              {this.begin('point_x'); return 'point_x';}
<point_start>\s*\]" "*                       {this.popState();}
<point_x>\s*\,\s*                        {this.popState(); this.begin('point_y');}
<point_y>(1)|(0(.\d+)?)                  {this.popState(); return 'point_y';}

" "*"quadrantChart"" "*		                   return 'QUADRANT';

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
	| QUADRANT document
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
  | axisDetails
  | quadrantDetails
  | points
	| title title_value  { $$=$2.trim();yy.setDiagramTitle($$); }
  | acc_title acc_title_value  { $$=$2.trim();yy.setAccTitle($$); }
  | acc_descr acc_descr_value  { $$=$2.trim();yy.setAccDescription($$); }
  | acc_descr_multiline_value { $$=$1.trim();yy.setAccDescription($$); }  | section {yy.addSection($1.substr(8));$$=$1.substr(8);}
	| directive
	;

points
  : text point_start point_x point_y {yy.addPoint($1, $3, $4);}
  ;

axisDetails
  : X-AXIS text AXIS-TEXT-DELIMITER text {yy.setXAxisLeftText($2); yy.setXAxisRightText($4);}
  | X-AXIS text AXIS-TEXT-DELIMITER {$2.text += $3; yy.setXAxisLeftText($2);}
  | X-AXIS text {yy.setXAxisLeftText($2);}
  | Y-AXIS text AXIS-TEXT-DELIMITER text {yy.setYAxisBottomText($2); yy.setYAxisTopText($4);}
  | Y-AXIS text AXIS-TEXT-DELIMITER {$2.text += $3; yy.setYAxisBottomText($2);}
  | Y-AXIS text {yy.setYAxisBottomText($2);}
  ;

quadrantDetails
  : QUADRANT_1 text {yy.setQuadrant1Text($2)}
  | QUADRANT_2 text {yy.setQuadrant2Text($2)}
  | QUADRANT_3 text {yy.setQuadrant3Text($2)}
  | QUADRANT_4 text {yy.setQuadrant4Text($2)}
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
