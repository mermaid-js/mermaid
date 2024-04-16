%lex
%options case-insensitive

%x string
%x string
%x md_string
%x title
%x acc_title
%x acc_descr
%x acc_descr_multiline
%x point_start
%x point_x
%x point_y
%x class_name
%%
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
"classDef"                                 return 'CLASSDEF';

["][`]                                   { this.begin("md_string");}
<md_string>[^`"]+                        { return "MD_STR";}
<md_string>[`]["]                        { this.popState();}
["]                                      this.begin("string");
<string>["]                              this.popState();
<string>[^"]*                            return "STR";

\:\:\:                                   {this.begin('class_name')}
<class_name>^\w+                           {this.popState(); return 'class_name';}

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

idStringToken  :  ALPHA | NUM | NODE_STRING | DOWN | MINUS | DEFAULT | COMMA | COLON | AMP | BRKT | MULT | UNICODE_TEXT;
styleComponent: ALPHA | NUM | NODE_STRING | COLON | UNIT | SPACE | BRKT | STYLE | PCT | MINUS ;

idString
  :idStringToken
  {$$=$idStringToken}
  | idString idStringToken
  {$$=$idString+''+$idStringToken}
  ;

style: styleComponent
  |style styleComponent
  {$$ = $style + $styleComponent;}
  ;

stylesOpt: style
    {$$ = [$style.trim()]}
  | stylesOpt COMMA style
    {$stylesOpt.push($style.trim());$$ = $stylesOpt;}
  ;

classDefStatement
  : CLASSDEF SPACE idString SPACE stylesOpt {$$ = $CLASSDEF;yy.addClass($idString,$stylesOpt);}
  ;

start
  : eol start
  | SPACE start
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
  | classDefStatement {$$=[];}
  | SPACE statement
  | axisDetails
  | quadrantDetails
  | points
	| title title_value  { $$=$2.trim();yy.setDiagramTitle($$); }
  | acc_title acc_title_value  { $$=$2.trim();yy.setAccTitle($$); }
  | acc_descr acc_descr_value  { $$=$2.trim();yy.setAccDescription($$); }
  | acc_descr_multiline_value { $$=$1.trim();yy.setAccDescription($$); }  | section {yy.addSection($1.substr(8));$$=$1.substr(8);}
	;

points
  : text point_start point_x point_y {yy.addPoint($1, "", $3, $4, []);}
  | text class_name point_start point_x point_y {yy.addPoint($1, $2, $4, $5, []);}
  | text point_start point_x point_y stylesOpt {yy.addPoint($1, "", $3, $4, $stylesOpt);}
  | text class_name point_start point_x point_y stylesOpt {yy.addPoint($1, $2, $4, $5, $stylesOpt);}
  ;

axisDetails
  : X-AXIS text AXIS-TEXT-DELIMITER text {yy.setXAxisLeftText($2); yy.setXAxisRightText($4);}
  | X-AXIS text AXIS-TEXT-DELIMITER {$2.text += " ⟶ "; yy.setXAxisLeftText($2);}
  | X-AXIS text {yy.setXAxisLeftText($2);}
  | Y-AXIS text AXIS-TEXT-DELIMITER text {yy.setYAxisBottomText($2); yy.setYAxisTopText($4);}
  | Y-AXIS text AXIS-TEXT-DELIMITER {$2.text += " ⟶ "; yy.setYAxisBottomText($2);}
  | Y-AXIS text {yy.setYAxisBottomText($2);}
  ;

quadrantDetails
  : QUADRANT_1 text {yy.setQuadrant1Text($2)}
  | QUADRANT_2 text {yy.setQuadrant2Text($2)}
  | QUADRANT_3 text {yy.setQuadrant3Text($2)}
  | QUADRANT_4 text {yy.setQuadrant4Text($2)}
  ;

eol
  : NEWLINE
  | SEMI
  | EOF
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
